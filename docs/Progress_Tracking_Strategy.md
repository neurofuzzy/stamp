# Generic AI Agent Progress-Tracking Strategy

## 1. Introduction

This document outlines a general progress-tracking strategy suitable for projects involving AI agents, particularly in software development or complex task execution. The primary objective is to enable effective collaboration, allow agents to seamlessly pick up work, and provide a clear view of progress. This system relies on subdividing work into discrete units and managing them through a defined lifecycle.

This strategy directly complements:
*   `[Your_Project_Development_Plan.md]`: Provides the high-level tasks and phases for your specific project.
*   `[Your_Project_Milestones_And_Deliverables.md]`: Defines key integration checkpoints or deliverables.

## 2. Core Principle: Task-Based Progress

All development work will be broken down into **Tasks**. These tasks are typically derived from your project's main development plan (e.g., `[Your_Project_Development_Plan.md]`). Each major actionable item in the development plan can be considered an initial candidate for a trackable Task here.

## 3. Task Granularity and Definition

Tasks should be granular enough for an AI agent (or human team member) to:
*   Understand the scope clearly.
*   Complete it within a reasonable operational cycle.
*   Allow for focused unit testing or verification.

**Example of breaking down a Development Plan Task:**
*   **Dev Plan Task:** "Implement User Authentication Feature"
*   **Granular AI Tasks (example):**
    *   `TaskAuth.S1`: Design database schema for user credentials.
    *   `TaskAuth.S2`: Implement user registration API endpoint.
    *   `TaskAuth.S3`: Implement login API endpoint with token generation.
    *   `TaskAuth.S4`: Develop front-end registration form.
    *   `TaskAuth.S5`: Develop front-end login form.
    *   ...and so on.

## 4. Task Card Format

Each task should be represented by a "Task Card," ideally in a structured format (e.g., entries in a main tracking file like `[YOUR_PROJECT_TASK_BOARD.md]`, or individual files).

A Task Card should contain the following information:

```markdown
---
ID: Unique_Task_ID (e.g., P1.T1.S1 from Phase.Task.SubTask.Sequence)
Description: Clear, concise description of what needs to be done.
ParentDevPlanTask: Reference ID from `[Your_Project_Development_Plan.md]` (e.g., "Phase 1, Task 1.2")
DependsOn: [List of Task IDs that must be COMPLETE before this can start, if any]
State: BACKLOG | IN-PROGRESS | TESTING | INTEGRATION | COMPLETE 
AssignedTo: [Agent ID/Name | TeamMemberName | "None"]
EstComplexity: [Low | Medium | High] (Helps in task distribution)
AcceptanceCriteria:
  - [Criterion 1: e.g., 'User can register successfully.']
  - [Criterion 2: e.g., 'Registered user can log in with correct credentials.']
  - [Criterion 3: e.g., 'Unit tests for XyzService pass.']
  - [TestRef: Link to relevant test cases in `[Your_Project_Test_Plan.md]`]
DeliverableRef: [Link to relevant deliverable in `[Your_Project_Milestones_And_Deliverables.md]` if applicable]
Notes: [Space for agent/team updates, links to code, discovered issues, decisions made]
LastUpdated: [Timestamp]
LastUpdatedBy: [Agent ID/Name | TeamMemberName]
---
```
*(Note: UNIT-TESTING state from original changed to a more generic TESTING to cover various test types)*

## 5. Task Lifecycle and States

Tasks progress through the following states:

1.  **BACKLOG:**
    *   **Definition:** The task has been identified and defined but not yet started.
    *   **Entry Criteria:** Created based on `[Your_Project_Development_Plan.md]`. Dependencies noted.
    *   **Exit Criteria:** Task is selected and moved to `IN-PROGRESS`.

2.  **IN-PROGRESS:**
    *   **Definition:** Active work on implementing the task has begun.
    *   **Entry Criteria:** Task selected from `BACKLOG`. `AssignedTo`, `LastUpdated`, `LastUpdatedBy` fields are updated.
    *   **Actions:**
        *   Analyze requirements using relevant project documentation.
        *   Develop code, create designs, write content, etc.
        *   Adhere to project standards.
        *   Update `Notes` section with progress.
    *   **Exit Criteria:** Core work is complete and ready for testing. Task moved to `TESTING`.

3.  **TESTING:**
    *   **Definition:** The completed work for the task is undergoing verification.
    *   **Entry Criteria:** Implementation is complete. `LastUpdated`, `LastUpdatedBy` fields are updated.
    *   **Actions:**
        *   Execute relevant tests (unit tests, functional tests, peer reviews, etc.).
        *   Ensure tests align with `AcceptanceCriteria` and `TestRef`.
        *   If tests fail, move task back to `IN-PROGRESS` for fixes, or create new sub-tasks for bug fixing.
        *   Update `Notes` with test results.
    *   **Exit Criteria:** All relevant tests pass. Task moved to `INTEGRATION` (if applicable) or `COMPLETE`.

