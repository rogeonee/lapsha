#!/usr/bin/env python3
"""Run clean, serialized iOS development-client E2E fixtures and retain evidence."""

import argparse
from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
import re
import signal
import subprocess
import sys
import time


HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("ios_session", HERE / "ios-session.py")
session_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(session_module)


def positive_int(value):
    number = int(value)
    if number < 1:
        raise argparse.ArgumentTypeError("must be at least 1")
    return number


def validate_report(path, selected_test):
    """A zero CLI exit is insufficient: require one executed, passing selection."""
    validation = {"status": "invalid", "resultCount": None, "selectedCount": None,
                  "passedCount": None, "failedCount": None, "skippedCount": None, "errors": []}
    errors = validation["errors"]
    try:
        report = json.loads(path.read_text())
    except (OSError, ValueError) as error:
        errors.append(f"Cannot read report.json: {error}")
        return validation
    if not isinstance(report, dict) or report.get("schemaVersion") != "report-1":
        errors.append("Expected report.json schemaVersion report-1")
        return validation
    run = report.get("run")
    if not isinstance(run, dict):
        errors.append("Expected report.run object")
        return validation
    if run.get("status") != "passed":
        errors.append("Expected report.run.status passed")
    if type(run.get("exitCode")) is not int or run["exitCode"] != 0:
        errors.append("Expected report.run.exitCode 0")
    if run.get("errors") != []:
        errors.append("Expected no report.run.errors")
    results = run.get("results")
    if not isinstance(results, list) or any(not isinstance(item, dict) for item in results):
        errors.append("Expected report.run.results array of test objects")
        return validation
    validation.update({
        "resultCount": len(results),
        "selectedCount": sum(item.get("selected") is True for item in results),
        "passedCount": sum(item.get("status") == "passed" for item in results),
        "failedCount": sum(item.get("status") == "failed" for item in results),
        "skippedCount": sum(item.get("status") == "skipped" for item in results),
    })
    if len(results) != 1:
        errors.append(f"Expected exactly one result, got {len(results)}")
    else:
        result = results[0]
        if result.get("kind") != "test" or result.get("selected") is not True or result.get("status") != "passed":
            errors.append("Expected one selected test with passed status")
        report_file = result.get("file")
        if not isinstance(report_file, str) or (HERE / report_file).resolve() != selected_test.resolve():
            errors.append("Reported test file does not match --test")
    summary = run.get("summary")
    expected_counts = {"selected": 1, "executed": 1, "passed": 1, "failed": 0,
                       "skipped": 0, "interrupted": 0, "flaky": 0}
    if not isinstance(summary, dict) or any(
        type(summary.get(key)) is not int or summary[key] != count
        for key, count in expected_counts.items()
    ):
        errors.append("Expected summary with one selected/executed/passed test and zero failed/skipped/interrupted/flaky tests")
    if not errors:
        validation["status"] = "valid"
    return validation


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__, epilog="""
Prerequisites: macOS/Xcode; installed app dependencies; `bun install --cwd e2e
--frozen-lockfile`; an existing iOS simulator; and a Lapsha simulator development
app built from compatible native dependencies. This command does not build, create
devices, install dependencies, change simulator settings, or use EAS. It copies and
ad-hoc signs only the binary as com.rogeonee.lapsha.e2e, uses this checkout's Metro,
and gives each repetition a fresh app sandbox. The original app/data are untouched.
The synthetic identity must be absent before starting. A lock serializes this
harness across worktrees. Other native builds must be coordinated separately.
Evidence includes session/Metro/runner logs, per-run reports and failure screenshots.
Success requires a report-1 report containing exactly one selected, passing test
from --test, with no failed or skipped tests. Exit zero alone is not a pass.
On exit it stops owned processes, removes its app/copy, and shuts down only a device
it booted. SIGINT/SIGTERM clean up; after SIGKILL inspect the recorded resources before
removing anything. Android, release binaries and hosted CI are not verified here.
""", formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--app", type=Path, required=True, help="existing Lapsha.app simulator development binary")
    parser.add_argument("--device", required=True, help="explicit existing simulator UDID (no automatic selection)")
    parser.add_argument("--runs", type=positive_int, default=1, help="clean fixture repetitions; stop at first failure (default: 1)")
    parser.add_argument("--port", type=positive_int, default=8092, help="unused loopback Metro port (default: 8092)")
    parser.add_argument("--test", default="lifecycle.native.e2e.ts", help="test file relative to e2e/ (default: lifecycle.native.e2e.ts)")
    parser.add_argument("--timeout", type=positive_int, default=600, help="maximum seconds per test process (default: 600)")
    parser.add_argument("--artifacts", type=Path, help="new evidence directory; refuses to overwrite existing paths")
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}", args.device):
        parser.error("--device must be an explicit simulator UUID")
    args.app = args.app.expanduser().resolve()
    if not args.app.is_dir() or args.app.suffix != ".app":
        parser.error("--app must be an existing .app directory")
    args.test = (HERE / args.test).resolve()
    if not args.test.is_file() or HERE not in args.test.parents:
        parser.error("--test must be an existing file inside e2e/")
    if args.port > 65535:
        parser.error("--port must be between 1 and 65535")
    if args.artifacts is None:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
        args.artifacts = HERE / "artifacts" / stamp
    args.artifacts = args.artifacts.expanduser().resolve()
    return args


