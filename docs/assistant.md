# SAHAJ Assistant

A chat panel for teachers and institution admins. It answers from the institution's own data and prepares changes that a person confirms. Students and the platform super admin do not have it.

## How it works

One chat message:

1. The API checks the login, the institution's switch, the per-minute message limit and the daily token budget.
2. The model (Gemini, function calling) is shown only the tools of the person's role.
3. When the model asks for a tool, the **gateway** checks the role, validates the arguments, runs the tool against the person's own institution, and records the call.
4. A read tool returns data to the model and tables or links to the screen.
5. A write tool does not run. It stores a **proposal** and shows a card. The change runs only when the same person presses Confirm, once.

The model never supplies the institution, user or role. They come from the signed-in account. No tool has a `tenant_id` argument; a test fails if one is added.

## Safeguards

| Rule | Where |
|---|---|
| Teacher or admin role only; the institution must have accepted the data notice | `services/agent/access.py` |
| One door for every tool call; denied and failed calls are logged too | `gateway.py`, table `agent_tool_calls` |
| Writes need a Confirm; one confirmation wins; proposals expire in 30 minutes; the person may edit only the fields a tool lists | `proposals.py` |
| A proposal is re-checked at confirm time, in case the data changed | `proposals.confirm` |
| Face data, photos, passwords and tokens are not available to any tool | tool list in `registry.py` |
| Attendance rules (minimum percentage, window, Saturday, location) change only on a Confirm card, and each change is audited; face and AI check settings are never exposed | `settings_actions.py` |
| Per-user rate limit and per-institution daily token budget | `budget.py`, Redis |
| Tool results are data, not instructions (prompt-injection note) | `prompts.py` |

## Data notice (PRD §8)

The assistant sends the question and the attendance details a tool returns, such as student names, roll numbers and attendance, to Google's Gemini service. An institution admin must accept this notice once before anyone at the institution can chat (`POST /agent/notice/accept`, stored in `tenants.settings.aiAssistant`). The notice tells the institution to have its data officer or legal adviser approve the processing. The morning briefing does not call the model, so it sends nothing outside the server.

## Setup

Set `GEMINI_API_KEY` in the production secret (`PRODUCTION_BACKEND_ENV`). It takes several keys separated by commas. Each request takes a random key that is not resting. Google gives no way to read a key's remaining quota, so the pool learns from errors. A key that returns 429 rests for the time Google gives, or until midnight Pacific when the limit is a daily one, and the same request goes to the next key at once. A key that returns 503/504 or says nothing within 15 s rests 30 s and the request moves on, trying at most 3 such keys. When every key is resting, the person is told how long to wait. Other errors are not retried on another key. Which keys rest is kept in Redis (by hash, never the key), so it survives restarts. Google applies limits per project, so keys only add capacity when each one belongs to a different project. Without a key the assistant reports that it is not set up. Optional: `GEMINI_MODEL` (default `gemini-3.5-flash`), `AGENT_MESSAGES_PER_MINUTE`, `AGENT_DAILY_TOKEN_BUDGET`.

The client talks to the `v1beta` API (function calling is not offered on `v1`) and gives up on the whole answer after 40 s with no retry. When every key is at its limit it shows as "busy, try again in about N minutes". Free-tier keys have very low limits (a few requests a minute, and per-day caps on some models), so production needs a paid key. Models newer than 3.5 did not answer for the test key, so check the model with your own key before changing the default.

The morning briefing is a cron job in the existing `sahaj-worker` (07:30 India time). It needs no extra process.

## Stage 1 tools (read, and messages with a Confirm)

| Tool | Role | What it does |
|---|---|---|
| `my_schedule`, `class_register`, `my_classes` | teacher | Own classes, a day's register, ids |
| `my_flagged_records` | teacher | Flagged scans waiting for review, with reasons |
| `pending_approvals` | teacher | Own students' leave and device requests |
| `students_below_minimum`, `at_risk_students`, `exam_eligibility` | both | Under the minimum, or dropping over 14 days; Excel link. Lists only; it never applies condonation |
| `attendance_trend` | admin | Each class now versus the period before |
| `institution_stats`, `setup_checks`, `approvals_backlog` | admin | Headline numbers, what is left to set up, what is waiting |
| `find_classes`, `find_students`, `find_teachers` | both (teachers: own students) | Names to ids |
| `how_do_i` | both | Steps from `services/agent/knowledge/*.md`, with a page link |
| `send_message` | both | Prepares an in-app notification; sent on Confirm. No e-mail |

