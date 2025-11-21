#!/bin/bash
#
# One-time migration: Add streamStdinJson to existing Bash hooks
# Fixes PostToolUse:Bash hook errors in all projects

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Fixing hook streamStdinJson in all projects...${NC}"
echo ""

FIXED=0
ALREADY_OK=0
SKIPPED=0

for settings_file in ~/code/*/.claude/settings.json; do
    # Skip if file doesn't exist
    if [ ! -f "$settings_file" ]; then
        continue
    fi

    PROJECT=$(basename $(dirname $(dirname "$settings_file")))
    echo -e "${BLUE}→ ${PROJECT}${NC}"

    # Check if file has the Bash hook
    if ! jq -e '.hooks.PostToolUse[]? | select(.matcher == "^Bash$")' "$settings_file" &>/dev/null; then
        echo -e "  ${YELLOW}⊘ No Bash hook found, skipping${NC}"
        ((SKIPPED++))
        echo ""
        continue
    fi

    # Check if streamStdinJson already exists
    if jq -e '.hooks.PostToolUse[]? | select(.matcher == "^Bash$") | .hooks[0].streamStdinJson' "$settings_file" &>/dev/null; then
        echo -e "  ${GREEN}✓ Already has streamStdinJson${NC}"
        ((ALREADY_OK++))
        echo ""
        continue
    fi

    # Add streamStdinJson to the Bash hook
    TEMP_FILE=$(mktemp)
    if jq '.hooks.PostToolUse = [.hooks.PostToolUse[] | if .matcher == "^Bash$" then .hooks[0].streamStdinJson = true else . end]' "$settings_file" > "$TEMP_FILE" 2>/dev/null; then
        mv "$TEMP_FILE" "$settings_file"
        echo -e "  ${GREEN}✓ Fixed - added streamStdinJson: true${NC}"
        ((FIXED++))
    else
        echo -e "  ${YELLOW}⚠ Failed to update (invalid JSON?)${NC}"
        rm -f "$TEMP_FILE"
    fi

    echo ""
done

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Migration Complete${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "  Projects fixed: $FIXED"
echo "  Already correct: $ALREADY_OK"
echo "  Skipped (no hook): $SKIPPED"
echo ""