def main():
    args = parse_args()
    args.artifacts.mkdir(parents=True, exist_ok=False)
    print(f"Evidence: {args.artifacts}", flush=True)
    session = session_module.IOSSession(args.app, args.device, args.port, args.artifacts)
    results = []
    exit_code = 1

    def interrupted(_signal, _frame):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    try:
        session.start()
        for number in range(1, args.runs + 1):
            run_dir = args.artifacts / f"run-{number:02d}"
            run_dir.mkdir()
            session.reset_fixture()
            env = dict(session.env, LAPSHA_E2E_ARTIFACTS=str(run_dir))
            command = [str(HERE / "node_modules/.bin/e2e"), "run", str(args.test.relative_to(HERE)),
                       "--config", "e2e.config.ts"]
            started = time.monotonic()
            process = None
            timed_out = False
            print(f"Clean iOS run {number}/{args.runs}", flush=True)
            try:
                with (run_dir / "runner.log").open("w") as log:
                    session.daemon_started = True
                    process = subprocess.Popen(command, cwd=HERE, env=env, stdout=log,
                                               stderr=subprocess.STDOUT, start_new_session=True)
                    session_module.track_process(process)
                    try:
                        code = process.wait(timeout=args.timeout)
                    except subprocess.TimeoutExpired:
                        timed_out = True
                        code = 124
            finally:
                session_module.stop_process(process)
            runner_code = code
            report_validation = validate_report(run_dir / "report.json", args.test)
            if report_validation["status"] != "valid":
                code = code or 1
                print("Report validation failed: " + "; ".join(report_validation["errors"]), file=sys.stderr)
            result = {"run": number, "exitCode": code, "runnerExitCode": runner_code,
                      "seconds": round(time.monotonic() - started, 2),
                      "freshSyntheticInstall": True, "timedOut": timed_out,
                      "reportValidation": report_validation}
            results.append(result)
            session_module.write_json(run_dir / "result.json", result)
            print((run_dir / "runner.log").read_text(), flush=True)
            if code:
                session.run(["xcrun", "simctl", "io", args.device, "screenshot", run_dir / "failure.png"], check=False)
                exit_code = code if 0 < code < 126 else 1
                break
        else:
            exit_code = 0
    except KeyboardInterrupt:
        print("Interrupted; cleaning owned resources.", file=sys.stderr)
        exit_code = 130
    except Exception as error:
        print(f"iOS E2E failed: {error}", file=sys.stderr)
    finally:
        # A second Ctrl-C must not skip the cleanup sequence.
        signal.signal(signal.SIGINT, signal.SIG_IGN)
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        errors = session.cleanup()
        if errors:
            print("Cleanup needs attention: " + "; ".join(errors), file=sys.stderr)
            exit_code = exit_code or 1
        session_module.write_json(args.artifacts / "summary.json", {
            "requestedRuns": args.runs, "results": results, "exitCode": exit_code, "cleanupErrors": errors,
        })
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
