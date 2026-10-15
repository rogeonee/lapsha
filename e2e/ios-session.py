#!/usr/bin/env python3
"""Owned, disposable iOS resources for run-ios.py (Python standard library only)."""

import fcntl
import hashlib
import json
import os
from pathlib import Path
import plistlib
import secrets
import shlex
import shutil
import signal
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request


BUNDLE = "com.rogeonee.lapsha.e2e"
SOURCE_BUNDLE = "com.rogeonee.lapsha"
ROOT = Path(__file__).resolve().parent.parent


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def owned_group_members(process):
    """Select only the dedicated group created for this exact Popen instance."""
    group = getattr(process, "_lapsha_group", None)
    if group != process.pid:
        raise RuntimeError("Missing ownership record for dedicated process group")
    listing = subprocess.run(["ps", "-axo", "pid=,pgid=,stat=,lstart="],
                             text=True, capture_output=True, check=True, timeout=10)
    members = {}
    for line in listing.stdout.splitlines():
        fields = line.split(maxsplit=3)
        if len(fields) != 4 or int(fields[1]) != group:
            continue
        pid, started = int(fields[0]), fields[3].strip()
        if pid == process.pid:
            expected = getattr(process, "_lapsha_leader_start", None)
            if expected is not None and expected != started:
                raise RuntimeError("Dedicated group leader PID was reused; refusing to signal it")
            process._lapsha_leader_start = started
        if not fields[2].startswith("Z"):
            members[pid] = started
    return members


def track_process(process):
    # Both callers use start_new_session=True. Record ownership before any wait()
    # can reap the leader, so its dedicated group remains identifiable afterward.
    process._lapsha_group = process.pid
    process._lapsha_leader_start = None
    owned_group_members(process)


def member_alive(pid, group, started):
    # Verify both group and start time immediately before each individual signal.
    result = subprocess.run(["ps", "-p", str(pid), "-o", "pgid=,stat=,lstart="],
                            text=True, capture_output=True, timeout=10)
    if result.returncode not in (0, 1):
        raise RuntimeError(f"Cannot inspect owned process {pid}: {result.stderr.strip()}")
    fields = result.stdout.strip().split(maxsplit=2)
    return (len(fields) == 3 and int(fields[0]) == group
            and not fields[1].startswith("Z") and fields[2] == started)


def stop_process(process):
    """Stop exact owned PIDs, including group members orphaned by an exited leader."""
    if process is None:
        return
    errors = []
    members = {}
    try:
        members = owned_group_members(process)
    except Exception as error:
        errors.append(f"inspect owned group: {error}")
    if process.poll() is None:
        try:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=10)
        except (OSError, subprocess.TimeoutExpired) as error:
            if process.poll() is None:
                errors.append(f"stop owner {process.pid}: {error}")
    try:
        # Include children spawned while the leader was shutting down.
        members.update(owned_group_members(process))
        for pid, started in members.items():
            try:
                if member_alive(pid, process.pid, started):
                    os.kill(pid, signal.SIGTERM)
            except OSError as error:
                if member_alive(pid, process.pid, started):
                    errors.append(f"terminate member {pid}: {error}")
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            members = owned_group_members(process)
            if not members:
                break
            time.sleep(0.1)
        for pid, started in members.items():
            try:
                if member_alive(pid, process.pid, started):
                    os.kill(pid, signal.SIGKILL)
            except OSError as error:
                if member_alive(pid, process.pid, started):
                    errors.append(f"kill member {pid}: {error}")
        deadline = time.monotonic() + 2
        while members and time.monotonic() < deadline:
            members = owned_group_members(process)
            if members:
                time.sleep(0.1)
        if members:
            errors.append(f"owned process group still has live members: {sorted(members)}")
    except Exception as error:
        errors.append(f"clean owned group: {error}")
    if errors:
        raise RuntimeError("; ".join(errors))


