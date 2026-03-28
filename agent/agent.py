#!/usr/bin/env python3
"""
Lead Tracker AI Agent
=====================
A conversational AI that can see your screen and control your computer.
Talk to it naturally and it will perform tasks for you.

Usage:
  1. Set your ANTHROPIC_API_KEY in environment or agent/config.py
  2. pip install -r agent/requirements.txt
  3. python agent/agent.py

Commands:
  Type naturally to give tasks ("set up my Meta ads account")
  "screenshot" or "look" - agent takes a fresh look at your screen
  "stop" or "pause"      - stop current automation
  "quit" or "exit"       - exit the agent
  "reset"                - clear conversation history
"""

import os
import sys
import time

# ── Terminal Colors ──────────────────────────────────────────────────
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def banner():
    print(f"""
{CYAN}{BOLD}╔══════════════════════════════════════════════════╗
║          Lead Tracker AI Agent                    ║
║     I can see your screen and help you set up     ║
║     your Meta Ads Manager and more.               ║
╚══════════════════════════════════════════════════╝{RESET}

{DIM}Commands: type a task, "look" to see screen, "quit" to exit{RESET}
{DIM}Safety:   move mouse to any corner to emergency-stop{RESET}
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
            print(f"  {CYAN}{line}{RESET}")


def print_action(result):
    """Print an action result."""
    print(f"    {MAGENTA}> {result}{RESET}")


def print_safety(msg):
    """Print a safety warning."""
    print(f"\n  {RED}{BOLD}[SAFETY]{RESET} {YELLOW}{msg}{RESET}")


def main():
    banner()

    # ── Validate setup ───────────────────────────────────────────────
    try:
        from config import ANTHROPIC_API_KEY
    except ImportError:
        print(f"{RED}Error: Could not import config. Run from the project root:{RESET}")
        print(f"  cd Lead-Tracker && python agent/agent.py")
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
    from screen import take_screenshot

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

        # ── Take screenshot for context ──────────────────────────────
        take_fresh = lower in ("screenshot", "look", "see", "screen")

        print(f"\n  {DIM}Taking screenshot...{RESET}")
        try:
            screenshot = take_screenshot()
        except Exception as e:
            print(f"  {RED}Could not capture screen: {e}{RESET}")
            print(f"  {DIM}Continuing without visual context...{RESET}")
            screenshot = None

        # ── Think ────────────────────────────────────────────────────
        message = None if take_fresh else user_input
        if take_fresh:
            message = user_input if lower not in ("screenshot", "look", "see", "screen") else "What do you see on my screen?"

        print(f"  {DIM}Thinking...{RESET}\n")

        try:
            response_text, actions, safety_warning = brain.think(
                user_message=message,
                screenshot_b64=screenshot
            )
        except Exception as e:
            print(f"  {RED}Error talking to Claude: {e}{RESET}\n")
            continue

        # ── Display response ─────────────────────────────────────────
        print_agent(response_text)
        print()

        # ── Check for task complete ──────────────────────────────────
        if "TASK COMPLETE" in response_text:
            print(f"  {GREEN}{BOLD}Task finished!{RESET}\n")
            continue

        # ── Safety check ─────────────────────────────────────────────
        if safety_warning:
            print_safety(safety_warning)
            try:
                confirm = input(f"  {YELLOW}?{RESET} Type 'yes' to proceed, anything else to skip: ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print(f"\n{YELLOW}Skipped.{RESET}")
                continue
            if confirm != "yes":
                print(f"  {DIM}Skipped action.{RESET}\n")
                brain.conversation.append({
                    "role": "user",
                    "content": "User declined the action. Please suggest an alternative or ask what to do."
                })
                continue

        # ── Execute actions ──────────────────────────────────────────
        if actions:
            print(f"  {DIM}Executing {len(actions)} action(s)...{RESET}")
            needs_screenshot = False

            for action in actions:
                if action.get("type") == "screenshot":
                    needs_screenshot = True
                    continue

                try:
                    result = execute_action_safe(action)
                    print_action(result)
                except Exception as e:
                    print(f"    {RED}Action failed: {e}{RESET}")
                    break

            # ── If actions requested a follow-up screenshot, loop ────
            if needs_screenshot:
                print(f"\n  {DIM}Checking result...{RESET}")
                time.sleep(1)
                try:
                    new_screenshot = take_screenshot()
                    response_text, new_actions, safety_warning = brain.think(
                        screenshot_b64=new_screenshot
                    )
                    print_agent(response_text)
                    print()

                    if safety_warning:
                        print_safety(safety_warning)
                    elif new_actions:
                        # Execute follow-up actions too
                        for action in new_actions:
                            if action.get("type") == "screenshot":
                                continue
                            try:
                                result = execute_action_safe(action)
                                print_action(result)
                            except Exception as e:
                                print(f"    {RED}Action failed: {e}{RESET}")
                                break

                except Exception as e:
                    print(f"  {RED}Error: {e}{RESET}")

            print()

        # ── Pause check ──────────────────────────────────────────────
        if brain.should_pause():
            print(f"  {YELLOW}Done {MAX_ACTIONS_PER_TASK} actions. Want me to continue? (yes/no){RESET}")
            try:
                cont = input(f"  {YELLOW}?{RESET} ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print()
                continue
            if cont not in ("yes", "y"):
                print(f"  {DIM}Paused. Give me a new task or say 'continue'.{RESET}\n")

        brain.trim_context()


def execute_action_safe(action):
    """Execute with import guard."""
    from screen import execute_action
    return execute_action(action)


if __name__ == "__main__":
    # Add agent dir to path so imports work
    agent_dir = os.path.dirname(os.path.abspath(__file__))
    if agent_dir not in sys.path:
        sys.path.insert(0, agent_dir)
    main()
