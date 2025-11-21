---
argument-hint: [planning-doc-path]
---

Convert planning session ideas into structured, actionable Beads tasks with dependencies and priorities.

# Plan: From Ideas to Tasks

**Use this command when:**
- After a brainstorming or planning session with many ideas
- You have a feature spec or requirements doc to break down
- Need to convert high-level goals into actionable tasks
- Want to structure and prioritize a batch of work items

**What this does:**
- Analyzes planning input (doc, conversation, inline ideas)
- Asks clarifying questions about ambiguities
- Breaks down into logical, sized tasks
- Identifies dependencies between tasks
- Assigns priorities based on impact/urgency
- Creates all tasks in Beads with proper structure
- Reports summary of created tasks

**Usage:**
- `/plan` - Analyze conversation OR ask for planning input
- `/plan path/to/planning-doc.md` - Process specific planning document
- `/plan "inline: build user auth system with Google OAuth"` - Inline idea

---

Follow these steps in order:

## PART 0: Conversation Analysis (If No Explicit Input)

**Only execute this step if `$1` is empty (no file path or inline text provided).**

### Analyze Recent Conversation

Review the last 5-10 messages in conversation history:

1. **Search for planning signals:**
   - Feature discussions ("we need to...", "let's build...", "I want...")
   - Requirements mentioned ("should support...", "must have...", "needs to...")
   - Problem statements ("users can't...", "currently broken...", "missing...")
   - Ideas or brainstorming ("what about...", "could we...", "maybe...")
   - Lists of features or capabilities mentioned

2. **Extract planning context:**
   - **Features mentioned**: What capabilities were discussed?
   - **Requirements**: Any specific needs or constraints stated?
   - **User stories**: Any "as a user..." or "when I..." narratives?
   - **Technical details**: Tech stack, integrations, APIs mentioned?
   - **Priorities**: Any urgency or importance signals?
   - **Scope**: What's in vs out?

3. **Determine if planning context exists:**

   **If CLEAR planning context found** (feature/project discussion):
   - Extract all features, requirements, constraints
   - Move to PART 1 using conversation as planning input
   - Note: "Planning from conversation context"

   **If VAGUE/UNCLEAR context** (mentioned ideas but not detailed):
   - Summarize what was mentioned
   - Ask: "I noticed discussion about [topic]. Should I create a planning doc for this?"
   - If yes: Proceed to gather more detail
   - If no: Ask for planning doc or inline text

   **If NO planning context** (pure technical/code discussion):
   - Skip to PART 1 and ask for planning input directly

### Example Detection Patterns

**Clear planning context:**
```
User: "We need to add Stripe payments to the app. Users should be able
to subscribe monthly or yearly. We'll need a subscription management page
and webhook handlers for payment events. Also need to restrict features
based on subscription tier."
```
→ **Detected**: Stripe integration feature with subscription tiers
→ **Action**: Proceed to PART 1 using this as planning input

**Vague context:**
```
User: "I've been thinking about adding some kind of payment system"
```
→ **Detected**: Payment system mentioned but underspecified
→ **Action**: Ask "Should I help plan a payment integration? What's the vision?"

**No planning context:**
```
User: "This TypeScript error in UserService is annoying"
```
→ **Detected**: Technical discussion, not planning
→ **Action**: Ask for planning doc or say "No planning context detected"

---

## PART 1: Gather Planning Input

1. **Collect planning information:**
   - **If PART 0 found conversation context**: Use extracted context as planning input
   - **If `$1` is a file path**: Read that planning document
   - **If `$1` starts with "inline:"**: Use the inline text as planning input
   - **If `$1` is empty AND no conversation context**: Ask user to provide planning input or paste ideas

2. **Parse the planning content:**
   - Identify distinct features, capabilities, or work items
   - Extract any mentioned requirements, constraints, or goals
   - Note any priorities or timelines mentioned
   - Identify any obvious dependencies or sequencing

## PART 2: Clarify and Understand

3. **Identify ambiguities and gaps:**
   - What's unclear or underspecified?
   - What assumptions need validation?
   - What decisions need to be made?
   - What's the scope boundary (what's in/out)?

4. **Ask clarifying questions using AskUserQuestion:**
   Ask about (select most important, max 4 questions):

   - **Scope boundaries:**
     - "What's included in MVP vs future iterations?"
     - "Any features explicitly out of scope?"

   - **Priority guidance:**
     - "What's most critical for initial release?"
     - "What can be deferred if time is tight?"

   - **Technical constraints:**
     - "Any technology preferences or constraints?"
     - "Performance/scale requirements?"

   - **Dependencies:**
     - "Any external dependencies (APIs, services)?"
     - "Any prerequisite work needed first?"

   - **Success criteria:**
     - "How will we know this is complete?"
     - "What does 'done' look like?"