class IOSSession:
    def __init__(self, source_app, device, port, artifacts):
        self.source_app = source_app
        self.device = device
        self.port = port
        self.artifacts = artifacts
        self.token = secrets.token_hex(24)
        self.lock = None
        self.scratch = None
        self.metro = None
        self.metro_log = None
        self.booted = False
        self.installed = False
        self.daemon_started = False
        self.log = (artifacts / "session.log").open("w", buffering=1)
        self.state = artifacts / "agent-device"
        self.session_file = artifacts / "session.json"
        self.env = dict(os.environ, **{
            "CI": "1",
            "E2E_TELEMETRY_DISABLED": "1",
            "DO_NOT_TRACK": "1",
            "EXPO_NO_TELEMETRY": "1",
            "EXPO_ROUTER_APP_ROOT": str(ROOT / "src/app"),
            "AGENT_DEVICE_STATE_DIR": str(self.state),
            "LAPSHA_E2E_DEVICE": device,
            "LAPSHA_E2E_SYNTHETIC": BUNDLE,
            "LAPSHA_E2E_METRO_URL": f"http://127.0.0.1:{port}",
            "LAPSHA_E2E_SESSION_FILE": str(self.session_file),
            "LAPSHA_E2E_SESSION_TOKEN": self.token,
        })

    def run(self, args, *, check=True, timeout=90):
        args = [str(arg) for arg in args]
        print("RUN " + shlex.join(args), file=self.log)
        result = subprocess.run(args, env=self.env, text=True, stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, timeout=timeout)
        print(result.stdout, file=self.log)
        if check and result.returncode:
            raise RuntimeError(f"{shlex.join(args[:3])} exited {result.returncode}; see session.log")
        return result

    def acquire_lock(self):
        # Stable inode across checkouts; do not unlink after unlocking (race).
        path = Path(tempfile.gettempdir()) / f"lapsha-ios-e2e-{os.getuid()}.lock"
        fd = os.open(path, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
        self.lock = os.fdopen(fd, "r+")
        try:
            fcntl.flock(self.lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            self.lock.close()
            self.lock = None
            raise RuntimeError("Another Lapsha iOS E2E session owns the lock; wait for its cleanup")
        self.lock.seek(0)
        self.lock.truncate()
        json.dump({"pid": os.getpid(), "device": self.device, "artifacts": str(self.artifacts)}, self.lock)
        self.lock.flush()

    def list_apps(self, timeout=10):
        app_listing = self.run(["xcrun", "simctl", "listapps", self.device], timeout=timeout).stdout
        # simctl versions emit either JSON or an OpenStep property list.
        converted = subprocess.run(["plutil", "-convert", "json", "-o", "-", "-"],
                                   input=app_listing, text=True, capture_output=True, timeout=timeout, check=True)
        apps = json.loads(converted.stdout)
        if not isinstance(apps, dict):
            raise RuntimeError("Unexpected simulator app registry response")
        return apps

    def uninstall_owned(self):
        if not self.installed:
            raise RuntimeError("Refusing to uninstall a clone this session does not own")
        self.run(["xcrun", "simctl", "terminate", self.device, BUNDLE], check=False)
        self.run(["xcrun", "simctl", "uninstall", self.device, BUNDLE])
        deadline = time.monotonic() + 15
        absent_since = None
        while time.monotonic() < deadline:
            if BUNDLE not in self.list_apps(timeout=5):
                now = time.monotonic()
                absent_since = now if absent_since is None else absent_since
                # iOS 27 can resurrect a stale registration after an immediate
                # shutdown. Require sustained absence while its cache settles.
                if now - absent_since >= 5:
                    self.installed = False
                    return
            else:
                absent_since = None
            time.sleep(0.5)
        raise RuntimeError("Owned clone registry removal did not settle after uninstall; leaving simulator booted")

    def start(self):
        self.acquire_lock()
        info = plistlib.loads((self.source_app / "Info.plist").read_bytes())
        if info.get("CFBundleIdentifier") != SOURCE_BUNDLE:
            raise RuntimeError(f"Source app must have bundle identifier {SOURCE_BUNDLE}")
        if "iPhoneSimulator" not in info.get("CFBundleSupportedPlatforms", []):
            raise RuntimeError("Source app must be an iOS simulator binary, not a device/store build")
        if not (self.source_app / "EXDevLauncher.bundle").is_dir():
            raise RuntimeError("Source app must contain Expo's development client (EXDevLauncher.bundle)")
        executable_name = info.get("CFBundleExecutable")
        if (not isinstance(executable_name, str) or not executable_name
                or executable_name in (".", "..") or Path(executable_name).name != executable_name):
            raise RuntimeError("Source CFBundleExecutable must be a single filename")
        executable = self.source_app / executable_name
        if executable.is_symlink() or not executable.is_file():
            raise RuntimeError("Source CFBundleExecutable must identify a regular file inside the app")
        executable_sha256 = sha256_file(executable)
        lockfile_sha256 = sha256_file(ROOT / "bun.lock")
        for binary in (ROOT / "node_modules/expo/bin/cli", ROOT / "e2e/node_modules/.bin/e2e",
                       ROOT / "e2e/node_modules/.bin/agent-device"):
            if not binary.is_file():
                raise RuntimeError(f"Missing {binary}; install app and e2e dependencies first")
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", self.port))
        devices = json.loads(self.run(["xcrun", "simctl", "list", "devices", "--json"]).stdout)
        matches = [d for group in devices["devices"].values() for d in group if d["udid"] == self.device]
        if len(matches) != 1 or not matches[0].get("isAvailable", False):
            raise RuntimeError("--device must identify an existing available simulator; no devices are created")
        device = matches[0]
        if device["state"] not in ("Shutdown", "Booted"):
            raise RuntimeError(f"Simulator is {device['state']}; wait for a stable state")
        if device["state"] == "Shutdown":
            self.run(["xcrun", "simctl", "boot", self.device])
            self.booted = True
        self.run(["xcrun", "simctl", "bootstatus", self.device, "-b"], timeout=180)
        # Never adopt/delete another session's clone, even with the same identity.
        if BUNDLE in self.list_apps():
            raise RuntimeError(f"{BUNDLE} is already installed; resolve its owner before retrying")
        self.scratch = Path(tempfile.mkdtemp(prefix="lapsha-e2e-app-"))
        self.app = self.scratch / "Lapsha.app"
        self.run(["ditto", self.source_app, self.app])
        info["CFBundleIdentifier"] = BUNDLE
        info["CFBundleDisplayName"] = "Lapsha E2E"
        info["CFBundleURLTypes"] = [{"CFBundleURLSchemes": ["lapsha-e2e", "exp+lapsha-e2e"]}]
        (self.app / "Info.plist").write_bytes(plistlib.dumps(info))
        self.run(["codesign", "--force", "--deep", "--sign", "-", self.app])
        self.run(["codesign", "--verify", "--deep", self.app])
        self.state.mkdir()
        self.metro_log = (self.artifacts / "metro.log").open("w")
        self.metro = subprocess.Popen([
            "node", "--dns-result-order=ipv4first", str(ROOT / "node_modules/expo/bin/cli"),
            "start", "--localhost", "--clear", "--port", str(self.port),
        ], cwd=ROOT, env=self.env, stdout=self.metro_log, stderr=subprocess.STDOUT, start_new_session=True)
        track_process(self.metro)
        deadline = time.monotonic() + 120
        while time.monotonic() < deadline:
            if self.metro.poll() is not None:
                raise RuntimeError("Owned Metro exited during startup; see metro.log")
            try:
                with urllib.request.urlopen(self.env["LAPSHA_E2E_METRO_URL"] + "/status", timeout=1) as response:
                    if response.read() == b"packager-status:running":
                        break
            except (urllib.error.URLError, TimeoutError):
                pass
            time.sleep(0.5)
        else:
            raise RuntimeError("Metro did not become ready within 120 seconds; see metro.log")
        listeners = self.run(["lsof", "-a", "-p", str(self.metro.pid),
                              f"-iTCP:{self.port}", "-sTCP:LISTEN", "-t"], check=False)
        if str(self.metro.pid) not in listeners.stdout.splitlines():
            raise RuntimeError("Ready Metro port is not owned by this session; refusing to use it")
        revision = self.run(["git", "-C", ROOT, "rev-parse", "HEAD"]).stdout.strip()
        dirty = bool(self.run(["git", "-C", ROOT, "status", "--porcelain"]).stdout.strip())
        provenance = {
            "pid": os.getpid(), "token": self.token, "device": self.device, "bundle": BUNDLE,
            "metroPid": self.metro.pid, "metroPort": self.port, "sourceApp": str(self.source_app),
            "sourceVersion": info.get("CFBundleShortVersionString"), "sourceBuild": info.get("CFBundleVersion"),
            "sourceExecutable": executable_name, "sourceExecutableSha256": executable_sha256,
            "bunLockSha256": lockfile_sha256,
            "javascriptRevision": revision, "javascriptDirty": dirty,
            "binaryVerification": "copied development simulator app; not a release build",
            "bootedByHarness": self.booted,
        }
        write_json(self.session_file, provenance)
        write_json(self.artifacts / "provenance.json", {key: value for key, value in provenance.items() if key != "token"})

    def reset_fixture(self):
        if self.metro.poll() is not None:
            raise RuntimeError("Owned Metro exited; see metro.log")
        if plistlib.loads((self.app / "Info.plist").read_bytes())["CFBundleIdentifier"] != BUNDLE:
            raise RuntimeError("Copied app identity changed; refusing installation")
        if self.installed:
            self.uninstall_owned()
        # Mark ownership before install so a partially successful installation is cleaned.
        self.installed = True
        self.run(["xcrun", "simctl", "install", self.device, self.app])

    def cleanup(self):
        errors = []
        install_attempted = self.installed
        clone_removed = not self.installed

        def attempt(label, operation):
            try:
                operation()
                return True
            except Exception as error:
                errors.append(f"{label}: {error}")
                return False

        if self.daemon_started:
            attempt("driver daemon", lambda: self.run([
                ROOT / "e2e/node_modules/.bin/agent-device", "daemon", "stop",
                "--state-dir", self.state, "--clean",
            ], timeout=45))
        if self.installed:
            clone_removed = attempt("uninstall clone", self.uninstall_owned)
        if self.booted and clone_removed:
            attempt("shutdown owned boot", lambda: self.run(["xcrun", "simctl", "shutdown", self.device]))
        attempt("stop Metro", lambda: stop_process(self.metro))
        if self.metro_log:
            self.metro_log.close()
        if self.scratch:
            attempt("remove app copy", lambda: shutil.rmtree(self.scratch))
        self.session_file.unlink(missing_ok=True)
        write_json(self.artifacts / "cleanup.json", {
            "errors": errors, "cloneInstallAttempted": install_attempted,
            "cloneRegistryRemovalConfirmed": install_attempted and clone_removed,
            "ownedBootShutdownAttempted": self.booted and clone_removed,
            "metroStopped": self.metro is None or self.metro.poll() is not None,
            "originalAppNeverTargetedForMutation": True,
        })
        if self.lock:
            self.lock.close()
        self.log.close()
        return errors
