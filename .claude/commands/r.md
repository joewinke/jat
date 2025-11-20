# Quick Register - Resume Agent Identity

**Usage:** `/r AgentName`

**Examples:**
- `/r FreeMarsh` - Resume as FreeMarsh
- `/r StrongShore` - Resume as StrongShore
- `/r PaleStar` - Resume as PaleStar

**What this command does:**
1. Registers you as the specified agent (skips interactive menu)
2. Reviews inbox and acknowledges all messages
3. Shows ready tasks from Beads
4. Categorizes tasks by capability
5. Provides work recommendations

This is a shortcut alternative to `/agent:register` - use it when you know which agent you want to resume.

---

## Implementation

Follow these steps:

### Step 1: Parse Agent Name

Extract the agent name from the command arguments:
- Agent name is the first argument after `/r`
- Required parameter - if missing, show error and instructions
- Validate that agent name looks reasonable (alphanumeric, no spaces)

### Step 2: Register Agent

```bash
am-register --name {AgentName} --program claude-code --model sonnet-4.5
```

If registration fails, show error message.

### Step 2.5: Set Environment Variable for Statusline

**CRITICAL:** Set the AGENT_NAME environment variable so the statusline displays correctly:

```bash
export AGENT_NAME={AgentName}
```

This enables the statusline to show your agent identity, task progress, and indicators.

### Step 3: Review Inbox

```bash
# Get unread messages
am-inbox {AgentName} --unread

# Acknowledge all messages
am-inbox {AgentName} --unread --json | jq -r '.[].id' | \
  xargs -I {} am-ack {} --agent {AgentName}
```

Count urgent messages for reporting.

### Step 4: Get Ready Tasks

```bash
bd ready --json
```

### Step 5: Categorize Tasks

Analyze each ready task and determine:
- Can I work on this? (no file conflicts, within capability)
- Is someone else working on it? (check file reservations)
- Is it blocked? (dependencies)

### Step 6: Report to User

Use this output format:

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    ⚡ QUICK REGISTER: {AgentName}                        ║
╚══════════════════════════════════════════════════════════════════════════╝

✅ Registered as {AgentName}
📬 Inbox: {X} messages acknowledged ({Y} urgent)
📋 Ready tasks: {X} total

┌─ HIGH PRIORITY (P0/P1) ────────────────────────────────────────────────┐
│                                                                        │
│  ✅ {task-id} (P{X}) - {title}                                         │
│     Status: Ready to start                                             │
│                                                                        │
│  ⚠️  {task-id} (P{X}) - {title}                                        │
│     Status: {Agent} is working (locked files)                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌─ RECOMMENDATIONS ──────────────────────────────────────────────────────┐
│                                                                        │
│  🎯 Best pick: {task-id} - {title}                                     │
│     Why: Highest priority + no conflicts + good fit                    │
│                                                                        │
│  💡 Alternative: {task-id} - {title}                                   │
│     Why: {reason}                                                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

💬 Ready to start? Use /start to begin work, or /start {task-id} for specific task.
```

---

## Error Handling

**If no agent name provided:**
```
❌ Usage: /r {AgentName}

Example: /r FreeMarsh

💡 Tip: Don't know which agent? Use /agent:register for interactive menu.
```

**If agent doesn't exist:**

Still register them! Agent Mail will create the identity if it doesn't exist.
Just note in the output: "✨ Created new agent identity: {AgentName}"

**If registration fails:**

Show the error from `am-register` and suggest troubleshooting steps.

---

## Notes

- This command is faster than `/agent:register` because it skips the interactive menu
- Use `/agent:register` if you want to see all available agents first
- Agent name must match exactly (case-sensitive)
- The command sets `AGENT_NAME` environment variable for the session
