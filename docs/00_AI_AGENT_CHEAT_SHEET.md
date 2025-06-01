# AI Agent Quick Reference Cheat Sheet

**Objective:** Port Sploder Physics Puzzle Maker (Creator & Player) from AS3/Flash to modern web technologies (TypeScript, PixiJS, Matter.js, React).

**Core Operational Cycle: UMPP (Understand, Map, Plan, Port)**
*   **ALWAYS START HERE** when assigned a task to port an AS3 component/module/class.
*   Full details: `docs/UMPE_Strategy.md`
*   The UMPE "Plan" phase output directly informs tasks on the `PROJECT_TASK_BOARD.md`.

**Project Execution & Tracking:**
1.  **Overall Plan:** `docs/Development_Plan.md` (defines phases & high-level tasks).
2.  **Measurable Progress:** Each phase aims for **Demo Artifacts** listed in `docs/Demo_Artifacts_And_Milestones.md`. This is how we show progress.
3.  **Task Management:** Active tasks are on `PROJECT_TASK_BOARD.md` (managed per `docs/Progress_Tracking_Strategy.md`). Update your assigned tasks regularly!
    *   **Autonomous Task Selection:** When a task is complete, an AI agent should follow the "Autonomous Task Selection Protocol" detailed in `docs/Progress_Tracking_Strategy.md` (Section 5) to choose the next task.
4.  **Ensuring Progress:** For the "why" behind phases and demos, see `docs/Ensuring_Measurable_Progress.md`.

**Running Unit Tests:**
*   When unit tests are written for a task and the task is moved to `UNIT-TESTING` state, run the tests using `npm test -- <path_to_test_file> run`. The `run` flag is crucial to prevent tests from running in watch mode.

**Key Information & Resources:**
*   **ALL DOCS ARE IN `docs/`**: This is your central knowledge base.

**If Blocked or Unclear on a component:**
1.  **STOP** active task
2.  **RE-ENGAGE UMPP:** Go back to `docs/UMPE_Strategy.md`.
3.  **Focus on "UNDERSTAND" phase** for the specific code. Use codebase search and file reading tools if needed. Refer to `docs/blueprint.md` for context.
4.  Re-evaluate "Map" and refine your "Plan" before resuming task.

**Primary Goal for AI:** Methodically apply UMPE to deliver on development plan.