5. **Synthesize understanding:**
   - Combine planning input with user answers
   - Form clear picture of what needs to be built
   - Identify natural task boundaries

## PART 3: Structure Tasks

6. **Break down into tasks:**

   **Task sizing guidelines:**
   - Each task should be completable in 2-8 hours of focused work
   - If bigger: break into smaller tasks with dependencies
   - If smaller: might be a subtask or combine with related work

   **Task breakdown strategies:**
   - By feature/capability (e.g., "User authentication", "Profile management")
   - By technical layer (e.g., "Database schema", "API endpoints", "UI components")
   - By user journey (e.g., "Signup flow", "Login flow", "Password reset")
   - By dependency chain (foundation → building blocks → features)

7. **Identify dependencies:**
   - Which tasks must happen before others?
   - Which tasks can be parallelized?
   - What's on the critical path?
   - Any external dependencies to track?

8. **Assign priorities:**

   **Priority levels (P0-P2):**
   - **P0 (Critical)**: Blocks everything else, must be done first, core foundation
   - **P1 (High)**: Important for MVP, high user value, enables other work
   - **P2 (Medium)**: Nice to have, can defer, enhancements

   **Priority factors:**
   - Impact on user value
   - Blocks other work (dependencies)
   - Risk/uncertainty (do risky things early)
   - Time sensitivity (deadlines, market windows)

9. **Structure task descriptions:**

   Each task should have:
   - **Clear title**: Verb + noun (e.g., "Implement Google OAuth login")
   - **Description**: What needs to be done and why
   - **Acceptance criteria**: How to know it's complete
   - **Dependencies**: What must be done first (if any)
   - **Notes**: Any important context, links, constraints

## PART 4: Create Tasks in Beads

10. **Create each task:**
    ```bash
    bd create "Task title" \
      --description "Detailed description with acceptance criteria" \
      --priority P[0-2] \
      --status created \
      --tags "tag1,tag2"
    ```

11. **Set up dependencies:**
    ```bash
    # For each task that depends on another:
    bd dep add <task-id> <dependency-task-id>
    ```

12. **Verify task structure:**
    - Run `bd ready --json` to see what's now ready
    - Confirm P0 tasks have no dependencies (can start immediately)
    - Confirm dependency chains make sense

## PART 5: Report Results

13. **Generate comprehensive report** (see format below)

---

## Output Format

After completing all steps above, format your final output using this template:

