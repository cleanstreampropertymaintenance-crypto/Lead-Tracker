# Lead Tracker AI Agent

A conversational AI assistant that can **see your screen** and **control your mouse and keyboard** to help you set up and manage your Meta Ads Manager.

## Quick Start

### 1. Get an Anthropic API Key
Go to https://console.anthropic.com/ and create an API key.

### 2. Install Dependencies
```bash
pip install -r agent/requirements.txt
```

### 3. Set Your API Key
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 4. Run the Agent
```bash
python agent/agent.py
```

## What It Can Do

Talk to it like a person:

- **"Set up my Meta Business account for the ads manager"** - It will open your browser, navigate to the Meta Developer portal, and walk you through each step while clicking for you.
- **"Open the Lead Tracker app"** - It will start the server and open your browser.
- **"Look at my screen"** - It takes a screenshot and tells you what it sees.
- **"Click on the Settings button"** - It finds and clicks whatever you describe.
- **"Fill in the form with my info"** - It can type in fields for you.

## How It Works (Continuous Vision Loop)

The agent works like a live screen share - it sees your screen after **every single action**:

```
You: "Set up my Meta developer account"

  [Screenshot] → AI sees your desktop
  AI: "I see your desktop. Opening Chrome..."
    > Clicked (450, 780)
  [Screenshot] → AI sees Chrome opened
  AI: "Chrome is open. Navigating to Meta Developers..."
    > Typed: developers.facebook.com
  [Screenshot] → AI sees the address bar
  AI: "Pressing enter to navigate..."
    > Pressed key: enter
  [Screenshot] → AI sees the page loading
  AI: "Page is loading, waiting..."
    > Waited 2 seconds
  [Screenshot] → AI sees Meta Developer portal
  AI: "I can see the Meta Developer portal. Clicking Create App..."
    > Clicked (890, 340)
  ... continues until done ...
```

It never batches actions blindly. Every single click, keystroke, or scroll is followed by a fresh screenshot so the AI always knows exactly what's on screen before its next move.

## Safety Features

- **Emergency stop**: Move your mouse to any screen corner to immediately stop all automation.
- **Type "stop"**: Interrupt the current task at any time.
- **Payment confirmation only**: The agent only asks permission for actual payments/purchases. Everything else it just does.
- **No action limits**: The agent runs until the task is done (or you say stop).

## Commands

| Command | What it does |
|---------|-------------|
| Type naturally | Give the agent a task |
| `look` | Agent looks at your screen and describes it |
| `stop` | Interrupt current task |
| `reset` | Clear conversation history |
| `quit` | Exit the agent |

## Configuration

Edit `agent/config.py` to change:
- `MODEL` - Which Claude model to use
- `ACTION_DELAY` - Speed of actions (seconds between each)
- `MAX_ACTIONS_PER_TASK` - How many actions before pausing
- `REQUIRE_CONFIRMATION_FOR` - Keywords that trigger safety confirmation
