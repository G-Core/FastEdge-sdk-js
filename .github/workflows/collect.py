from __future__ import annotations

import json
import os
import re
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

SOURCE_BRANCH = "doctor-v1"
TOOLKIT_SOURCE_DIR = "toolkit"
RUNTIME_SOURCE_DIR = "workflows/runtime"
TOOLKIT_TARGET_ROOT = ".toolkit"
RUNTIME_TARGET_ROOT = ".github/workflows"
TOOLKIT_SOURCE_SHA_PATH = ".toolkit/SOURCE_SHA"
RUNTIME_SOURCE_SHA_PATH = ".toolkit/DOCTOR_RUNTIME_SHA"
TOOLKIT_REQUIRED_DIRECTORIES = {
    "claude": ".toolkit/claude",
    "scripts": ".toolkit/scripts",
    "workflows": ".toolkit/workflows",
    "examples": ".toolkit/examples",
}
RUNTIME_SOURCE_FILES = [
    # Closed-set allowlist: adding a new runtime file requires updating this list
    # so doctor never silently ignores source bundle changes.
    "doctor.yml",
    "collect.py",
    "doctor-analyze.md",
    "doctor-analyze.prompt.md",
    "doctor-analyze.lock.yml",
]
RUNTIME_BOOTSTRAP_FILES = [
    "doctor.yml",
]
RUNTIME_SYNC_FILES: list[str] = []
STALE_RUNTIME_TARGET_FILES = sorted(set(RUNTIME_SOURCE_FILES) - set(RUNTIME_BOOTSTRAP_FILES))
HYGIENE_EXCLUDED_FILE_NAMES = {".DS_Store"}
HYGIENE_EXCLUDED_DIR_NAMES = {"__pycache__"}
HYGIENE_EXCLUDED_SUFFIXES = {".pyc", ".pyo"}
_TRAILER_PATTERNS = {
    "method": re.compile(r"^Method:\s*(.+)$", re.IGNORECASE),
    "agent": re.compile(r"^Agent:\s*(.+)$", re.IGNORECASE),
    "co_authored_by": re.compile(r"^Co-authored-by:\s*(.+)$", re.IGNORECASE),
    "refs": re.compile(r"^Refs:\s*(.+)$", re.IGNORECASE),
    "closes": re.compile(r"^Closes:\s*(.+)$", re.IGNORECASE),
}
PRESENCE_ONLY_PATHS = [
    "AGENTS.md",
    "CLAUDE.md",
    "DOCS.md",
    ".specify/memory/constitution.md",
    "docs/quickstart.md",
]


def _path_to_id(path: str) -> str:
    return path.strip("./").replace("/", "_").replace(".", "_")


def _path_exists(repo_root: Path, relative_path: str) -> bool:
    return (repo_root / relative_path).exists()


def _path_state(repo_root: Path, relative_path: str) -> str:
    path = repo_root / relative_path
    if path.exists():
        return "present"
    if os.path.lexists(path):
        return "broken_link"
    return "missing"


def _path_present(repo_root: Path, relative_path: str) -> bool:
    return _path_state(repo_root, relative_path) == "present"


def _is_hygiene_ignored(candidate: Path) -> bool:
    return (
        candidate.name in HYGIENE_EXCLUDED_FILE_NAMES
        or candidate.suffix in HYGIENE_EXCLUDED_SUFFIXES
        or any(part in HYGIENE_EXCLUDED_DIR_NAMES for part in candidate.parts)
    )


def _is_managed_source_file(candidate: Path) -> bool:
    return candidate.is_file() and not _is_hygiene_ignored(candidate)


