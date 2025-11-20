#!/bin/bash
#
# Post-Bash Hook: Agent State Refresh
#
# Detects when agent coordination commands are executed and triggers
# statusline refresh by outputting a message (which becomes a conversation
# message, which triggers statusline update).
#
# Monitored commands:
#   - am-* (Agent Mail: reserve, release, send, reply, ack, etc.)
#   - bd (Beads: create, update, close, etc.)
#   - /agent:* slash commands (via SlashCommand tool)
#
# Hook input (stdin): JSON with tool name, input, and output
# Hook output (stdout): Message to display (triggers statusline refresh)

# Read JSON input from stdin
input_json=$(cat)

# Extract the bash command that was executed
command=$(echo "$input_json" | jq -r '.input.command // empty')

# Check if command is empty or null
if [[ -z "$command" || "$command" == "null" ]]; then
    exit 0
fi

# Detect agent coordination commands
# Pattern: am-* (Agent Mail tools) or bd followed by space (Beads commands)
if echo "$command" | grep -qE '^(am-|bd\s)'; then
    # Extract the base command for display (first word)
    base_cmd=$(echo "$command" | awk '{print $1}')

    # Output a brief message - this triggers statusline refresh!
    # Keep it minimal to avoid cluttering the conversation
    echo "✓ $base_cmd executed"
    exit 0
fi

# No agent coordination command detected - stay silent
exit 0
