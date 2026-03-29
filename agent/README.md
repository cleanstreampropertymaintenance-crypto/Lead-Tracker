# Lead Tracker AI Agent - Full Setup Guide

A conversational AI assistant that can **see your screen** and **control your mouse and keyboard** to help you set up and manage your Meta Ads Manager - or do anything else on your computer.

---

## Table of Contents

1. [What You Need Before Starting](#what-you-need-before-starting)
2. [Step 1: Install Python](#step-1-install-python)
3. [Step 2: Download the Project](#step-2-download-the-project)
4. [Step 3: Install Node.js](#step-3-install-nodejs)
5. [Step 4: Get Your Anthropic API Key](#step-4-get-your-anthropic-api-key)
6. [Step 5: Install the Agent Dependencies](#step-5-install-the-agent-dependencies)
7. [Step 6: Set Your API Key](#step-6-set-your-api-key)
8. [Step 7: Run the Agent](#step-7-run-the-agent)
9. [How to Use the Agent](#how-to-use-the-agent)
10. [Troubleshooting](#troubleshooting)

---

## What You Need Before Starting

- A computer running **Windows 10/11**, **macOS**, or **Linux**
- An internet connection
- About 15 minutes
- A credit card for the Anthropic API (it costs roughly $0.01-0.05 per action the agent takes)

---

## Step 1: Install Python

The agent is written in Python. You need Python 3.10 or newer.

### Windows

1. Open your web browser
2. Go to **python.org/downloads**
3. Click the big yellow **"Download Python 3.x.x"** button
4. Run the downloaded installer
5. **IMPORTANT**: On the first screen of the installer, check the box that says **"Add Python to PATH"** at the bottom. This is critical.
6. Click **"Install Now"**
7. Wait for it to finish, then click **"Close"**

**Verify it worked:** Open Command Prompt (press Windows key, type `cmd`, press Enter) and type:
```
python --version
```
You should see something like `Python 3.12.x`. If you see an error, restart your computer and try again.

### macOS

1. Open your web browser
2. Go to **python.org/downloads**
3. Click the big yellow **"Download Python 3.x.x"** button
4. Open the downloaded `.pkg` file
5. Click through the installer (Next, Next, Install, etc.)
6. Enter your Mac password when asked

**Verify it worked:** Open Terminal (press Cmd+Space, type `Terminal`, press Enter) and type:
```
python3 --version
```
You should see something like `Python 3.12.x`.

### Linux

Python is usually already installed. Open a terminal and check:
```bash
python3 --version
```
If not installed:
```bash
sudo apt update && sudo apt install python3 python3-pip
```

---

## Step 2: Download the Project

### Option A: Download as ZIP (Easiest)

1. Go to **github.com/cleanstreampropertymaintenance-crypto/Lead-Tracker**
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Extract/unzip the folder to somewhere easy to find, like your Desktop or Documents folder
5. Remember where you put it - you'll need the path later

### Option B: Clone with Git

If you have Git installed (or want to install it from **git-scm.com**):

**Windows** (in Command Prompt):
```
cd %USERPROFILE%\Desktop
git clone https://github.com/cleanstreampropertymaintenance-crypto/Lead-Tracker.git
```

**macOS/Linux** (in Terminal):
```bash
cd ~/Desktop
git clone https://github.com/cleanstreampropertymaintenance-crypto/Lead-Tracker.git
```

---

## Step 3: Install Node.js

Node.js runs the Lead Tracker web app and the Meta Ads Manager backend.

1. Go to **nodejs.org**
2. Download the **LTS** version (the button on the left)
3. Run the installer - click through everything with the default options
4. Restart your terminal/command prompt after installing

**Verify it worked:**
```
node --version
npm --version
```
Both should print version numbers.

---

## Step 4: Get Your Anthropic API Key

This is the key that lets the agent talk to Claude (the AI brain). It costs money per use, but it's cheap - roughly $0.01-0.05 per action.

1. Go to **console.anthropic.com**
2. Click **"Sign Up"** if you don't have an account, or **"Log In"** if you do
3. Once logged in, you need to add billing:
   - Click on **"Settings"** (gear icon) in the left sidebar
   - Click **"Billing"**
   - Click **"Add Payment Method"**
   - Enter your credit card info
   - Add at least **$5** in credits (this will last a long time - hundreds of agent actions)
4. Now get your API key:
   - Click on **"API Keys"** in the left sidebar
   - Click **"Create Key"**
   - Give it a name like **"Lead Tracker Agent"**
   - **IMPORTANT: Copy the key immediately!** It starts with `sk-ant-` and you can only see it once.
   - Save it somewhere safe (paste it in a notes app temporarily)

Your key looks something like this:
```
sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 5: Install the Agent Dependencies

Now you need to install the Python packages the agent needs.

### Windows

1. Open **Command Prompt** (press Windows key, type `cmd`, press Enter)
2. Navigate to the project folder. If you put it on your Desktop:
   ```
   cd %USERPROFILE%\Desktop\Lead-Tracker
   ```
3. Install the packages:
   ```
   pip install -r agent\requirements.txt
   ```
4. Wait for it to finish. You'll see some download progress bars.

**If you get an error** saying `pip is not recognized`:
```
python -m pip install -r agent\requirements.txt
```

### macOS

1. Open **Terminal** (Cmd+Space, type Terminal, Enter)
2. Navigate to the project folder. If you put it on your Desktop:
   ```bash
   cd ~/Desktop/Lead-Tracker
   ```
3. Install the packages:
   ```bash
   pip3 install -r agent/requirements.txt
   ```

**If you get a permissions error**, add `--user`:
```bash
pip3 install --user -r agent/requirements.txt
```

### Linux

```bash
cd ~/Desktop/Lead-Tracker
pip3 install -r agent/requirements.txt
```

If you get display-related errors on Linux, you may also need:
```bash
sudo apt install python3-tk python3-dev scrot
```

---

## Step 6: Set Your API Key

You need to tell the agent your Anthropic API key. Pick ONE of these methods:

### Method A: Edit the Config File (Recommended - Easiest)

1. Open the file `Lead-Tracker/agent/config.py` in any text editor (Notepad, TextEdit, VS Code, etc.)
2. Find this line near the top:
   ```python
   ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
   ```
3. Change it to (paste YOUR key between the quotes):
   ```python
   ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "sk-ant-api03-YOUR-KEY-HERE")
   ```
4. Save the file

### Method B: Set an Environment Variable

This is more secure (key doesn't sit in a file) but resets when you close the terminal.

**Windows** (Command Prompt):
```
set ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
```

**Windows** (PowerShell):
```
$env:ANTHROPIC_API_KEY = "sk-ant-api03-YOUR-KEY-HERE"
```

**macOS/Linux** (Terminal):
```bash
export ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
```

To make it permanent on macOS/Linux, add that line to your `~/.bashrc` or `~/.zshrc` file.

---

## Step 7: Run the Agent

### Windows

1. Open **Command Prompt**
2. Navigate to the project:
   ```
   cd %USERPROFILE%\Desktop\Lead-Tracker
   ```
3. Run the agent:
   ```
   python agent\agent.py
   ```

### macOS

1. Open **Terminal**
2. Navigate to the project:
   ```bash
   cd ~/Desktop/Lead-Tracker
   ```
3. Run the agent:
   ```bash
   python3 agent/agent.py
   ```

### Linux

```bash
cd ~/Desktop/Lead-Tracker
python3 agent/agent.py
```

### What You Should See

```
╔══════════════════════════════════════════════════╗
║          Lead Tracker AI Agent                    ║
║     I can see your screen and control your        ║
║     computer to help you get things done.         ║
╚══════════════════════════════════════════════════╝

Type a task naturally. The agent sees your screen after every action.
Type "stop" to interrupt, "quit" to exit.
Emergency stop: move mouse to any screen corner.

Agent ready. What would you like me to do?

You: _
```

**If you see that, you're good to go!** Type a task like:

```
You: set up my Meta developer account so I can use the ads manager
```

And the agent will start working - opening your browser, clicking through pages, and telling you what it's doing at every step.

---

## How to Use the Agent

### Talking to It

Just type what you want done in plain English:

| What you type | What it does |
|---|---|
| `set up my Meta developer account` | Opens browser, walks through Meta Developer portal setup |
| `install the Lead Tracker dependencies and start the server` | Runs npm install and npm start |
| `open localhost:3000 in Chrome` | Opens the Lead Tracker app in your browser |
| `look` | Takes a screenshot and describes what's on your screen |
| `stop` | Stops the current task immediately |
| `reset` | Clears the conversation and starts fresh |
| `quit` | Exits the agent |

### The First Thing to Do

Once the agent is running, say:

```
You: help me set up the Meta Ads Manager. I need to create a developer app, get my ad account ID, and generate an access token.
```

The agent will:
1. Open your browser to the Meta Developer portal
2. Click through creating an app
3. Navigate to Business Settings to find your Ad Account ID
4. Open the Graph API Explorer to generate a token
5. Ask you to confirm/paste any info it can't see
6. Save everything to your `.env` file
7. Start the server

### While It's Working

- You'll see it describe what's on your screen and what it's about to do
- Each action shows with a `>` prefix (like `> Clicked (450, 300)`)
- If it needs something from you (like an API key to paste), it will ask
- Type **stop** at any time to interrupt
- If something goes wrong, it will try to recover automatically

### Emergency Stop

If the agent is clicking on the wrong things or you need it to stop immediately:

**Move your mouse to any corner of your screen.** This triggers an emergency stop built into PyAutoGUI and halts all automation instantly.

---

## Troubleshooting

### "python is not recognized" / "command not found"

- **Windows**: Python wasn't added to PATH. Reinstall Python and make sure to check **"Add Python to PATH"** during installation. Then restart Command Prompt.
- **macOS/Linux**: Try `python3` instead of `python`.

### "pip is not recognized"

Try:
```
python -m pip install -r agent/requirements.txt
```
Or on macOS/Linux:
```
python3 -m pip install -r agent/requirements.txt
```

### "No module named pyautogui" when running the agent

The dependencies didn't install correctly. Try again:
```
pip install pyautogui pillow anthropic
```

### "ANTHROPIC_API_KEY not set"

Your API key isn't configured. Either:
- Edit `agent/config.py` and paste your key (Method A in Step 6)
- Or set the environment variable (Method B in Step 6)

### Agent says "Could not capture screen"

- **macOS**: Go to System Preferences > Security & Privacy > Privacy > Screen Recording. Add your Terminal app to the allowed list.
- **Linux**: Install `scrot`: `sudo apt install scrot`
- **Windows**: Try running Command Prompt as Administrator.

### Agent clicks on wrong things

- Make sure your screen resolution matches what the agent sees. It works best at 1920x1080 or 1440x900.
- Try saying `look` to see what the agent actually sees.
- If it's consistently off, the screenshot resize might be causing coordinate issues. Edit `agent/config.py` and increase `SCREENSHOT_MAX_WIDTH` to your actual screen width.

### "Error talking to Claude" / API errors

- Check your API key is correct
- Make sure you have credits in your Anthropic account (console.anthropic.com > Billing)
- Check your internet connection

### Agent is too slow

Edit `agent/config.py`:
- Decrease `ACTION_DELAY` (e.g., `0.1`) - time between actions
- Decrease `SCREENSHOT_DELAY` (e.g., `0.5`) - time before taking screenshot

### Agent is too fast (missing clicks)

Edit `agent/config.py`:
- Increase `ACTION_DELAY` (e.g., `1.0`)
- Increase `SCREENSHOT_DELAY` (e.g., `1.5`)

---

## Configuration Reference

Edit `agent/config.py` to customize:

| Setting | Default | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | (empty) | Your Anthropic API key |
| `MODEL` | `claude-sonnet-4-20250514` | Which Claude model to use |
| `SCREENSHOT_MAX_WIDTH` | `1280` | Screenshot resize width (larger = more accurate, costs more) |
| `SCREENSHOT_QUALITY` | `85` | JPEG quality (higher = clearer, costs more) |
| `ACTION_DELAY` | `0.3` | Seconds between mouse/keyboard actions |
| `SCREENSHOT_DELAY` | `0.8` | Seconds to wait before taking a screenshot (for page loads) |
| `REQUIRE_CONFIRMATION_FOR` | `["payment", ...]` | Keywords that trigger "are you sure?" prompts |

---

## Cost Estimate

The agent uses the Claude API which charges per token (roughly per word/image):

- Each screenshot sent to Claude costs ~$0.01-0.03
- Each text response costs ~$0.003-0.01
- A typical task (like setting up Meta Ads) might take 20-50 actions = **$0.50-2.00**
- $5 in API credits will last a long time for normal use