def _new_finding(
    finding_id: str,
    *,
    category: str,
    severity: str,
    path: str | None,
    state: str,
    auto_action: str,
    message: str,
    expected: str | None = None,
    actual: str | None = None,
) -> dict[str, Any]:
    return {
        "id": finding_id,
        "category": category,
        "severity": severity,
        "path": path,
        "state": state,
        "expected": expected,
        "actual": actual,
        "auto_action": auto_action,
        "message": message,
    }


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def load_required_runtime_files_from_source(
    *,
    source_root: Path,
    selected_relative_paths: list[str] | tuple[str, ...] | None = None,
) -> dict[str, str]:
    source_root = Path(source_root)
    runtime_source_root = source_root / RUNTIME_SOURCE_DIR
    if not runtime_source_root.exists():
        raise FileNotFoundError(f"Runtime source root is missing: {runtime_source_root}")

    actual_relative_paths = sorted(
        candidate.relative_to(runtime_source_root).as_posix()
        for candidate in runtime_source_root.rglob("*")
        if _is_managed_source_file(candidate)
    )
    actual_path_set = set(actual_relative_paths)

    missing_sources = [
        relative_path
        for relative_path in RUNTIME_SOURCE_FILES
        if relative_path not in actual_path_set
    ]
    if missing_sources:
        missing_list = ", ".join(missing_sources)
        raise FileNotFoundError(f"Required doctor runtime source files are missing: {missing_list}")

    unexpected_sources = [
        relative_path
        for relative_path in actual_relative_paths
        if relative_path not in RUNTIME_SOURCE_FILES
    ]
    if unexpected_sources:
        unexpected_list = ", ".join(unexpected_sources)
        raise RuntimeError(
            "Unexpected doctor runtime source files found: "
            f"{unexpected_list}. Update RUNTIME_SOURCE_FILES to manage them explicitly."
        )

    selected_relative_paths = list(RUNTIME_SYNC_FILES if selected_relative_paths is None else selected_relative_paths)
    return {
        f"{RUNTIME_TARGET_ROOT}/{relative_path}": _read_text(runtime_source_root / relative_path)
        for relative_path in selected_relative_paths
    }


def _read_sha_marker(repo_root: Path, relative_path: str) -> str | None:
    marker_path = repo_root / relative_path
    if not marker_path.exists():
        return None

    raw = marker_path.read_text(encoding="utf-8").strip()
    return raw or None


def _resolve_source_sha(source_root: Path, explicit_source_sha: str | None) -> str:
    if explicit_source_sha:
        return explicit_source_sha.strip()

    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=source_root,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Unable to resolve source SHA from {source_root}")

    return result.stdout.strip()


def build_expected_manifest_stub() -> dict[str, Any]:
    return {
        "source_branch": SOURCE_BRANCH,
        "source_sha": "",
        "managed_root": TOOLKIT_TARGET_ROOT,
        "managed_directories": list(TOOLKIT_REQUIRED_DIRECTORIES.values()),
        "managed_files": {},
        "runtime_root": RUNTIME_TARGET_ROOT,
        "runtime_files": {},
        "runtime_bootstrap_files": {},
        "presence_paths": list(PRESENCE_ONLY_PATHS),
    }


def build_expected_manifest_from_source(
    *,
    source_root: Path,
    source_sha: str | None = None,
    source_branch: str = SOURCE_BRANCH,
) -> dict[str, Any]:
    source_root = Path(source_root)
    if not source_root.exists():
        raise FileNotFoundError(f"Source root is missing: {source_root}")

    resolved_source_sha = _resolve_source_sha(source_root, source_sha)
    toolkit_source_root = source_root / TOOLKIT_SOURCE_DIR
    runtime_source_root = source_root / RUNTIME_SOURCE_DIR
    if not toolkit_source_root.exists():
        raise FileNotFoundError(f"Toolkit source root is missing: {toolkit_source_root}")
    if not runtime_source_root.exists():
        raise FileNotFoundError(f"Runtime source root is missing: {runtime_source_root}")

    managed_files: dict[str, str] = {}
    managed_directories = sorted(
        f"{TOOLKIT_TARGET_ROOT}/{candidate.name}"
        for candidate in toolkit_source_root.iterdir()
        if candidate.is_dir() and candidate.name not in HYGIENE_EXCLUDED_FILE_NAMES
    )

    for source_file in sorted(candidate for candidate in toolkit_source_root.rglob("*") if _is_managed_source_file(candidate)):
        relative_path = source_file.relative_to(toolkit_source_root).as_posix()
        managed_files[f"{TOOLKIT_TARGET_ROOT}/{relative_path}"] = _read_text(source_file)

    managed_files[TOOLKIT_SOURCE_SHA_PATH] = f"{resolved_source_sha}\n"
    managed_files[RUNTIME_SOURCE_SHA_PATH] = f"{resolved_source_sha}\n"
    runtime_files = load_required_runtime_files_from_source(
        source_root=source_root,
        selected_relative_paths=RUNTIME_SYNC_FILES,
    )
    runtime_bootstrap_files = load_required_runtime_files_from_source(
        source_root=source_root,
        selected_relative_paths=RUNTIME_BOOTSTRAP_FILES,
    )

    return {
        "source_branch": source_branch,
        "source_sha": resolved_source_sha,
        "managed_root": TOOLKIT_TARGET_ROOT,
        "managed_directories": managed_directories,
        "managed_files": managed_files,
        "runtime_root": RUNTIME_TARGET_ROOT,
        "runtime_files": runtime_files,
        "runtime_bootstrap_files": runtime_bootstrap_files,
        "presence_paths": list(PRESENCE_ONLY_PATHS),
    }