Leave and device-change requests are decided by teachers in this product, so the admin sees the backlog but does not decide them.

## Tests

`tests/unit/test_agent_*.py` (gateway, loop, registry, guides) use a scripted model. `tests/integration/test_agent_*.py` run the real API, database and Redis with a scripted model (`agent_world.py`). Nothing calls Gemini. Web: `src/__tests__/lib/agent-chat.test.ts`, `src/__tests__/components/agent-panel.test.tsx`.

## Stage 2 tools (teacher actions, every one waits for Confirm)

| Tool | What it does | Rules kept |
|---|---|---|
| `start_attendance` | Opens attendance for a class today, or starts an unscheduled one from its subject | Own class only, not closed, not cancelled, same day |
| `stop_attendance` | Closes the register; unmarked students become absent, or excused on approved leave | Own class only; the card shows how many will be marked |
| `mark_attendance` | Sets students PRESENT, ABSENT, EXCUSED or LATE for one class | Enrolled students only; a closed register needs a reason; each change is audited |
| `resolve_flagged_marks` | Approves or rejects flagged marks; the student is told | Own class only; a closed register needs a note |
| `decide_leaves` | Approves or rejects pending leave of the teacher's students | Own students only; approval excuses closed classes in those dates |
| `decide_device_changes` | Approves or rejects new-phone requests | Own students only; the card reminds the teacher to check it is the student's phone |

These call the same services as the web screens, so audit rows, notifications and streak updates are identical.

## Stage 3 tools (admin setup agent, every write waits for Confirm)

| Tool | What it does | Rules kept |
|---|---|---|
| `create_departments`, `create_subjects`, `create_classrooms` | Adds many at once | Existing codes or names (any letter case) and repeats in the list are refused before anything is saved; same code in another institution is fine |
| `create_batches` | Adds batches A-1, A-2... to a department section | Numbers continue from the last one |
| `create_class` | Creates a class for a batch and semester | Batch's students who are in no class join it, as the web form does; one active class per batch |
| `set_class_semester` | Changes a class's semester number | Students move with the class; no promotion step |
| `add_subject_to_class` | Adds a subject with its teacher | Same subject twice and other institutions' teachers are refused; students are enrolled |
| `add_schedule` | Adds weekly slots to a subject | Times validated; overlaps inside the request refused; teacher and class clashes (and a switched-off Saturday) are checked on Confirm, and the message says how many slots were already added |
| `import_students`, `import_teachers` | Imports rows the admin pasted from a sheet; the model maps odd column headers | A dry run lists rows that will be skipped (unknown department or batch, duplicate e-mail or roll, repeats); licence seats checked; the model cannot set passwords; each new person gets the normal invitation e-mail |
| `find_substitutes`, `assign_substitute` | Free teachers for an absent teacher's classes, then covers one class | Same-department teachers first; a teacher with an overlapping class, a closed class, or another institution's teacher is refused; the covering teacher is told; audited |
| `proxy_watch` | Several students on one phone, repeated new-phone requests, most flagged marks | Leads only, never proof; device ids are never shown |
| `find_setup_items`, `list_all_classes`, `class_overview` | Lookups that give the ids setup tools need | Own institution only |

Invitation e-mails from an import are the product's normal ones. The assistant sends no e-mail of its own.

## Stage 4 tools (admin, every write waits for Confirm)

| Tool | What it does | Rules kept |
|---|---|---|
| `update_institution_settings` | Changes minimum %, attendance window, Saturday, location check, location radius or campus coordinates | Only these fields; face and AI check settings are not reachable; the card shows now and becomes; one audit row (`UPDATE_SYSTEM_CONFIG`) per change |
| `update_master_item`, `delete_master_item`, `change_batch`, `create_designations` | Edit, remove or archive departments, subjects, classrooms, designations, batches | Existing codes and names refused; a record in use cannot be deleted |
| `update_student`, `update_teacher` | Corrects a person's details; a batch change moves the student's class | Roll and employee ids stay unique; another institution's records are not found |
| `change_class_students`, `change_subject_teacher`, `remove_subject_from_class`, `remove_schedule_slots` | Class members, a subject's teacher, a subject removed, timetable slots removed | A clash, a student in another class or attendance already taken is refused before the card |
