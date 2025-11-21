#!/bin/bash

# Statusline and Hooks Setup
# - Copy statusline.sh to each project's .claude/ directory
# - Copy post-bash hook to ~/.claude/hooks/
# - Configure settings.json in each project with statusline and hook

# Note: Don't use 'set -e' so we continue even if one project fails

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Setting up statusline and hooks...${NC}"
echo ""

# Determine JAT installation directory
if [ -d "$HOME/code/jat" ]; then
    JAT_DIR="$HOME/code/jat"
elif [ -d "$HOME/code/jomarchy-agent-tools" ]; then
    JAT_DIR="$HOME/code/jomarchy-agent-tools"
else
    echo -e "${RED}ERROR: JAT not found in ~/code/jat or ~/code/jomarchy-agent-tools${NC}"
    exit 1
fi

# ============================================================================
# STEP 1: Install global hook to ~/.claude/hooks/
# ============================================================================

echo -e "${BLUE}Step 1: Installing global hook...${NC}"

GLOBAL_HOOKS_DIR="$HOME/.claude/hooks"
mkdir -p "$GLOBAL_HOOKS_DIR"

# Copy post-bash hook
HOOK_SOURCE="$JAT_DIR/.claude/hooks/post-bash-agent-state-refresh.sh"

# If hook doesn't exist in JAT yet, create it
if [ ! -f "$HOOK_SOURCE" ]; then
    echo "  → Creating post-bash hook template..."
    mkdir -p "$JAT_DIR/.claude/hooks"

    cat > "$HOOK_SOURCE" << 'EOF'
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
EOF

    chmod +x "$HOOK_SOURCE"
fi

# Copy hook to global directory
cp "$HOOK_SOURCE" "$GLOBAL_HOOKS_DIR/post-bash-agent-state-refresh.sh"
chmod +x "$GLOBAL_HOOKS_DIR/post-bash-agent-state-refresh.sh"

echo -e "  ${GREEN}✓ Installed post-bash hook to ~/.claude/hooks/${NC}"
echo ""

# ============================================================================
# STEP 2: Setup per-project statusline and settings.json
# ============================================================================

echo -e "${BLUE}Step 2: Configuring projects...${NC}"
echo ""

# Scan ~/code/ for projects
CODE_DIR="$HOME/code"

if [ ! -d "$CODE_DIR" ]; then
    echo -e "${YELLOW}⚠ ~/code/ directory not found${NC}"
    echo "Creating $CODE_DIR..."
    mkdir -p "$CODE_DIR"
fi

REPOS_FOUND=0
STATUSLINE_CONFIGURED=0
SETTINGS_CONFIGURED=0
SKIPPED=0

for repo_dir in "$CODE_DIR"/*; do
    # Skip if not a directory
    if [ ! -d "$repo_dir" ]; then
        continue
    fi

    REPO_NAME=$(basename "$repo_dir")
    echo -e "${BLUE}→ ${REPO_NAME}${NC}"

    # Check if it's a git repository
    if [ ! -d "$repo_dir/.git" ]; then
        echo -e "  ${YELLOW}⊘ Not a git repository, skipping${NC}"
        ((SKIPPED++))
        echo ""
        continue
    fi

    ((REPOS_FOUND++))

    # Create .claude directory if needed
    mkdir -p "$repo_dir/.claude"

    # ========================================================================
    # Copy statusline.sh
    # ========================================================================

    STATUSLINE_DEST="$repo_dir/.claude/statusline.sh"
    STATUSLINE_SOURCE="$JAT_DIR/.claude/statusline.sh"

    if [ -f "$STATUSLINE_SOURCE" ]; then
        cp "$STATUSLINE_SOURCE" "$STATUSLINE_DEST"
        chmod +x "$STATUSLINE_DEST"
        echo -e "  ${GREEN}✓ Installed statusline.sh${NC}"
        ((STATUSLINE_CONFIGURED++))
    else
        echo -e "  ${YELLOW}⚠ Statusline source not found, skipping${NC}"
    fi

    # ========================================================================
    # Configure settings.json
    # ========================================================================

    SETTINGS_FILE="$repo_dir/.claude/settings.json"

    # Check if settings.json already exists
    if [ -f "$SETTINGS_FILE" ]; then
        # Check if it already has statusLine configuration
        if grep -q '"statusLine"' "$SETTINGS_FILE"; then
            echo -e "  ${GREEN}✓${NC} settings.json already configured"
        else
            # Add statusLine and hooks configuration
            echo "  → Updating settings.json with statusline and hooks..."

            # Use jq to merge configuration
            TEMP_SETTINGS=$(mktemp)
            if jq '. + {
                "statusLine": {
                    "type": "command",
                    "command": "./.claude/statusline.sh",
                    "padding": 1
                },
                "hooks": {
                    "PostToolUse": [
                        {
                            "matcher": "^Bash$",
                            "hooks": [
                                {
                                    "type": "command",
                                    "command": "~/.claude/hooks/post-bash-agent-state-refresh.sh",
                                    "statusMessage": "Checking agent state changes...",
                                    "streamStdinJson": true
                                }
                            ]
                        }
                    ]
                }
            }' "$SETTINGS_FILE" > "$TEMP_SETTINGS" 2>/dev/null; then
                mv "$TEMP_SETTINGS" "$SETTINGS_FILE"
                echo -e "  ${GREEN}✓ Updated settings.json${NC}"
                ((SETTINGS_CONFIGURED++))
            else
                echo -e "  ${YELLOW}⚠ Failed to update settings.json (invalid JSON?)${NC}"
                rm -f "$TEMP_SETTINGS"
            fi
        fi
    else
        # Create new settings.json
        echo "  → Creating settings.json with statusline and hooks..."
        cat > "$SETTINGS_FILE" << 'EOF'
{
  "statusLine": {
    "type": "command",
    "command": "./.claude/statusline.sh",
    "padding": 1
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "^Bash$",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/post-bash-agent-state-refresh.sh",
            "statusMessage": "Checking agent state changes...",
            "streamStdinJson": true
          }
        ]
      }
    ]
  }
}
EOF
        echo -e "  ${GREEN}✓ Created settings.json${NC}"
        ((SETTINGS_CONFIGURED++))
    fi

    echo ""
done

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Statusline and Hooks Setup Complete${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "  Total repos found: $REPOS_FOUND"
echo "  Statusline configured: $STATUSLINE_CONFIGURED"
echo "  Settings.json configured: $SETTINGS_CONFIGURED"
echo "  Skipped (not git repos): $SKIPPED"
echo ""

if [ $REPOS_FOUND -eq 0 ]; then
    echo -e "${YELLOW}  ⚠ No repositories found in ~/code/${NC}"
    echo "  Clone some projects to ~/code/ to get started"
else
    echo "  All repositories now have:"
    echo "    • Multi-line statusline showing agent, task, git, context"
    echo "    • Real-time updates when running am-* or bd commands"
    echo ""
    echo "  Open Claude Code in any project to see the statusline in action!"
    echo ""
fi
