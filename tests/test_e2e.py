"""End-to-end tests for the SPA (Playwright, Chromium)."""
from playwright.sync_api import expect


def _wait_ready(page):
    page.wait_for_function(
        "() => window.__APP && window.__APP.ready === true", timeout=30000
    )


def test_page_loads(server_url, page, shot):
    page.goto(server_url + "/")
    _wait_ready(page)
    expect(page).to_have_title("The Magical Magician")
    expect(page.locator("h1")).to_have_text("THE MAGICAL MAGICIAN")
    shot("home")


def test_app_script_runs(server_url, page, shot):
    # The Start button opens the playable training arena.
    page.goto(server_url + "/")
    _wait_ready(page)
    expect(page.locator("#status")).to_have_text("Press start to begin your quest")
    page.get_by_role("button", name="START ADVENTURE ENTER").click()
    expect(page.locator("#game-screen")).to_have_attribute("aria-hidden", "false")
    expect(page.locator("#player")).to_be_visible()
    expect(page.locator(".enemy-zombie")).to_have_count(3)
    page.locator("#arena").click(position={"x": 300, "y": 100})
    expect(page.locator(".fireball")).to_have_count(1)
    shot("training-grounds")


def test_no_console_errors(server_url, page):
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto(server_url + "/")
    _wait_ready(page)
    assert errors == []
