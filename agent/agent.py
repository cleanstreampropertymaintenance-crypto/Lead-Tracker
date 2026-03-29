#!/usr/bin/env python3
"""
Lead Tracker AI Agent
=====================
A conversational AI that can see your screen and control your computer.
Talk to it naturally and it will perform tasks for you.

It works in a continuous loop:
  1. Takes a screenshot (sees your screen)
  2. Sends it to Claude AI to decide what to do
  3. Performs ONE action (click, type, scroll, etc.)
  4. Takes another screenshot to see the result
  5. Repeats until the task is done

Usage:
  1. Set your ANTHROPIC_API_KEY in environment or agent/config.py
  2. pip install -r agent/requirements.txt
  3. python agent/agent.py

Commands:
  Type naturally to give tasks ("set up my Meta ads account")
  "look"  - agent just looks at your screen and describes it
  "stop"  - interrupt the current task
  "quit"  - exit the agent
  "reset" - clear conversation history
"""

import os
import sys
import time
import threading

# ── Terminal Colors ──────────────────────────────────────────────────
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

# Flag to let user interrupt the action loop
stop_requested = False


def banner():
    print(f"""
{CYAN}{BOLD}╔══════════════════════════════════════════════════╗
║          Lead Tracker AI Agent                    ║
║     I can see your screen and control your        ║
║     computer to help you get things done.         ║
╚══════════════════════════════════════════════════╝{RESET}

{DIM}Type a task naturally. The agent sees your screen after every action.{RESET}
{DIM}Type "stop" to interrupt, "quit" to exit.{RESET}
{DIM}Emergency stop: move mouse to any screen corner.{RESET}
""")


def print_agent(text):
    """Print agent response, filtering out action blocks."""
    lines = text.split("\n")
    in_action_block = False
    for line in lines:
        if line.strip().startswith("```actions"):
            in_action_block = True
            continue
        if in_action_block and line.strip() == "```":
            in_action_block = False
            continue
        if not in_action_block:
            stripped = line.strip()
            if stripped:
                print(f"  {CYAN}{stripped}{RESET}")


def print_action(result):
    print(f"    {MAGENTA}> {result}{RESET}")


def print_safety(msg):
    print(f"\n  {RED}{BOLD}[SAFETY]{RESET} {YELLOW}{msg}{RESET}")


def listen_for_stop():
    """Background thread that listens for 'stop' typed during action loop."""
    global stop_requested
    while True:
        try:
            line = input()
            if line.strip().lower() in ("stop", "pause", "s"):
                stop_requested = True
        except (EOFError, KeyboardInterrupt):
            break


