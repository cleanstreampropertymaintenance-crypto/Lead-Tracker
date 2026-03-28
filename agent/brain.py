"""
AI brain module - talks to Claude to decide what actions to take.
Sends screenshots + conversation context, receives action plans.
"""
import json
from anthropic import Anthropic
from config import ANTHROPIC_API_KEY, MODEL, REQUIRE_CONFIRMATION_FOR, MAX_ACTIONS_PER_TASK
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

HOW TO RESPOND:
1. First, describe what you see on the screen (briefly).
2. Then explain what you're going to do and why.
3. Then output your actions as a JSON array in an ```actions``` code block.

ACTION FORMAT - respond with a JSON array of actions:
```actions
[
  {{"type": "click", "x": 500, "y": 300}},
  {{"type": "type", "text": "hello"}},
  {{"type": "key", "key": "enter"}}
]
```

AVAILABLE ACTIONS:
- {{"type": "click", "x": <int>, "y": <int>}} - Left click at coordinates
- {{"type": "click", "x": <int>, "y": <int>, "button": "right"}} - Right click
- {{"type": "double_click", "x": <int>, "y": <int>}} - Double click
- {{"type": "type", "text": "<string>"}} - Type text (use for filling fields)
- {{"type": "hotkey", "keys": ["ctrl", "a"]}} - Keyboard shortcut
- {{"type": "key", "key": "enter"}} - Single key press (enter, tab, escape, backspace, etc.)
- {{"type": "scroll", "clicks": -3}} - Scroll (negative = down, positive = up)
- {{"type": "wait", "seconds": 2}} - Wait for page to load
- {{"type": "screenshot"}} - Take a new screenshot to see updated screen

IMPORTANT RULES:
- Always look at the screenshot carefully before acting. Describe what you see.
- Click on the EXACT coordinates of buttons/fields you want to interact with.
- After clicking a button or typing, include a "wait" + "screenshot" to see the result.
- If a page is loading, wait and take another screenshot.
- Be precise with coordinates - look at where elements actually are on screen.
- If you need to type in a field, click on it first.
- Keep actions focused - do 2-4 actions at a time, then screenshot to verify.
- If something went wrong, explain what happened and try a different approach.
- If you're done with the task, say "TASK COMPLETE" and summarize what you did.
- If you need information from the user, ask them directly (no actions needed).
- NEVER type passwords or sensitive info without the user providing it.

SAFETY: For any action involving payments, purchases, deletions, passwords, or signing out,
STOP and ask the user for confirmation first. Do NOT perform these automatically.
"""


class AgentBrain:
    def __init__(self, project_dir):
        self.project_dir = project_dir
        self.conversation = []
        self.action_count = 0
        screen = get_screen_size()
        self.system = SYSTEM_PROMPT.format(
            project_dir=project_dir,
            screen_width=screen["width"],
            screen_height=screen["height"]
        )

    def think(self, user_message=None, screenshot_b64=None):
        """
        Send context to Claude and get back a response with actions.
        Returns: (text_response, actions_list)
        """
        # Build the message content
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
            content.append({"type": "text", "text": "Here's what's on my screen now. Continue with the task."})

        self.conversation.append({"role": "user", "content": content})

        # Call Claude
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=self.system,
            messages=self.conversation
        )

        # Extract response text
        response_text = ""
        for block in response.content:
            if block.type == "text":
                response_text += block.text

        self.conversation.append({"role": "assistant", "content": response_text})

        # Parse actions from response
        actions = self._parse_actions(response_text)

        # Safety check
        if actions:
            safety_issue = self._safety_check(actions, response_text)
            if safety_issue:
                return response_text, [], safety_issue

        return response_text, actions, None

    def _parse_actions(self, text):
        """Extract actions JSON from the response."""
        actions = []
        if "```actions" in text:
            try:
                start = text.index("```actions") + len("```actions")
                end = text.index("```", start)
                actions_json = text[start:end].strip()
                actions = json.loads(actions_json)
            except (ValueError, json.JSONDecodeError) as e:
                pass
        return actions

    def _safety_check(self, actions, response_text):
        """Check if any actions involve sensitive operations."""
        full_text = response_text.lower()
        for keyword in REQUIRE_CONFIRMATION_FOR:
            if keyword in full_text:
                return f"Safety check: This action involves '{keyword}'. Please confirm to proceed."

        # Check for typing sensitive-looking content
        for action in actions:
            if action.get("type") == "type":
                text = action.get("text", "").lower()
                for keyword in REQUIRE_CONFIRMATION_FOR:
                    if keyword in text:
                        return f"Safety check: About to type text related to '{keyword}'. Please confirm."

        return None

    def execute_actions(self, actions):
        """Execute a list of actions and return results."""
        results = []
        for action in actions:
            result = execute_action(action)
            results.append(result)
            self.action_count += 1
        return results

    def should_pause(self):
        """Check if we've done too many actions and should check with user."""
        if self.action_count >= MAX_ACTIONS_PER_TASK:
            self.action_count = 0
            return True
        return False

    def trim_context(self):
        """Keep conversation from getting too long by trimming old messages."""
        # Keep system prompt + last 20 messages
        if len(self.conversation) > 20:
            self.conversation = self.conversation[-20:]
