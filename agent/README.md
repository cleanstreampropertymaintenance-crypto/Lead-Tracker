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

## Safety Features

- **Emergency stop**: Move your mouse to any screen corner to immediately stop all automation.
- **Sensitive action confirmation**: The agent will ask you before doing anything involving payments, passwords, deletions, or signing out.
- **Action limit**: After 30 actions, it pauses and asks if you want to continue.
- **No passwords**: It will never type passwords unless you explicitly provide them.

## Commands

| Command | What it does |
|---------|-------------|
| Type naturally | Give the agent a task |
| `look` / `screenshot` | Agent takes a fresh look at your screen |
| `stop` / `pause` | Stop current automation |
| `reset` | Clear conversation history |
| `quit` / `exit` | Exit the agent |

## How It Works

1. You type a task in natural language
2. The agent takes a screenshot of your screen
3. It sends the screenshot + your request to Claude (AI)
4. Claude analyzes what's on screen and decides what actions to take
5. The agent executes those actions (clicks, typing, scrolling)
6. It takes another screenshot to verify the result
7. Repeats until the task is done

## Configuration

Edit `agent/config.py` to change:
- `MODEL` - Which Claude model to use
- `ACTION_DELAY` - Speed of actions (seconds between each)
- `MAX_ACTIONS_PER_TASK` - How many actions before pausing
- `REQUIRE_CONFIRMATION_FOR` - Keywords that trigger safety confirmation