4.  **INTEGRATION:** (May not apply to all tasks, or may be part of `TESTING`)
    *   **Definition:** The completed work is being integrated with other parts of the project.
    *   **Entry Criteria:** Testing for the individual task has passed. `LastUpdated`, `LastUpdatedBy` updated.
    *   **Actions:**
        *   Connect the new component/feature with other system parts.
        *   Conduct integration tests, check against `DeliverableRef` functionality.
        *   Handle conflicts or issues arising from integration.
        *   Update `Notes` with integration results.
    *   **Exit Criteria:** Successfully integrated, and relevant integration checks pass. Task moved to `COMPLETE`.

5.  **COMPLETE:**
    *   **Definition:** The task is successfully done, tested, and integrated (if applicable).
    *   **Entry Criteria:** Successful testing/integration. `LastUpdated`, `LastUpdatedBy` updated.
    *   **Actions:** Final notes or summaries.
    *   **Exit Criteria:** None. The task is done.

## 6. Progress Tracking Mechanism

A shared, version-controlled system is essential. Consider:

*   **Master Task List Markdown File:**
    *   A single `[YOUR_PROJECT_TASK_BOARD.md]` file.
    *   Tasks listed sequentially with full Task Card details.
    *   Agents/team members edit this file. Git for versioning.
    *   **Pros:** Good balance of AI-parsability and human readability.
    *   **Cons:** Can become large; merge conflicts need manual resolution.
*   **Directory of Markdown Files:** One file per task.
    *   **Pros:** Simple, git-friendly.
    *   **Cons:** Overview and transitions can be cumbersome.
*   **Dedicated Project Management Tool:** (e.g., Jira, Trello, Asana, GitHub Issues)
    *   **Pros:** Rich features for tracking, reporting, collaboration.
    *   **Cons:** May require API integration for AI agents; might be overkill for smaller projects.
*   **Structured Data File (JSON/YAML):**
    *   **Pros:** Easiest for AI agents to parse/update programmatically.
    *   **Cons:** Less human-readable directly.

**Recommendation for AI-involved projects:** Start with a `Master Task List Markdown File` for simplicity and human oversight, consider transitioning if it becomes too unwieldy.

## 7. Agent/Team Workflow with the Tracking System

1.  **Sync:** Ensure the latest version of the task board/files.
2.  **Query & Select Task:** (See Autonomous Task Selection Protocol below if using AI agents)
    *   Query for tasks in `BACKLOG`. Filter by dependencies, priority, complexity. Select a task.
3.  **Update Task to `IN-PROGRESS`:** Modify task state, assign, update timestamps.
4.  **Execute & Document:** Perform work, update `Notes` frequently.
5.  **Transition States:** Update task state as work progresses, always updating timestamps and notes.
6.  **Handle Blockers:** Note blockers. If an issue requires rework in a *different* task, flag current task and create a new bug-fix task.
7.  **Mark `COMPLETE`**.

## 8. Managing Integration Complexity

*   **Dedicated Integration Tasks:** For significant integration efforts, create specific "Integration Tasks".
*   **Deliverables as Integration Checkpoints:** Use deliverables from `[Your_Project_Milestones_And_Deliverables.md]` as major integration goals.
*   **Iterative Integration:** Encourage frequent, smaller integrations.

This strategy aims to provide structure and clarity. Regular "board reviews" can help identify bottlenecks or reprioritize.

## 9. Autonomous Task Selection Protocol for AI Agents (Optional)

To enhance efficiency if AI agents are involved:

1.  **Consult Task Board & Development Plan:** AI consults `[YOUR_PROJECT_TASK_BOARD.md]` and `[Your_Project_Development_Plan.md]`.
2.  **Identify Suitable Tasks:** Look for "Backlog" tasks matching AI's role and current project phase.
3.  **Check Dependencies:** Verify prerequisite tasks are "Complete".
4.  **Prioritization:**
    *   **Phase Order:** Earlier phases first.
    *   **Sequential Order:** Default to listed order unless priority flags exist.
    *   **Critical Tasks:** High priority tasks first.
5.  **Announce Next Task (Do Not Ask):** AI announces its choice. *Example: "Having completed [Previous Task], I will now proceed with [New Task] from Phase X..."*
6.  **Initiate Work Cycle:** AI autonomously initiates its work cycle (e.g., UMPP's "Understand" phase if using `Generic_UMPP_Strategy.md`).
7.  **Procedure When Blocked:** If no unblocked tasks, AI explicitly seeks guidance. *Example: "I have completed [Previous Task]. No unblocked tasks for my role. Please advise..."*

This protocol maximizes AI autonomy, relying on established plans as the source of truth. 