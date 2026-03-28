"""
Agent configuration.
Set your Anthropic API key here or as an environment variable.
"""
import os

# Your Anthropic API key - set via environment variable or paste here
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Claude model to use (claude-sonnet-4-20250514 is fast + capable for computer use)
MODEL = "claude-sonnet-4-20250514"

# Screenshot settings
SCREENSHOT_MAX_WIDTH = 1280  # Resize screenshots to save tokens
SCREENSHOT_QUALITY = 85

# Safety settings
REQUIRE_CONFIRMATION_FOR = [
    "payment",
    "purchase",
    "delete",
    "password",
    "sign out",
    "log out",
    "uninstall",
    "format",
    "send money",
]

# How long to wait between actions (seconds)
ACTION_DELAY = 0.5

# Max actions per single task before asking user to confirm continuation
MAX_ACTIONS_PER_TASK = 30