def main():
    global stop_requested
    banner()

    # ── Validate setup ───────────────────────────────────────────────
    try:
        from config import ANTHROPIC_API_KEY, SCREENSHOT_DELAY
    except ImportError:
        print(f"{RED}Error: Could not import config. Run from the agent directory:{RESET}")
        print(f"  cd Lead-Tracker/agent && python agent.py")
        sys.exit(1)

    if not ANTHROPIC_API_KEY:
        print(f"{RED}Error: ANTHROPIC_API_KEY not set.{RESET}")
        print(f"Set it as an environment variable:")
        print(f"  export ANTHROPIC_API_KEY=sk-ant-...")
        print(f"Or edit agent/config.py")
        sys.exit(1)

    try:
        import pyautogui
    except ImportError:
        print(f"{RED}Error: pyautogui not installed.{RESET}")
        print(f"Run: pip install -r agent/requirements.txt")
        sys.exit(1)

    # ── Initialize ───────────────────────────────────────────────────
    from brain import AgentBrain
    from screen import take_screenshot, execute_action

    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    brain = AgentBrain(project_dir)

    print(f"{GREEN}Agent ready.{RESET} What would you like me to do?\n")

    # ── Main loop ────────────────────────────────────────────────────
    while True:
        try:
            user_input = input(f"{GREEN}{BOLD}You:{RESET} ").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n{YELLOW}Goodbye!{RESET}")
            break

        if not user_input:
            continue

        lower = user_input.lower()

        if lower in ("quit", "exit", "q"):
            print(f"{YELLOW}Goodbye!{RESET}")
            break

        if lower == "reset":
            brain = AgentBrain(project_dir)
            print(f"{GREEN}Conversation reset.{RESET}\n")
            continue

        # ── Take initial screenshot ──────────────────────────────────
        print(f"\n  {DIM}Looking at your screen...{RESET}")
        try:
            screenshot = take_screenshot()
        except Exception as e:
            print(f"  {RED}Could not capture screen: {e}{RESET}")
            screenshot = None

        # First message to Claude with the user's task + screenshot
        is_look = lower in ("look", "see", "screenshot", "screen")
        message = "What do you see on my screen?" if is_look else user_input

        # ── Continuous act-look-think loop ────────────────────────────
        stop_requested = False
        is_first = True

        while not stop_requested:
            # Think
            if is_first:
                print(f"  {DIM}Thinking...{RESET}")
            else:
                print(f"  {DIM}Seeing result... thinking...{RESET}")

            try:
                response_text, action, safety_warning = brain.think(
                    user_message=message if is_first else None,
                    screenshot_b64=screenshot
                )
            except Exception as e:
                print(f"  {RED}Error: {e}{RESET}\n")
                break

            is_first = False
            message = None  # Only send user message on first iteration

            # Show what the agent is thinking
            print_agent(response_text)

            # ── Task complete? ───────────────────────────────────────
            if action is None and safety_warning is None:
                # Either done, needs user input, or no action to take
                if "done" in response_text.lower() or "TASK COMPLETE" in response_text:
                    print(f"\n  {GREEN}{BOLD}Task finished!{RESET}\n")
                else:
                    print()  # Agent is asking a question, return to input prompt
                break

            # ── Safety check ─────────────────────────────────────────
            if safety_warning:
                print_safety(safety_warning)
                try:
                    confirm = input(f"  {YELLOW}?{RESET} Type 'yes' to proceed, anything else to skip: ").strip().lower()
                except (EOFError, KeyboardInterrupt):
                    print(f"\n{YELLOW}Skipped.{RESET}")
                    break
                if confirm == "yes":
                    brain.add_user_message("User confirmed. Proceed with the action.")
                    # Re-think with confirmation
                    continue
                else:
                    brain.add_user_message("User declined. Suggest an alternative or ask what to do.")
                    # Let agent respond to the decline
                    try:
                        screenshot = take_screenshot()
                        response_text, action, _ = brain.think(screenshot_b64=screenshot)
                        print_agent(response_text)
                    except Exception:
                        pass
                    print()
                    break

            # ── Execute the single action ────────────────────────────
            try:
                result = execute_action(action)
                print_action(result)
            except Exception as e:
                print(f"    {RED}Action failed: {e}{RESET}")
                brain.add_user_message(f"Action failed with error: {e}. Try a different approach.")
                # Still take screenshot and continue so agent can recover
                time.sleep(SCREENSHOT_DELAY)
                try:
                    screenshot = take_screenshot()
                except Exception:
                    screenshot = None
                continue

            # ── Wait for screen to update, then screenshot ───────────
            # For waits, the action itself handles the delay
            if action.get("type") != "wait":
                time.sleep(SCREENSHOT_DELAY)

            try:
                screenshot = take_screenshot()
            except Exception as e:
                print(f"  {RED}Could not capture screen: {e}{RESET}")
                screenshot = None

            # Trim context periodically to avoid running out of memory
            brain.trim_context()

        # User typed stop
        if stop_requested:
            print(f"\n  {YELLOW}Stopped.{RESET} What would you like me to do next?\n")
            stop_requested = False


if __name__ == "__main__":
    agent_dir = os.path.dirname(os.path.abspath(__file__))
    if agent_dir not in sys.path:
        sys.path.insert(0, agent_dir)
    main()
