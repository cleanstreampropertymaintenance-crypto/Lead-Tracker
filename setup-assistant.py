"""
Lead Tracker - Meta Ads Manager Setup Assistant
================================================
This script automates the setup of your Meta Business API credentials
by guiding you through each step and controlling your browser.

REQUIREMENTS (install on your computer):
  pip install pyautogui pynput pillow

USAGE:
  python setup-assistant.py

It will:
  1. Open the Meta Developer portal in your browser
  2. Walk you through creating an app
  3. Help you find your Ad Account ID
  4. Generate and exchange your access token
  5. Write everything to your .env file
  6. Start the Lead Tracker server

Press Ctrl+C at any time to stop.
"""

import subprocess
import sys
import os
import time
import webbrowser
import json

# ── Colors for terminal output ──────────────────────────────────────
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

def banner():
    print(f"""
{CYAN}{BOLD}╔══════════════════════════════════════════════╗
║     Meta Ads Manager - Setup Assistant        ║
║     Lead Tracker v2.0                         ║
╚══════════════════════════════════════════════╝{RESET}
""")

def step(num, text):
    print(f"\n{GREEN}{BOLD}[Step {num}]{RESET} {BOLD}{text}{RESET}")

def info(text):
    print(f"  {CYAN}>{RESET} {text}")

def warn(text):
    print(f"  {YELLOW}!{RESET} {text}")

def error(text):
    print(f"  {RED}x{RESET} {text}")

def ask(prompt, default=None):
    suffix = f" [{default}]" if default else ""
    val = input(f"  {YELLOW}?{RESET} {prompt}{suffix}: ").strip()
    return val if val else default

def confirm(prompt):
    val = input(f"  {YELLOW}?{RESET} {prompt} (y/n): ").strip().lower()
    return val in ('y', 'yes', '')

def wait_for_enter(msg="Press Enter when ready..."):
    input(f"  {YELLOW}>{RESET} {msg}")

# ── Check dependencies ──────────────────────────────────────────────
def check_deps():
    missing = []
    try:
        import pyautogui
    except ImportError:
        missing.append("pyautogui")
    try:
        from pynput import keyboard
    except ImportError:
        missing.append("pynput")

    if missing:
        warn(f"Optional packages not installed: {', '.join(missing)}")
        warn("Mouse/keyboard automation won't be available.")
        warn(f"To install: pip install {' '.join(missing)}")
        return False
    return True

def check_node():
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        info(f"Node.js {result.stdout.strip()} found")
        return True
    except FileNotFoundError:
        error("Node.js not found! Please install it from https://nodejs.org")
        return False

# ── .env file management ────────────────────────────────────────────
def get_project_dir():
    # Find the project directory (where server.js lives)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if os.path.exists(os.path.join(script_dir, "server.js")):
        return script_dir
    # Try parent
    parent = os.path.dirname(script_dir)
    if os.path.exists(os.path.join(parent, "server.js")):
        return parent
    return script_dir

def write_env(token, account_id, port=3000):
    project_dir = get_project_dir()
    env_path = os.path.join(project_dir, ".env")
    content = f"""# Meta (Facebook) Marketing API Credentials
META_ACCESS_TOKEN={token}
META_AD_ACCOUNT_ID={account_id}
PORT={port}
"""
    with open(env_path, "w") as f:
        f.write(content)
    info(f"Saved credentials to {env_path}")

def read_env():
    project_dir = get_project_dir()
    env_path = os.path.join(project_dir, ".env")
    if not os.path.exists(env_path):
        return None, None
    token = None
    account_id = None
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("META_ACCESS_TOKEN="):
                token = line.split("=", 1)[1]
            elif line.startswith("META_AD_ACCOUNT_ID="):
                account_id = line.split("=", 1)[1]
    return token, account_id

# ── Main setup flow ─────────────────────────────────────────────────
def setup_meta_app():
    step(1, "Create a Meta Developer App")
    info("I'll open the Meta Developer portal in your browser.")
    info("You need to create an app to get API access to your ad account.")
    print()

    if confirm("Open Meta Developers portal in your browser?"):
        webbrowser.open("https://developers.facebook.com/apps/")
        print()
        info("In your browser:")
        info("  1. Log in with your Facebook account (if not already)")
        info("  2. Click 'Create App'")
        info("  3. Select 'Other' for use case, then click Next")
        info("  4. Select 'Business' as app type, then click Next")
        info("  5. Name it something like 'Lead Tracker Ads Manager'")
        info("  6. Select your Business Account and click 'Create App'")
        print()
        wait_for_enter("Press Enter once you've created the app...")
    else:
        warn("Skipping - make sure you have a Meta Developer App ready.")

def get_ad_account_id():
    step(2, "Find your Ad Account ID")
    info("I'll open your Meta Business Settings to find your Ad Account ID.")
    print()

    if confirm("Open Meta Business Settings?"):
        webbrowser.open("https://business.facebook.com/settings/ad-accounts")
        print()
        info("In your browser:")
        info("  1. Look at the left sidebar under 'Ad Accounts'")
        info("  2. Click on your ad account")
        info("  3. You'll see the Account ID (a number like 123456789)")
        print()

    account_id = ask("Paste your Ad Account ID (numbers only)")
    if account_id:
        # Ensure it has act_ prefix
        account_id = account_id.strip()
        if not account_id.startswith("act_"):
            account_id = f"act_{account_id}"
        info(f"Ad Account ID: {account_id}")
        return account_id
    else:
        error("No Ad Account ID provided.")
        return None

