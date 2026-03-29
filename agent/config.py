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

# Safety settings - only pause for actual payments/money
REQUIRE_CONFIRMATION_FOR = [
    "payment",
    "purchase",
    "send money",
    "pay now",
    "checkout",
]

# How long to wait between actions (seconds)
ACTION_DELAY = 0.3

# How long to wait after an action before taking a screenshot (seconds)
# This gives the screen time to update (page loads, animations, etc.)
SCREENSHOT_DELAY = 0.8
