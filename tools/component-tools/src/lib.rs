// Component Model helpers for fastedge-build, built to wasm32-wasip2 and jco-transpiled
// into vendor/component-tools so the build needs no native binaries.
use anyhow::{Context, bail};
use wac_graph::{CompositionGraph, EncodeOptions, types::Package};
use wit_component::{DecodedWasm, WitPrinter};
use wit_parser::{self, PackageName, Resolve, WorldItem, WorldKey};

wit_bindgen::generate!({ path: "wit", world: "component-tools" });

struct Component;

impl Guest for Component {
    fn plug(socket: Vec<u8>, plugs: Vec<Vec<u8>>) -> Result<Vec<u8>, String> {
        plug(socket, plugs).map_err(|e| format!("{e:#}"))
    }

    fn import_world(components: Vec<Vec<u8>>, interfaces: Vec<String>) -> Result<String, String> {
        import_world(&components, &interfaces).map_err(|e| format!("{e:#}"))
    }

    fn imports(component: Vec<u8>) -> Result<Vec<String>, String> {
        let (resolve, world) = decode_component(&component).map_err(|e| format!("{e:#}"))?;
        Ok(resolve.worlds[world].imports.keys().map(|k| key_name(&resolve, k)).collect())
    }
}

fn plug(socket: Vec<u8>, plugs: Vec<Vec<u8>>) -> anyhow::Result<Vec<u8>> {
    let mut graph = CompositionGraph::new();
    let socket = Package::from_bytes("socket", None, socket, graph.types_mut())?;
    let socket = graph.register_package(socket)?;
    let mut plug_ids = Vec::with_capacity(plugs.len());
    for (i, bytes) in plugs.into_iter().enumerate() {
        let pkg = Package::from_bytes(&format!("plug{i}"), None, bytes, graph.types_mut())?;
        plug_ids.push(graph.register_package(pkg)?);
    }
    wac_graph::plug(&mut graph, plug_ids, socket)?;
    Ok(graph.encode(EncodeOptions::default())?)
}

fn decode_component(bytes: &[u8]) -> anyhow::Result<(Resolve, wit_parser::WorldId)> {
    match wit_component::decode(bytes)? {
        DecodedWasm::Component(resolve, world) => Ok((resolve, world)),
        DecodedWasm::WitPackage(..) => bail!("expected a component, got a WIT package"),
    }
}

fn key_name(resolve: &Resolve, key: &WorldKey) -> String {
    match key {
        WorldKey::Name(name) => name.clone(),
        WorldKey::Interface(id) => resolve.id_of(*id).unwrap_or_default(),
    }
}

fn import_world(components: &[Vec<u8>], interfaces: &[String]) -> anyhow::Result<String> {
    // Merge every component's types into one Resolve; packages with the same name dedupe.
    let mut resolve = Resolve::default();
    let mut exported = Vec::new();
    for (i, bytes) in components.iter().enumerate() {
        let (other, world) = decode_component(bytes).with_context(|| format!("component {i}"))?;
        let remap = resolve.merge(other)?;
        exported.push(remap.map_world(world, Default::default())?);
    }
    let mut missing = Vec::new();
    for name in interfaces {
        let found = exported.iter().any(|w| {
            resolve.worlds[*w].exports.iter().any(|(k, item)| {
                matches!(item, WorldItem::Interface { .. }) && key_name(&resolve, k) == *name
            })
        });
        if !found {
            missing.push(name.as_str());
        }
    }
    if !missing.is_empty() {
        bail!("no component exports {}", missing.join(", "));
    }
    // An empty host package to print as the main one; real packages go nested inside it.
    // The decoder names each component's own package `root:component`, so skip those.
    let host = resolve.packages.alloc(wit_parser::Package {
        name: PackageName { namespace: "fastedge".into(), name: "app".into(), version: None },
        docs: Default::default(),
        interfaces: Default::default(),
        worlds: Default::default(),
    });
    let nested: Vec<_> = resolve
        .packages
        .iter()
        .filter(|(id, p)| *id != host && !(p.name.namespace == "root" && p.name.name == "component"))
        .map(|(id, _)| id)
        .collect();
    let mut printer = WitPrinter::default();
    printer.print(&resolve, host, &nested)?;
    let imports: String = interfaces.iter().map(|i| format!("  import {i};\n")).collect();
    Ok(format!("{}\n\nworld app {{\n{imports}}}\n", printer.output))
}

export!(Component);
