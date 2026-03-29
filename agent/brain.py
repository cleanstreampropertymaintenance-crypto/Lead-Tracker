"""
AI brain module - talks to Claude to decide what actions to take.
Sends screenshots + conversation context, receives action plans.

Uses a continuous loop: act -> screenshot -> think -> act -> screenshot -> think
so the agent always sees the result of every action before deciding the next one.
"""
import json
from anthropic import Anthropic
from config import ANTHROPIC_API_KEY, MODEL, REQUIRE_CONFIRMATION_FOR
from screen import take_screenshot, get_screen_size, execute_action

client = Anthropic(api_key=ANTHROPIC_API_KEY)

SYSTEM_PROMPT = """You are a helpful AI assistant that can see the user's screen and control their computer.
You help them complete tasks by looking at screenshots and performing mouse/keyboard actions.

CURRENT CONTEXT: You are helping set up and manage a Lead Tracker application with a Meta Ads Manager.
The project is at {project_dir}. The user needs help with things like:
- Setting up their Meta Business API credentials
- Navigating the Meta Developer portal
- Configuring the Lead Tracker app
- Any other computer tasks they ask for

SCREEN SIZE: {screen_width}x{screen_height}

HOW YOU WORK:
- You see a live screenshot of the user's screen after EVERY action you take.
- You perform ONE action at a time, then get a fresh screenshot to see exactly what happened.
- This means you always know the current state of the screen before your next move.

HOW TO RESPOND:
1. Briefly describe what you see on screen (1-2 sentences max).
2. State what you're doing next and why (1 sentence).
3. Output exactly ONE action in an ```actions``` code block.

ACTION FORMAT - respond with ONE action:
```actions
{{"type": "click", "x": 500, "y": 300}}
```

AVAILABLE ACTIONS:
- {{"type": "click", "x": <int>, "y": <int>}} - Left click at coordinates
- {{"type": "click", "x": <int>, "y": <int>, "button": "right"}} - Right click
- {{"type": "double_click", "x": <int>, "y": <int>}} - Double click
- {{"type": "type", "text": "<string>"}} - Type text (use for filling fields)
- {{"type": "hotkey", "keys": ["ctrl", "a"]}} - Keyboard shortcut
- {{"type": "key", "key": "enter"}} - Single key press (enter, tab, escape, backspace, etc.)
- {{"type": "scroll", "clicks": -3}} - Scroll (negative = down, positive = up)
- {{"type": "wait", "seconds": 2}} - Wait for page/animation to finish loading
- {{"type": "done"}} - You've finished the task

IMPORTANT RULES:
- ONLY output ONE action per response. You'll see a fresh screenshot after it executes.
- Be precise with coordinates - click on the EXACT center of the element.
- If you need to type in a field, click on it first (separate action).
- If a page is loading or something changed, describe what you see and continue.
- If something went wrong, explain what happened and try a different approach.
- When the task is done, use {{"type": "done"}} and summarize what you accomplished.
- If you need information from the user (like a password or API key), respond with NO action block and just ask them. They'll type the answer.
- NEVER type passwords or sensitive info unless the user provides it to you.

SAFETY: For any action involving actual payments or sending money (checkout, purchase, pay now),
STOP and ask the user for confirmation first. Respond with no action block and ask.
For everything else (clicking, typing, navigating, filling forms, deleting files, logging in), just do it.
"""


class AgentBrain:
    def __init__(self, project_dir):
        self.project_dir = project_dir
        self.conversation = []
        screen = get_screen_size()
        self.system = SYSTEM_PROMPT.format(
            project_dir=project_dir,
            screen_width=screen["width"],
            screen_height=screen["height"]
        )

    def think(self, user_message=None, screenshot_b64=None):
        """
        Send context to Claude and get back a response with one action.
        Returns: (text_response, action_or_none, safety_warning_or_none)
        """
        content = []

        if screenshot_b64:
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": screenshot_b64
                }
            })

        if user_message:
            content.append({"type": "text", "text": user_message})
        elif screenshot_b64:
            content.append({"type": "text", "text": "[Screenshot after last action. Continue with the task.]"})

        self.conversation.append({"role": "user", "content": content})

        # Call Claude
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=self.system,
            messages=self.conversation
        )

        response_text = ""
        for block in response.content:
            if block.type == "text":
                response_text += block.text

        self.conversation.append({"role": "assistant", "content": response_text})

        # Parse the single action from response
        action = self._parse_action(response_text)

        # Check if task is done
        if action and action.get("type") == "done":
            return response_text, None, None

        # Safety check
        if action:
            safety_issue = self._safety_check(action, response_text)
            if safety_issue:
                return response_text, None, safety_issue

        return response_text, action, None

    def _parse_action(self, text):
        """Extract a single action JSON from the response."""
        if "```actions" in text:
            try:
                start = text.index("```actions") + len("```actions")
                end = text.index("```", start)
                action_json = text[start:end].strip()
                parsed = json.loads(action_json)
                # Could be a single object or an array with one item
                if isinstance(parsed, list):
                    return parsed[0] if parsed else None
                return parsed
            except (ValueError, json.JSONDecodeError):
                pass
        return None

    def _safety_check(self, action, response_text):
        """Check if the action involves sensitive operations."""
        full_text = response_text.lower()
        for keyword in REQUIRE_CONFIRMATION_FOR:
            if keyword in full_text:
                return f"This action involves '{keyword}'. Type 'yes' to proceed."

        if action.get("type") == "type":
            text = action.get("text", "").lower()
            for keyword in REQUIRE_CONFIRMATION_FOR:
                if keyword in text:
                    return f"About to type text related to '{keyword}'. Type 'yes' to proceed."

        return None

    def add_user_message(self, message):
        """Add a user message to conversation (for confirmations, answers, etc.)."""
        self.conversation.append({"role": "user", "content": message})

    def trim_context(self):
        """Keep conversation from getting too long by summarizing old messages."""
        # Keep last 30 exchanges (each exchange = screenshot + action)
        # This is ~60 messages. Images are the heavy part.
        if len(self.conversation) > 60:
            # Keep first message (user's original task) and recent history
            first = self.conversation[0]
            recent = self.conversation[-40:]
            self.conversation = [first] + recent
