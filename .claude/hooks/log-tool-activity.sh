#!/usr/bin/env bash
#
# log-tool-activity.sh - Claude hook to log tool usage
#
# This hook is called after any tool use by Claude
# Hook receives tool info via stdin (JSON format)

set -euo pipefail

# Read tool info from stdin
TOOL_INFO=$(cat)

# Extract session ID from hook data (preferred - always available in hooks)
SESSION_ID=$(echo "$TOOL_INFO" | jq -r '.session_id // ""' 2>/dev/null || echo "")
if [[ -z "$SESSION_ID" ]]; then
    # Fallback to PPID-based file if session_id not in JSON (shouldn't happen with hooks)
    # Note: PPID here is the hook's parent, which may not be correct
    SESSION_ID=$(cat /tmp/claude-session-${PPID}.txt 2>/dev/null | tr -d '\n' || echo "")
fi

if [[ -z "$SESSION_ID" ]]; then
    exit 0  # Can't determine session, skip logging
fi

# Parse tool name and parameters (correct JSON paths)
TOOL_NAME=$(echo "$TOOL_INFO" | jq -r '.tool_name // "Unknown"' 2>/dev/null || echo "Unknown")

# Build preview based on tool type
case "$TOOL_NAME" in
    Read)
        FILE_PATH=$(echo "$TOOL_INFO" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")
        PREVIEW="Reading $(basename "$FILE_PATH")"
        ~/code/jat/scripts/log-agent-activity \
            --session "$SESSION_ID" \
            --type tool \
            --tool "Read" \
            --file "$FILE_PATH" \
            --preview "$PREVIEW" \
            --content "Read file: $FILE_PATH"
        ;;
    Write)
        FILE_PATH=$(echo "$TOOL_INFO" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")
        PREVIEW="Writing $(basename "$FILE_PATH")"
        ~/code/jat/scripts/log-agent-activity \
            --session "$SESSION_ID" \
            --type tool \
            --tool "Write" \
            --file "$FILE_PATH" \
            --preview "$PREVIEW" \
            --content "Write file: $FILE_PATH"
        ;;
    Edit)
        FILE_PATH=$(echo "$TOOL_INFO" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")
        PREVIEW="Editing $(basename "$FILE_PATH")"
        ~/code/jat/scripts/log-agent-activity \
            --session "$SESSION_ID" \
            --type tool \
            --tool "Edit" \
            --file "$FILE_PATH" \
            --preview "$PREVIEW" \
            --content "Edit file: $FILE_PATH"
        ;;
    Bash)
        COMMAND=$(echo "$TOOL_INFO" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")
        # Truncate long commands
        SHORT_CMD=$(echo "$COMMAND" | head -c 50)
        [[ ${#COMMAND} -gt 50 ]] && SHORT_CMD="${SHORT_CMD}..."
        PREVIEW="Running: $SHORT_CMD"
        ~/code/jat/scripts/log-agent-activity \
            --session "$SESSION_ID" \
            --type tool \
            --tool "Bash" \
            --preview "$PREVIEW" \
            --content "Bash: $COMMAND"
        ;;
    Grep|Glob)
        PATTERN=$(echo "$TOOL_INFO" | jq -r '.tool_input.pattern // ""' 2>/dev/null || echo "")
        PREVIEW="Searching: $PATTERN"
        ~/code/jat/scripts/log-agent-activity \
            --session "$SESSION_ID" \
            --type tool \
            --tool "$TOOL_NAME" \
            --preview "$PREVIEW" \
            --content "$TOOL_NAME: $PATTERN"
        ;;
    *)
        # Generic tool logging
        PREVIEW="Using tool: $TOOL_NAME"
        ~/code/jat/scripts/log-agent-activity \
            --session "$SESSION_ID" \
            --type tool \
            --tool "$TOOL_NAME" \
            --preview "$PREVIEW" \
            --content "Tool: $TOOL_NAME"
        ;;
esac

exit 0
