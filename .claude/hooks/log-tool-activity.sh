#!/usr/bin/env bash
#
# log-tool-activity.sh - Claude hook to log tool usage
#
# This hook is called after any tool use by Claude
# Hook receives tool info via stdin (JSON format)

set -euo pipefail

# Read tool info from stdin
TOOL_INFO=$(cat)

# Debug: Save raw input to see what we're receiving
echo "$TOOL_INFO" >> /tmp/claude-hook-debug.log

# Parse tool name and parameters (correct JSON paths)
TOOL_NAME=$(echo "$TOOL_INFO" | jq -r '.tool_name // "Unknown"' 2>/dev/null || echo "Unknown")

# Build preview based on tool type
case "$TOOL_NAME" in
    Read)
        FILE_PATH=$(echo "$TOOL_INFO" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")
        PREVIEW="Reading $(basename "$FILE_PATH")"
        ~/code/jat/scripts/log-agent-activity \
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
            --type tool \
            --tool "Bash" \
            --preview "$PREVIEW" \
            --content "Bash: $COMMAND"
        ;;
    Grep|Glob)
        PATTERN=$(echo "$TOOL_INFO" | jq -r '.tool_input.pattern // ""' 2>/dev/null || echo "")
        PREVIEW="Searching: $PATTERN"
        ~/code/jat/scripts/log-agent-activity \
            --type tool \
            --tool "$TOOL_NAME" \
            --preview "$PREVIEW" \
            --content "$TOOL_NAME: $PATTERN"
        ;;
    *)
        # Generic tool logging
        PREVIEW="Using tool: $TOOL_NAME"
        ~/code/jat/scripts/log-agent-activity \
            --type tool \
            --tool "$TOOL_NAME" \
            --preview "$PREVIEW" \
            --content "Tool: $TOOL_NAME"
        ;;
esac

exit 0