```
╔══════════════════════════════════════════════════════════════════════════╗
║                     📋 PLANNING SESSION COMPLETE                         ║
║                                                                          ║
║                    🤖 Agent: [YOUR-AGENT-NAME]                           ║
╚══════════════════════════════════════════════════════════════════════════╝

📝 Planning Input: [source - file path, inline, or user-provided]
🎯 Scope: [brief summary of what's being planned]
✅ Questions Answered: [X clarifying questions resolved]

┌─ TASKS CREATED ────────────────────────────────────────────────────────┐
│                                                                        │
│  📊 Total Tasks: [X tasks created]                                     │
│  🔴 P0 (Critical): [X tasks]                                           │
│  🟠 P1 (High): [X tasks]                                               │
│  🟡 P2 (Medium): [X tasks]                                             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌─ CRITICAL PATH (P0 Tasks) ─────────────────────────────────────────────┐
│                                                                        │
│  These must be done first:                                             │
│                                                                        │
│  1. [task-id] - [Task title]                                           │
│     └─ [Brief description]                                             │
│     └─ Dependencies: [None or task-ids]                                │
│     └─ Enables: [tasks that depend on this]                            │
│                                                                        │
│  2. [task-id] - [Task title]                                           │
│     └─ [Brief description]                                             │
│     └─ Dependencies: [None or task-ids]                                │
│     └─ Enables: [tasks that depend on this]                            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌─ HIGH PRIORITY (P1 Tasks) ─────────────────────────────────────────────┐
│                                                                        │
│  Important for MVP:                                                    │
│                                                                        │
│  • [task-id] - [Task title]                                            │
│    └─ Dependencies: [task-ids or "None"]                               │
│                                                                        │
│  • [task-id] - [Task title]                                            │
│    └─ Dependencies: [task-ids or "None"]                               │
│                                                                        │
│  [... list all P1 tasks ...]                                           │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌─ MEDIUM PRIORITY (P2 Tasks) ───────────────────────────────────────────┐
│                                                                        │
│  Enhancements and nice-to-haves:                                       │
│                                                                        │
│  • [task-id] - [Task title]                                            │
│  • [task-id] - [Task title]                                            │
│  [... list all P2 tasks ...]                                           │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌─ DEPENDENCY GRAPH ─────────────────────────────────────────────────────┐
│                                                                        │
│  Task dependency visualization:                                        │
│                                                                        │
│  [Foundation Layer - No Dependencies]                                  │
│  ├─ [task-id]: [Task title]                                            │
│  └─ [task-id]: [Task title]                                            │
│                                                                        │
│  [Building Blocks - Depend on Foundation]                              │
│  ├─ [task-id]: [Task title] (depends: task-id)                         │
│  └─ [task-id]: [Task title] (depends: task-id)                         │
│                                                                        │
│  [Features - Depend on Building Blocks]                                │
│  ├─ [task-id]: [Task title] (depends: task-id, task-id)                │
│  └─ [task-id]: [Task title] (depends: task-id)                         │
│                                                                        │
│  [Parallel Work - Can be done concurrently]                            │
│  ├─ [task-id, task-id, task-id]                                        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌─ EXECUTION STRATEGY ───────────────────────────────────────────────────┐
│                                                                        │
│  Recommended approach:                                                 │
│                                                                        │
│  Phase 1: Foundation (P0 tasks with no dependencies)                   │
│  ├─ Start with: [task-id, task-id]                                     │
│  └─ Can be parallelized by multiple agents                             │
│                                                                        │
│  Phase 2: Core Features (P0-P1 tasks depending on Phase 1)             │
│  ├─ After foundation: [task-id, task-id]                               │
│  └─ Some parallelization possible                                      │
│                                                                        │
│  Phase 3: Polish & Enhancements (P1-P2 tasks)                          │
│  ├─ After core: [task-id, task-id]                                     │
│  └─ Highest parallelization opportunity                                │
│                                                                        │
│  ⚡ Parallelization Opportunities:                                     │
│     • Phase 1: [X tasks] can run in parallel                           │
│     • Phase 2: [Y tasks] can run in parallel                           │
│     • Phase 3: [Z tasks] can run in parallel                           │
│                                                                        │
│  ⏱️  Estimated Timeline:                                               │
│     • If sequential: ~[X] hours/days                                   │
│     • With [N] parallel agents: ~[Y] hours/days                        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌─ SCOPE SUMMARY ────────────────────────────────────────────────────────┐
│                                                                        │
│  ✅ In Scope:                                                          │
│     • [Feature/capability 1]                                           │
│     • [Feature/capability 2]                                           │
│     • [Feature/capability 3]                                           │
│                                                                        │
│  ❌ Out of Scope (for now):                                            │
│     • [Future feature 1]                                               │
│     • [Future feature 2]                                               │
│                                                                        │
│  ⚠️  Open Questions/Risks:                                             │
│     • [Question or risk 1]                                             │
│     • [Question or risk 2]                                             │
│     • Or: "No open questions"                                          │
│                                                                        │
│  📚 References:                                                        │
│     • Planning doc: [path if applicable]                               │
│     • Related threads: [Agent Mail threads]                            │
│     • External docs: [links if any]                                    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌─ DETAILED TASK LIST ───────────────────────────────────────────────────┐
│                                                                        │
│  [For each task, provide full details:]                                │
│                                                                        │
│  📌 [task-id] (P[X]): [Task Title]                                     │
│  ├─ Description:                                                       │
│  │  [What needs to be done and why]                                    │
│  ├─ Acceptance Criteria:                                               │
│  │  • [Criterion 1]                                                    │
│  │  • [Criterion 2]                                                    │
│  ├─ Dependencies: [task-ids or "None"]                                 │
│  ├─ Enables: [task-ids that depend on this, or "None"]                 │
│  ├─ Estimated Effort: [X hours/days]                                   │
│  ├─ Tags: [tag1, tag2]                                                 │
│  └─ Notes: [Any important context or constraints]                      │
│                                                                        │
│  [... repeat for each task ...]                                        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║                   📋✅ PLANNING COMPLETE - TASKS READY ✅📋              ║
║                                                                          ║
║                       	📊 Created: [X] tasks							║
║                       	🚀 Ready to start: [Y] tasks						║
║																			║
║ 	                     🤖 Agent: [YOUR-AGENT-NAME]    					║
║																			║
╚══════════════════════════════════════════════════════════════════════════╝

💡 Next Steps:
   • Use `bd ready` to see immediately available tasks
   • Use `/start` to begin work on highest priority
   • Multiple agents can start P0 tasks in parallel
   • Review dependency graph to understand task flow
```

---

## Task Sizing Best Practices

**Good task size (2-8 hours):**
- ✅ "Implement Google OAuth login flow"
- ✅ "Create user profile database schema"
- ✅ "Build profile edit UI component"

