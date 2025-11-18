#!/bin/bash

# Symlink Agent Tools to ~/.local/bin
# Makes all 43 tools globally available

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Setting up Agent Tools symlinks...${NC}"
echo ""

# Ensure ~/.local/bin exists
mkdir -p ~/.local/bin

# Source directory for tools - try jomarchy-agent-tools first, then jomarchy
if [ -d "$HOME/code/jomarchy-agent-tools/tools" ]; then
    TOOLS_DIR="$HOME/code/jomarchy-agent-tools/tools"
elif [ -d "$HOME/code/jomarchy/tools" ]; then
    TOOLS_DIR="$HOME/code/jomarchy/tools"
else
    echo -e "${YELLOW}  ⚠ Tools directory not found${NC}"
    echo "  Tried:"
    echo "    - $HOME/code/jomarchy-agent-tools/tools"
    echo "    - $HOME/code/jomarchy/tools"
    exit 1
fi

# Resolve symlink if needed
TOOLS_DIR=$(readlink -f "$TOOLS_DIR")

# Count tools
TOOL_COUNT=$(find "$TOOLS_DIR" -maxdepth 1 -type f -executable | wc -l)
echo "  Found $TOOL_COUNT tools in $TOOLS_DIR"
echo ""

LINKED_COUNT=0
SKIPPED_COUNT=0
UPDATED_COUNT=0

# Symlink each tool
for tool in "$TOOLS_DIR"/*; do
    # Skip if not a file or not executable
    if [ ! -f "$tool" ] || [ ! -x "$tool" ]; then
        continue
    fi

    TOOL_NAME=$(basename "$tool")
    TARGET="$HOME/.local/bin/$TOOL_NAME"

    # Check if symlink already exists and points to correct location
    if [ -L "$TARGET" ]; then
        CURRENT_TARGET=$(readlink "$TARGET")
        if [ "$CURRENT_TARGET" = "$tool" ]; then
            echo -e "  ${GREEN}✓${NC} $TOOL_NAME (already linked)"
            SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
            continue
        else
            echo -e "  ${YELLOW}↻${NC} $TOOL_NAME (updating link)"
            rm "$TARGET"
            UPDATED_COUNT=$((UPDATED_COUNT + 1))
        fi
    elif [ -e "$TARGET" ]; then
        echo -e "  ${YELLOW}⚠${NC} $TOOL_NAME (file exists, not a symlink - skipping)"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        continue
    fi

    # Create symlink
    ln -s "$tool" "$TARGET"
    echo -e "  ${GREEN}+${NC} $TOOL_NAME (linked)"
    LINKED_COUNT=$((LINKED_COUNT + 1))
done

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Agent Tools Setup Complete${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "  Total tools: $TOOL_COUNT"
echo "  Newly linked: $LINKED_COUNT"
echo "  Updated: $UPDATED_COUNT"
echo "  Skipped (already correct): $SKIPPED_COUNT"
echo ""

# Verify PATH includes ~/.local/bin
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo -e "${YELLOW}  ⚠ ~/.local/bin is not in your PATH${NC}"
    echo "  Add to ~/.bashrc:"
    echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
fi

echo "  Test tools:"
echo "    am-inbox --help"
echo "    browser-eval.js --help"
echo ""

echo "  Tool categories:"
echo "    • Agent Mail (12): am-register, am-inbox, am-send, am-reply, am-ack, ..."
echo "    • Browser (7): browser-start.js, browser-nav.js, browser-eval.js, ..."
echo "    • Additional (24): db-*, monitoring, media, deployment helpers"
echo ""