def build_compliance_checks(*, repo_root: Path) -> dict[str, dict[str, bool]]:
    repo_root = Path(repo_root)

    return {
        "required_paths": {
            "agents_present": _path_present(repo_root, "AGENTS.md"),
            "claude_present": _path_present(repo_root, "CLAUDE.md"),
            "docs_md_present": _path_present(repo_root, "DOCS.md"),
            "constitution_present": _path_present(repo_root, ".specify/memory/constitution.md"),
            "quickstart_present": _path_present(repo_root, "docs/quickstart.md"),
        },
        "toolkit": {
            "root_present": (repo_root / TOOLKIT_TARGET_ROOT).is_dir(),
            "source_sha_present": _path_exists(repo_root, TOOLKIT_SOURCE_SHA_PATH),
            "runtime_sha_present": _path_exists(repo_root, RUNTIME_SOURCE_SHA_PATH),
            "claude_present": (repo_root / TOOLKIT_REQUIRED_DIRECTORIES["claude"]).is_dir(),
            "scripts_present": (repo_root / TOOLKIT_REQUIRED_DIRECTORIES["scripts"]).is_dir(),
            "workflows_present": (repo_root / TOOLKIT_REQUIRED_DIRECTORIES["workflows"]).is_dir(),
            "examples_present": (repo_root / TOOLKIT_REQUIRED_DIRECTORIES["examples"]).is_dir(),
        },
        "doctor_runtime": {
            "doctor_yml_present": _path_exists(repo_root, f"{RUNTIME_TARGET_ROOT}/doctor.yml"),
        },
    }


def _iter_relative_entries(repo_root: Path, subtree_root: str) -> dict[str, str]:
    root = repo_root / subtree_root
    if not root.exists():
        return {}

    entries: dict[str, str] = {}
    for candidate in root.rglob("*"):
        if _is_hygiene_ignored(candidate):
            continue
        if candidate.is_file():
            entries[candidate.relative_to(repo_root).as_posix()] = "present"
            continue
        if candidate.is_symlink() and not candidate.exists():
            entries[candidate.relative_to(repo_root).as_posix()] = "broken_link"
    return entries