**Too big (break down):**
- ❌ "Build entire authentication system" → Break into: OAuth, sessions, permissions, UI, etc.
- ❌ "Implement user management" → Break into: registration, profiles, settings, etc.

**Too small (might combine):**
- ⚠️ "Add button" → Might be part of larger UI task
- ⚠️ "Update import" → Might be part of larger refactor

**Good breakdown example:**
```
Feature: User Authentication System

P0 Tasks (Foundation):
├─ dirt-001: Set up Supabase auth configuration
├─ dirt-002: Create users table schema with RLS policies
└─ dirt-003: Implement session management utilities

P1 Tasks (Core Features):
├─ dirt-004: Build Google OAuth login flow (depends: dirt-001, dirt-002)
├─ dirt-005: Build email/password login flow (depends: dirt-002)
├─ dirt-006: Create login UI components (depends: dirt-004, dirt-005)
└─ dirt-007: Implement logout and session cleanup (depends: dirt-003)

P2 Tasks (Enhancements):
├─ dirt-008: Add password reset flow (depends: dirt-005)
├─ dirt-009: Add email verification (depends: dirt-005)
└─ dirt-010: Add profile completion wizard (depends: dirt-006)
```

---

## Handling Complex Planning Inputs

### Large Feature Specs
If planning doc is extensive (>50 tasks potential):
1. Ask user if they want to break into multiple planning sessions
2. Focus on MVP/Phase 1 first
3. Create separate planning sessions for future phases

### Vague Requirements
If input is very high-level:
1. Ask MORE clarifying questions (up to 4)
2. Make reasonable assumptions and document them
3. Create placeholder tasks for areas needing more definition
4. Tag uncertain tasks with "needs-refinement"

### Mixed Priority Signals
If user gives conflicting priority guidance:
1. Ask explicit priority ranking question
2. Default to: foundation → core features → enhancements
3. Document priority rationale in task notes

---

## Best Practices

1. **Ask clarifying questions:**
   - Don't guess on ambiguities
   - Use AskUserQuestion for important decisions
   - Document assumptions if you must make them

2. **Right-size tasks:**
   - 2-8 hours is ideal
   - Break down large epics
   - Group tiny subtasks

3. **Identify ALL dependencies:**
   - Technical dependencies (A must be done before B)
   - Logical dependencies (design before implementation)
   - External dependencies (API docs, decisions)

4. **Assign meaningful priorities:**
   - P0: Critical path, blocks everything
   - P1: Important for MVP, high value
   - P2: Nice to have, defer if needed

5. **Write clear descriptions:**
   - What needs to be done
   - Why it's needed (context)
   - How to know it's complete (acceptance criteria)

6. **Enable parallelization:**
   - Minimize unnecessary dependencies
   - Identify what CAN run in parallel
   - Front-load foundation work so features can parallelize

7. **Create actionable tasks:**
   - Each task should be clear enough to start immediately
   - Include links to specs, docs, references
   - Note any constraints or requirements

---

## Example Planning Session

**Input:** "We need to build a user authentication system with Google OAuth and email/password options"

**Clarifying Questions:**
1. Priority: Is this blocking other work? → Yes, need it for MVP
2. Scope: Include password reset? → Yes for email/password
3. Scope: Email verification required? → Nice to have, P2
4. Constraint: Use Supabase auth? → Yes, existing infrastructure

**Tasks Created:**
```
P0 - Foundation (no dependencies):
  dirt-abc: Set up Supabase auth config
  dirt-def: Create users table schema with RLS
  dirt-ghi: Implement session management utils

P1 - Core (depend on foundation):
  dirt-jkl: Google OAuth flow (depends: dirt-abc, dirt-def)
  dirt-mno: Email/password flow (depends: dirt-def)
  dirt-pqr: Login UI components (depends: dirt-jkl, dirt-mno)
  dirt-stu: Logout & cleanup (depends: dirt-ghi)

P2 - Enhancements (depend on core):
  dirt-vwx: Password reset (depends: dirt-mno)
  dirt-yz1: Email verification (depends: dirt-mno)
```

**Execution Plan:**
- Phase 1: 3 agents can work on P0 tasks in parallel
- Phase 2: After P0 complete, 4 agents on P1 tasks
- Phase 3: P2 tasks as capacity allows

---

**IMPORTANT:**
- Always ask clarifying questions - don't guess on requirements
- Break down into right-sized tasks (2-8 hours each)
- Set up dependencies correctly - this enables parallel work
- Assign priorities thoughtfully - this guides execution order
- Create tasks with enough detail to start immediately
- Generate comprehensive report so team understands the plan
