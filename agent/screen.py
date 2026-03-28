"""
Screen capture and computer control module.
Handles taking screenshots and executing mouse/keyboard actions.
"""
import io
import base64
import time
import pyautogui
from PIL import Image
from config import SCREENSHOT_MAX_WIDTH, SCREENSHOT_QUALITY, ACTION_DELAY

# Safety: stop automation if mouse hits corner
pyautogui.FAILSAFE = True
# Slow down actions so user can see what's happening
pyautogui.PAUSE = ACTION_DELAY


def take_screenshot():
    """Capture the screen and return as base64-encoded JPEG."""
    screenshot = pyautogui.screenshot()

    # Resize to save tokens
    w, h = screenshot.size
    if w > SCREENSHOT_MAX_WIDTH:
        ratio = SCREENSHOT_MAX_WIDTH / w
        screenshot = screenshot.resize(
            (SCREENSHOT_MAX_WIDTH, int(h * ratio)),
            Image.LANCZOS
        )

    buffer = io.BytesIO()
    screenshot.save(buffer, format="JPEG", quality=SCREENSHOT_QUALITY)
    return base64.standard_b64encode(buffer.getvalue()).decode("utf-8")


def get_screen_size():
    """Return current screen resolution."""
    size = pyautogui.size()
    return {"width": size.width, "height": size.height}


def execute_action(action):
    """
    Execute a computer control action.

    Supported actions:
      {"type": "click", "x": 500, "y": 300}
      {"type": "click", "x": 500, "y": 300, "button": "right"}
      {"type": "double_click", "x": 500, "y": 300}
      {"type": "type", "text": "hello world"}
      {"type": "hotkey", "keys": ["ctrl", "a"]}
      {"type": "key", "key": "enter"}
      {"type": "scroll", "x": 500, "y": 300, "clicks": -3}
      {"type": "move", "x": 500, "y": 300}
      {"type": "drag", "startX": 100, "startY": 100, "endX": 500, "endY": 500}
      {"type": "screenshot"}  (just returns a new screenshot)
      {"type": "wait", "seconds": 2}
    """
    action_type = action.get("type", "")

    if action_type == "click":
        x, y = action["x"], action["y"]
        button = action.get("button", "left")
        pyautogui.click(x, y, button=button)
        return f"Clicked ({x}, {y}) with {button} button"

    elif action_type == "double_click":
        x, y = action["x"], action["y"]
        pyautogui.doubleClick(x, y)
        return f"Double-clicked ({x}, {y})"

    elif action_type == "type":
        text = action["text"]
        pyautogui.typewrite(text, interval=0.03) if text.isascii() else pyautogui.write(text)
        return f"Typed: {text[:50]}{'...' if len(text) > 50 else ''}"

    elif action_type == "hotkey":
        keys = action["keys"]
        pyautogui.hotkey(*keys)
        return f"Pressed hotkey: {'+'.join(keys)}"

    elif action_type == "key":
        key = action["key"]
        pyautogui.press(key)
        return f"Pressed key: {key}"

    elif action_type == "scroll":
        x = action.get("x", None)
        y = action.get("y", None)
        clicks = action.get("clicks", -3)
        pyautogui.scroll(clicks, x, y)
        direction = "down" if clicks < 0 else "up"
        return f"Scrolled {direction} {abs(clicks)} clicks"

    elif action_type == "move":
        x, y = action["x"], action["y"]
        pyautogui.moveTo(x, y)
        return f"Moved mouse to ({x}, {y})"

    elif action_type == "drag":
        sx, sy = action["startX"], action["startY"]
        ex, ey = action["endX"], action["endY"]
        pyautogui.moveTo(sx, sy)
        pyautogui.drag(ex - sx, ey - sy, duration=0.5)
        return f"Dragged from ({sx},{sy}) to ({ex},{ey})"

    elif action_type == "screenshot":
        return "Taking a fresh screenshot"

    elif action_type == "wait":
        seconds = action.get("seconds", 1)
        time.sleep(seconds)
        return f"Waited {seconds} seconds"

    else:
        return f"Unknown action type: {action_type}"
