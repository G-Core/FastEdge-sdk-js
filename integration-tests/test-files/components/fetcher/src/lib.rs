// Test component for integration-tests: makes its own outgoing HTTP request through
// wasi:http/outgoing-handler, which the FastEdge host provides.
wit_bindgen::generate!({ world: "fetcher" });

use exports::acme::net::client;
use wasip2::http::{outgoing_handler, types};
use wasip2::io::streams::StreamError;

struct Fetcher;

impl client::Guest for Fetcher {
    fn get(authority: String, path: String) -> Result<String, String> {
        let request = types::OutgoingRequest::new(types::Fields::new());
        request.set_scheme(Some(&types::Scheme::Http)).map_err(|()| "bad scheme")?;
        request.set_authority(Some(&authority)).map_err(|()| "bad authority")?;
        request.set_path_with_query(Some(&path)).map_err(|()| "bad path")?;

        let future = outgoing_handler::handle(request, None).map_err(|e| format!("{e:?}"))?;
        future.subscribe().block();
        let response = future
            .get()
            .ok_or("no response")?
            .map_err(|()| "response taken twice")?
            .map_err(|e| format!("{e:?}"))?;
        if response.status() != 200 {
            return Err(format!("status {}", response.status()));
        }

        let body = response.consume().map_err(|()| "no body")?;
        let stream = body.stream().map_err(|()| "no body stream")?;
        let mut bytes = Vec::new();
        loop {
            match stream.blocking_read(64 * 1024) {
                Ok(chunk) => bytes.extend(chunk),
                Err(StreamError::Closed) => break,
                Err(StreamError::LastOperationFailed(e)) => return Err(e.to_debug_string()),
            }
        }
        String::from_utf8(bytes).map_err(|e| e.to_string())
    }
}

export!(Fetcher);