def _compare_expected_files(
    *,
    repo_root: Path,
    expected_files: dict[str, str],
    category: str,
    change_message_prefix: str,
    auto_action: str = "act",
    missing_severity: str = "error",
    changed_severity: str = "warning",
    broken_link_severity: str = "error",
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []

    for relative_path, expected_content in expected_files.items():
        file_state = _path_state(repo_root, relative_path)
        if file_state == "missing":
            findings.append(
                _new_finding(
                    f"{category}.{_path_to_id(relative_path)}.missing",
                    category=category,
                    severity=missing_severity,
                    path=relative_path,
                    state="missing",
                    auto_action=auto_action,
                    message=f"{change_message_prefix} is missing: {relative_path}",
                    expected=expected_content,
                )
            )
            continue
        if file_state == "broken_link":
            findings.append(
                _new_finding(
                    f"{category}.{_path_to_id(relative_path)}.broken_link",
                    category=category,
                    severity=broken_link_severity,
                    path=relative_path,
                    state="broken_link",
                    auto_action=auto_action,
                    message=f"{change_message_prefix} is a broken symlink: {relative_path}",
                    expected=expected_content,
                )
            )
            continue

        file_path = repo_root / relative_path
        actual_content = file_path.read_text(encoding="utf-8").rstrip("\n")
        if actual_content != str(expected_content).rstrip("\n"):
            findings.append(
                _new_finding(
                    f"{category}.{_path_to_id(relative_path)}.changed",
                    category=category,
                    severity=changed_severity,
                    path=relative_path,
                    state="changed",
                    auto_action=auto_action,
                    message=f"{change_message_prefix} content differs: {relative_path}",
                    expected=str(expected_content),
                    actual=actual_content,
                )
            )

    return findings


def scan_repository_files(*, repo_root: Path, expected_manifest: dict[str, Any]) -> dict[str, Any]:
    repo_root = Path(repo_root)
    managed_files: dict[str, str] = dict(expected_manifest.get("managed_files", {}))
    runtime_files: dict[str, str] = dict(expected_manifest.get("runtime_files", {}))
    runtime_bootstrap_files: dict[str, str] = dict(expected_manifest.get("runtime_bootstrap_files", {}))
    managed_root = str(expected_manifest.get("managed_root") or TOOLKIT_TARGET_ROOT)
    presence_paths: list[str] = list(expected_manifest.get("presence_paths", PRESENCE_ONLY_PATHS))
    checks = build_compliance_checks(repo_root=repo_root)

    findings = [
        *_compare_expected_files(
            repo_root=repo_root,
            expected_files=managed_files,
            category="managed",
            change_message_prefix="Managed path",
        ),
        *_compare_expected_files(
            repo_root=repo_root,
            expected_files=runtime_files,
            category="runtime",
            change_message_prefix="Doctor runtime path",
        ),
        *_compare_expected_files(
            repo_root=repo_root,
            expected_files=runtime_bootstrap_files,
            category="observed",
            change_message_prefix="Doctor bootstrap",
            auto_action="none",
            missing_severity="warning",
            changed_severity="warning",
            broken_link_severity="warning",
        ),
    ]

    managed_expected_paths = set(managed_files)
    managed_actual_entries = _iter_relative_entries(repo_root, managed_root)
    for actual_path in sorted(set(managed_actual_entries) - managed_expected_paths):
        actual_state = managed_actual_entries[actual_path]
        if actual_state == "broken_link":
            findings.append(
                _new_finding(
                    f"managed.{_path_to_id(actual_path)}.broken_link",
                    category="managed",
                    severity="error",
                    path=actual_path,
                    state="broken_link",
                    auto_action="act",
                    message=f"Unexpected extra managed path is a broken symlink: {actual_path}",
                )
            )
            continue
        findings.append(
            _new_finding(
                f"managed.{_path_to_id(actual_path)}.unexpected_extra",
                category="managed",
                severity="warning",
                path=actual_path,
                state="unexpected_extra",
                auto_action="act",
                message=f"Unexpected extra managed path present: {actual_path}",
            )
        )

    for presence_path in presence_paths:
        presence_state = _path_state(repo_root, presence_path)
        if presence_state == "present":
            continue
        if presence_state == "broken_link":
            findings.append(
                _new_finding(
                    f"observed.{_path_to_id(presence_path)}.broken_link",
                    category="observed",
                    severity="warning",
                    path=presence_path,
                    state="broken_link",
                    auto_action="analyze",
                    message=f"Required path is a broken symlink: {presence_path}",
                )
            )
            continue
        findings.append(
            _new_finding(
                f"observed.{_path_to_id(presence_path)}.missing",
                category="observed",
                severity="warning",
                path=presence_path,
                state="missing",
                auto_action="analyze",
                message=f"Required path is missing: {presence_path}",
            )
        )

    for relative_name in STALE_RUNTIME_TARGET_FILES:
        stale_path = f"{RUNTIME_TARGET_ROOT}/{relative_name}"
        stale_state = _path_state(repo_root, stale_path)
        if stale_state == "missing":
            continue
        if stale_state == "broken_link":
            findings.append(
                _new_finding(
                    f"observed.{_path_to_id(stale_path)}.broken_link",
                    category="observed",
                    severity="warning",
                    path=stale_path,
                    state="broken_link",
                    auto_action="none",
                    message=f"Stale doctor runtime path must be removed manually: {stale_path}",
                )
            )
            continue
        findings.append(
            _new_finding(
                f"observed.{_path_to_id(stale_path)}.stale",
                category="observed",
                severity="warning",
                path=stale_path,
                state="stale",
                auto_action="none",
                message=f"Stale doctor runtime path must be removed manually: {stale_path}",
            )
        )

    return {
        "checks": checks,
        "findings": findings,
        "managed_drift_present": any(item["category"] == "managed" for item in findings),
        "runtime_drift_present": any(item["category"] == "runtime" for item in findings),
        "observed_findings_present": any(item["category"] == "observed" for item in findings),
    }


def select_act_reason(flags: dict[str, bool]) -> str:
    priority = [
        "toolkit_missing",
        "source_sha_missing",
        "runtime_sha_missing",
        "managed_drift",
    ]

    for reason in priority:
        if flags.get(reason, False):
            return reason
    if flags.get("operational_error", False):
        return "operational_error"
    return "healthy"


def enrich_commit_record_with_trailers(commit_payload: dict[str, Any]) -> dict[str, Any]:
    message = str(commit_payload.get("message", ""))
    parse_message = message.replace("\\n", "\n")

    method: str | None = None
    agent: str | None = None
    co_authored_by: list[str] = []
    refs: list[str] = []
    closes: list[str] = []

    for line in parse_message.splitlines():
        line = line.strip()
        if not line:
            continue

        method_match = _TRAILER_PATTERNS["method"].match(line)
        if method_match:
            method = method_match.group(1).strip()
            continue

        agent_match = _TRAILER_PATTERNS["agent"].match(line)
        if agent_match:
            agent = agent_match.group(1).strip()
            continue

        co_author_match = _TRAILER_PATTERNS["co_authored_by"].match(line)
        if co_author_match:
            co_authored_by.append(co_author_match.group(1).strip())
            continue

        refs_match = _TRAILER_PATTERNS["refs"].match(line)
        if refs_match:
            refs.append(refs_match.group(1).strip())
            continue

        closes_match = _TRAILER_PATTERNS["closes"].match(line)
        if closes_match:
            closes.append(closes_match.group(1).strip())

    return {
        "sha": commit_payload.get("sha"),
        "author": commit_payload.get("author"),
        "authored_at": commit_payload.get("authored_at"),
        "message": message,
        "method": method,
        "agent": agent,
        "co_authored_by": co_authored_by,
        "refs": refs,
        "closes": closes,
    }


def build_activity_sections(
    *,
    daily_commits: list[dict[str, Any]],
    daily_prs: list[dict[str, Any]],
    daily_issues: list[dict[str, Any]],
    snapshot_prs: list[dict[str, Any]],
    snapshot_issues: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "activity": {
            "commits": list(daily_commits),
            "prs": list(daily_prs),
            "issues": list(daily_issues),
        },
        "snapshot": {
            "prs": list(snapshot_prs),
            "issues": list(snapshot_issues),
        },
    }


def _build_environment_findings(*, issues_enabled: bool) -> list[dict[str, Any]]:
    if issues_enabled:
        return []

    return [
        _new_finding(
            "operational.issues_disabled",
            category="operational",
            severity="warning",
            path=None,
            state="issues_disabled",
            auto_action="none",
            message="Issues are disabled in the target repository",
        )
    ]


def _stringify_bool(value: bool) -> str:
    return "true" if value else "false"


def _parse_bool(value: str | bool | None, *, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _rfc3339_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _default_window(report_date: str) -> tuple[str, str]:
    report_start = datetime.strptime(report_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    window_from = report_start - timedelta(days=1)
    return (
        window_from.isoformat().replace("+00:00", "Z"),
        report_start.isoformat().replace("+00:00", "Z"),
    )


def _load_json_source(
    *,
    env_var: str,
    path_env_var: str,
    default: Any,
) -> Any:
    path_value = os.getenv(path_env_var)
    if path_value:
        return json.loads(Path(path_value).read_text(encoding="utf-8"))

    raw_value = os.getenv(env_var)
    if raw_value:
        return json.loads(raw_value)

    return default


def resolve_source_state(*, repo_root: Path, expected_manifest: dict[str, Any]) -> dict[str, Any]:
    repo_root = Path(repo_root)
    source_branch = str(expected_manifest.get("source_branch") or SOURCE_BRANCH)
    source_sha = str(expected_manifest.get("source_sha") or "").strip()
    findings: list[dict[str, Any]] = []

    if not source_sha:
        findings.append(
            _new_finding(
                "operational.source_manifest_unavailable",
                category="operational",
                severity="error",
                path=None,
                state="source_manifest_unavailable",
                auto_action="none",
                message="Collect did not receive a valid source manifest from the configured source ref",
            )
        )

    return {
        "source_branch": source_branch,
        "source_sha": source_sha,
        "installed_source_sha": _read_sha_marker(repo_root, TOOLKIT_SOURCE_SHA_PATH),
        "installed_runtime_sha": _read_sha_marker(repo_root, RUNTIME_SOURCE_SHA_PATH),
        "fatal_error": not bool(source_sha),
        "findings": findings,
    }


def build_job_outputs(
    *,
    report_date: str,
    source_sha: str | None,
    installed_source_sha: str | None,
    installed_runtime_sha: str | None,
    should_act: bool,
    act_reason: str,
    issues_enabled: bool,
    observed_findings_present: bool,
    analyze_day: str | None = None,
    report_tz: str | None = None,
) -> dict[str, str]:
    outputs = {
        "should_act": _stringify_bool(should_act),
        "source_sha": source_sha or "",
        "installed_source_sha": installed_source_sha or "",
        "installed_runtime_sha": installed_runtime_sha or "",
        "act_reason": act_reason,
        "issues_enabled": _stringify_bool(issues_enabled),
        "observed_findings_present": _stringify_bool(observed_findings_present),
        "stats_artifact_name": f"doctor-stats-{report_date}",
        "findings_artifact_name": f"doctor-findings-{report_date}",
    }

    if analyze_day is not None:
        outputs["analyze_day"] = analyze_day
    if report_tz is not None:
        outputs["report_tz"] = report_tz

    return outputs


def assemble_collect_result(
    *,
    repo_root: Path,
    expected_manifest: dict[str, Any],
    issues_enabled: bool,
    repo_full_name: str,
    repo_default_branch: str,
    workflow_name: str,
    workflow_run_id: int,
    workflow_run_attempt: int,
    workflow_event_name: str,
    workflow_actor: str,
    source_repo_full_name: str,
    analyze_day: str | None,
    report_tz: str | None,
    collected_at: str,
    report_date: str,
    window_from: str,
    window_to: str,
    daily_commits: list[dict[str, Any]] | None = None,
    daily_prs: list[dict[str, Any]] | None = None,
    daily_issues: list[dict[str, Any]] | None = None,
    snapshot_prs: list[dict[str, Any]] | None = None,
    snapshot_issues: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    repo_root = Path(repo_root)
    source_state = resolve_source_state(repo_root=repo_root, expected_manifest=expected_manifest)
    scan_result = scan_repository_files(repo_root=repo_root, expected_manifest=expected_manifest)
    environment_findings = _build_environment_findings(issues_enabled=issues_enabled)

    flags = {
        "toolkit_missing": not (repo_root / TOOLKIT_TARGET_ROOT).is_dir(),
        "source_sha_missing": not _path_exists(repo_root, TOOLKIT_SOURCE_SHA_PATH),
        "runtime_sha_missing": not _path_exists(repo_root, RUNTIME_SOURCE_SHA_PATH),
        "managed_drift": scan_result["managed_drift_present"],
        "operational_error": source_state["fatal_error"],
    }

    should_act = any(
        flags[name]
        for name in (
            "toolkit_missing",
            "source_sha_missing",
            "runtime_sha_missing",
            "managed_drift",
        )
    )
    if flags["operational_error"]:
        should_act = False

    if should_act:
        act_reason = select_act_reason(flags)
    elif flags["operational_error"]:
        act_reason = "operational_error"
    else:
        act_reason = "healthy"

    findings = [
        *source_state["findings"],
        *scan_result["findings"],
        *environment_findings,
    ]

    normalized_commits = [
        enrich_commit_record_with_trailers(commit)
        if any(field not in commit for field in ("method", "agent", "co_authored_by", "refs", "closes"))
        else dict(commit)
        for commit in (daily_commits or [])
    ]
    activity_sections = build_activity_sections(
        daily_commits=normalized_commits,
        daily_prs=list(daily_prs or []),
        daily_issues=list(daily_issues or []),
        snapshot_prs=list(snapshot_prs or []),
        snapshot_issues=list(snapshot_issues or []),
    )

    job_outputs = build_job_outputs(
        report_date=report_date,
        source_sha=source_state["source_sha"],
        installed_source_sha=source_state["installed_source_sha"],
        installed_runtime_sha=source_state["installed_runtime_sha"],
        should_act=should_act,
        act_reason=act_reason,
        issues_enabled=issues_enabled,
        observed_findings_present=scan_result["observed_findings_present"],
        analyze_day=analyze_day,
        report_tz=report_tz,
    )

    contract_payload = {
        "managed_root": str(expected_manifest.get("managed_root") or TOOLKIT_TARGET_ROOT),
        "managed_directories": list(
            expected_manifest.get("managed_directories", TOOLKIT_REQUIRED_DIRECTORIES.values())
        ),
        "runtime_root": str(expected_manifest.get("runtime_root") or RUNTIME_TARGET_ROOT),
        "runtime_files": sorted(expected_manifest.get("runtime_files", {}).keys()),
        "presence_paths": list(expected_manifest.get("presence_paths", PRESENCE_ONLY_PATHS)),
    }

    stats_payload: dict[str, Any] | None = None
    if not source_state["fatal_error"]:
        stats_payload = {
            "schema_version": "doctor-stats/v3",
            "collected_at": collected_at,
            "report_date": report_date,
            "window": {
                "from": window_from,
                "to": window_to,
            },
            "repo": {
                "full_name": repo_full_name,
                "default_branch": repo_default_branch,
            },
            "workflow": {
                "name": workflow_name,
                "run_id": workflow_run_id,
                "run_attempt": workflow_run_attempt,
                "event_name": workflow_event_name,
                "actor": workflow_actor,
            },
            "source_repo": {
                "full_name": source_repo_full_name,
                "source_branch": source_state["source_branch"],
                "source_sha": source_state["source_sha"],
            },
            "toolkit": {
                "installed_source_sha": source_state["installed_source_sha"],
            },
            "doctor_runtime": {
                "installed_source_sha": source_state["installed_runtime_sha"],
            },
            "contract": contract_payload,
            **activity_sections,
        }

    findings_payload = {
        "schema_version": "doctor-findings/v4",
        "collected_at": collected_at,
        "report_date": report_date,
        "repo": {
            "full_name": repo_full_name,
            "default_branch": repo_default_branch,
        },
        "source_repo": {
            "full_name": source_repo_full_name,
            "source_branch": source_state["source_branch"],
            "source_sha": source_state["source_sha"],
        },
        "toolkit": {
            "installed_source_sha": source_state["installed_source_sha"],
        },
        "doctor_runtime": {
            "installed_source_sha": source_state["installed_runtime_sha"],
        },
        "decision": {
            "should_act": should_act,
            "act_reason": act_reason,
            "managed_drift_present": scan_result["managed_drift_present"],
            "runtime_drift_present": scan_result["runtime_drift_present"],
            "observed_findings_present": scan_result["observed_findings_present"],
        },
        "contract": contract_payload,
        "checks": scan_result["checks"],
        "findings": findings,
    }

    return {
        "fatal_error": source_state["fatal_error"],
        "job_outputs": job_outputs,
        "stats_payload": stats_payload,
        "findings_payload": findings_payload,
    }


def _write_json_file(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(f"{json.dumps(payload, indent=2)}\n", encoding="utf-8")


def _write_github_output(outputs: dict[str, str]) -> None:
    github_output = os.getenv("GITHUB_OUTPUT")
    if not github_output:
        return

    with Path(github_output).open("a", encoding="utf-8") as handle:
        for key, value in outputs.items():
            handle.write(f"{key}={value}\n")


def main() -> int:
    repo_root = Path(os.getenv("DOCTOR_REPO_ROOT", ".")).resolve()
    output_dir = Path(os.getenv("DOCTOR_OUTPUT_DIR", ".")).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    collected_at = os.getenv("DOCTOR_COLLECTED_AT", _rfc3339_now())
    report_date = os.getenv("DOCTOR_REPORT_DATE", collected_at[:10])
    default_window_from, default_window_to = _default_window(report_date)

    source_root = os.getenv("DOCTOR_SOURCE_ROOT")
    if source_root:
        expected_manifest = build_expected_manifest_from_source(
            source_root=Path(source_root).resolve(),
            source_sha=os.getenv("DOCTOR_SOURCE_SHA") or None,
            source_branch=os.getenv("DOCTOR_SOURCE_BRANCH", SOURCE_BRANCH),
        )
    else:
        expected_manifest = _load_json_source(
            env_var="DOCTOR_EXPECTED_MANIFEST",
            path_env_var="DOCTOR_EXPECTED_MANIFEST_PATH",
            default={},
        )

    activity_payload = _load_json_source(
        env_var="DOCTOR_ACTIVITY",
        path_env_var="DOCTOR_ACTIVITY_PATH",
        default={},
    )

    result = assemble_collect_result(
        repo_root=repo_root,
        expected_manifest=expected_manifest,
        issues_enabled=_parse_bool(os.getenv("DOCTOR_ISSUES_ENABLED"), default=True),
        repo_full_name=os.getenv("DOCTOR_REPO_FULL_NAME", os.getenv("GITHUB_REPOSITORY", "")),
        repo_default_branch=os.getenv("DOCTOR_REPO_DEFAULT_BRANCH", "main"),
        workflow_name=os.getenv("GITHUB_WORKFLOW", "doctor"),
        workflow_run_id=int(os.getenv("GITHUB_RUN_ID", "0")),
        workflow_run_attempt=int(os.getenv("GITHUB_RUN_ATTEMPT", "0")),
        workflow_event_name=os.getenv("GITHUB_EVENT_NAME", "workflow_dispatch"),
        workflow_actor=os.getenv("GITHUB_ACTOR", ""),
        source_repo_full_name=os.getenv("DOCTOR_SOURCE_REPO", "G-Core/agent-toolkit"),
        analyze_day=os.getenv("DOCTOR_ANALYZE_DAY"),
        report_tz=os.getenv("DOCTOR_REPORT_TZ"),
        collected_at=collected_at,
        report_date=report_date,
        window_from=os.getenv("DOCTOR_WINDOW_FROM", default_window_from),
        window_to=os.getenv("DOCTOR_WINDOW_TO", default_window_to),
        daily_commits=activity_payload.get("commits", []),
        daily_prs=activity_payload.get("prs", []),
        daily_issues=activity_payload.get("issues", []),
        snapshot_prs=activity_payload.get("snapshot_prs", []),
        snapshot_issues=activity_payload.get("snapshot_issues", []),
    )

    findings_path = output_dir / "doctor-findings.json"
    _write_json_file(findings_path, result["findings_payload"])

    if result["stats_payload"] is not None:
        _write_json_file(output_dir / "doctor-stats.json", result["stats_payload"])

    _write_github_output(result["job_outputs"])
    return 1 if result["fatal_error"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