def get_access_token():
    step(3, "Generate your Access Token")
    info("I'll open the Graph API Explorer to generate a token.")
    print()

    if confirm("Open Graph API Explorer?"):
        webbrowser.open("https://developers.facebook.com/tools/explorer/")
        print()
        info("In the Graph API Explorer:")
        info("  1. In the top-right dropdown, select your app ('Lead Tracker Ads Manager')")
        info("  2. Click 'Generate Access Token'")
        info("  3. When prompted, grant these permissions:")
        info(f"     {BOLD}ads_management{RESET}")
        info(f"     {BOLD}ads_read{RESET}")
        info(f"     {BOLD}read_insights{RESET}")
        info("  4. Click 'Generate Access Token' again if needed")
        info("  5. Copy the token from the 'Access Token' field at the top")
        print()

    token = ask("Paste your access token here")
    if token:
        token = token.strip()
        info(f"Token: {token[:20]}...{token[-10:]}")

        # Offer to exchange for long-lived token
        print()
        info("This token expires in ~1 hour. For a longer-lasting token (60 days),")
        info("you need your App ID and App Secret.")
        print()
        if confirm("Do you want to exchange for a long-lived token?"):
            app_id = ask("App ID (from App Settings > Basic)")
            app_secret = ask("App Secret (from App Settings > Basic)")
            if app_id and app_secret:
                long_lived = exchange_token(token, app_id, app_secret)
                if long_lived:
                    token = long_lived
            else:
                warn("Skipping token exchange - using short-lived token.")
        return token
    else:
        error("No token provided.")
        return None

def exchange_token(short_token, app_id, app_secret):
    """Exchange a short-lived token for a long-lived one (60 days)."""
    import urllib.request
    import urllib.parse

    url = "https://graph.facebook.com/v21.0/oauth/access_token?" + urllib.parse.urlencode({
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_token
    })

    try:
        info("Exchanging token...")
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            if "access_token" in data:
                info(f"{GREEN}Got long-lived token (expires in ~60 days){RESET}")
                return data["access_token"]
            else:
                error(f"Token exchange failed: {data}")
                return None
    except Exception as e:
        error(f"Token exchange failed: {e}")
        warn("Using original short-lived token instead.")
        return None

def install_and_start():
    step(5, "Install dependencies and start server")
    project_dir = get_project_dir()

    # Check if node_modules exists
    nm_path = os.path.join(project_dir, "node_modules")
    if not os.path.exists(nm_path):
        info("Installing npm packages...")
        result = subprocess.run(
            ["npm", "install"],
            cwd=project_dir,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            error(f"npm install failed: {result.stderr}")
            return False
        info("Dependencies installed.")
    else:
        info("Dependencies already installed.")

    print()
    info(f"{GREEN}{BOLD}Starting Lead Tracker...{RESET}")
    info(f"Open {CYAN}http://localhost:3000{RESET} in your browser")
    info(f"Press Ctrl+C to stop the server")
    print()

    try:
        subprocess.run(["node", "server.js"], cwd=project_dir)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Server stopped.{RESET}")

    return True

# ── Quick test connection ────────────────────────────────────────────
def test_connection(token, account_id):
    step(4, "Testing Meta API connection")
    import urllib.request

    url = f"https://graph.facebook.com/v21.0/{account_id}?fields=name,account_status&access_token={token}"

    try:
        info("Connecting to Meta API...")
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            if "name" in data:
                info(f"{GREEN}Connected! Ad Account: {data['name']}{RESET}")
                status = data.get("account_status", "unknown")
                status_map = {1: "ACTIVE", 2: "DISABLED", 3: "UNSETTLED", 7: "PENDING_RISK_REVIEW", 9: "IN_GRACE_PERIOD", 100: "PENDING_CLOSURE", 101: "CLOSED"}
                info(f"Account Status: {status_map.get(status, status)}")
                return True
            elif "error" in data:
                error(f"API Error: {data['error'].get('message', 'Unknown error')}")
                return False
    except Exception as e:
        error(f"Connection failed: {e}")
        return False

# ── Entry point ──────────────────────────────────────────────────────
def main():
    banner()

    # Check for existing config
    existing_token, existing_account = read_env()
    if existing_token and existing_token != "your_meta_access_token_here":
        info("Found existing .env configuration!")
        info(f"Token: {existing_token[:20]}...")
        info(f"Account: {existing_account}")
        if not confirm("Do you want to reconfigure?"):
            if check_node():
                install_and_start()
            return

    has_automation = check_deps()
    if not check_node():
        return

    print()
    info("This assistant will walk you through connecting your Meta ad account.")
    info("You'll need:")
    info("  - A Facebook account with access to your business ad account")
    info("  - About 5 minutes")
    print()

    if not confirm("Ready to start?"):
        return

    # Step 1: Create Meta App
    setup_meta_app()

    # Step 2: Get Ad Account ID
    account_id = get_ad_account_id()
    if not account_id:
        error("Cannot continue without Ad Account ID.")
        return

    # Step 3: Get Access Token
    token = get_access_token()
    if not token:
        error("Cannot continue without Access Token.")
        return

    # Step 4: Test connection
    port = ask("Port for the server", "3000")

    # Save .env
    write_env(token, account_id, port)

    # Test API connection
    connected = test_connection(token, account_id)
    if not connected:
        warn("Connection test failed. Check your credentials.")
        if not confirm("Continue anyway?"):
            return

    # Step 5: Start server
    if confirm("Start the Lead Tracker server now?"):
        install_and_start()
    else:
        info(f"To start later, run: {BOLD}npm start{RESET}")
        info(f"Then open: {CYAN}http://localhost:{port}{RESET}")

    print(f"\n{GREEN}{BOLD}Setup complete!{RESET}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Setup cancelled.{RESET}")
