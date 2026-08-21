"""Pytest fixtures: run the static server for e2e tests."""
from __future__ import annotations

import glob
import itertools
import os
import shutil
import socket
import threading
import time
import urllib.request
from urllib.error import HTTPError, URLError

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "web")
SHOTS = os.path.join(HERE, "test-results", "shots")


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture(scope="session")
def browser_type_launch_args(browser_type_launch_args):
    """Use Playwright's own bundled Chromium when present; otherwise fall back
    to a pre-provisioned Chromium under PLAYWRIGHT_BROWSERS_PATH (CI/web-session
    images ship a pinned Chromium at a different revision than the installed
    Playwright expects)."""
    args = dict(browser_type_launch_args)
    if "executable_path" in args:
        return args
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            bundled = p.chromium.executable_path
        if os.path.exists(bundled):
            return args
    except Exception:
        pass
    base = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers")
    found = sorted(glob.glob(os.path.join(base, "chromium-*", "chrome-linux", "chrome")))
    if found:
        args["executable_path"] = found[-1]
    return args


@pytest.fixture(scope="session", autouse=True)
def _shots_dir():
    """Start each run with an empty test-results/shots/ so the directory only
    ever holds this run's screenshots."""
    shutil.rmtree(SHOTS, ignore_errors=True)
    os.makedirs(SHOTS, exist_ok=True)


@pytest.fixture(scope="session")
def _shot_counter():
    return itertools.count(1)


@pytest.fixture()
def shot(page, _shot_counter):
    """Save a curated full-page screenshot to test-results/shots/NN-<name>.png.

    The NN prefix is a run-wide counter, so filenames sort in the order the
    screenshots were taken."""
    def _shot(name: str) -> str:
        path = os.path.join(SHOTS, f"{next(_shot_counter):02d}-{name}.png")
        page.screenshot(path=path, full_page=True)
        return path

    return _shot


@pytest.fixture()
def server_url():
    from serve import make_server  # imported here so HERE is on sys.path

    port = _free_port()
    httpd = make_server(WEB, port)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{port}"
    for _ in range(50):
        try:
            urllib.request.urlopen(base + "/", timeout=0.2)
            break
        except HTTPError:
            break  # server is up; an HTTP status still means it's listening
        except (URLError, OSError):
            time.sleep(0.05)
    try:
        yield base
    finally:
        httpd.shutdown()
        thread.join(timeout=2)
