# Generic Understand, Map, Plan, Execute (UMPE) Strategy

## 1. Introduction

This document formalizes the **Understand, Map, Plan, Execute (UMPE)** cycle, a strategic approach for AI agents and human developers. It serves as a rubric and a go-to methodology, especially when tackling new or complex system components, features, or code sections, or when clarity is needed to move forward. UMPE ensures a consistent, methodical approach to problem-solving and implementation.

For projects involving porting from a legacy system, the "Map" phase focuses on translating old functionalities to new technologies. For new development, "Map" might involve mapping requirements to architectural components or available services.

The UMPE cycle directly supports and should be used in conjunction with your project's specific documentation, such as:
*   `[Your_Project_Overview.md]` (for overall context)
*   `[Your_Existing_System_Architecture.md]` (if refactoring/porting, for understanding original architecture)
*   `[Your_Target_System_Architecture.md]` (for understanding target design)
*   `[Your_Technology_Stack_Choices.md]` (for chosen new tech stack, if applicable)
*   `[Your_Project_Development_Plan.md]` (for high-level tasks)
*   `[Your_Progress_Tracking_Strategy.md]` (for managing task execution)

## 2. Accessing Project Documentation

**All relevant project documentation should be clearly organized and accessible (e.g., in a `docs/` or `project_docs/` directory).**

This UMPE document should be considered a primary guide for approaching complex tasks. The introductory section (Section 1) provides examples of supporting documents agents should refer to for context.

## 3. The UMPE Cycle

The cycle consists of four distinct, iterative phases:

### Phase 1: UNDERSTAND (Observe & Orient - Part A)
*   **Goal:** Gain a comprehensive understanding of the purpose, context, requirements, and high-level functionality of the specific component, feature, or code segment being examined.
*   **Guiding Question:** *"What needs to be done (or what does this existing code do), why is it needed (or why does it do it), and how does it fit into the overall system/application?"*

*   **Rubric/Checklist (Adapt as needed):**
    1.  **[ ] Identify Core Purpose/Requirements:**
        *   Clearly state the primary responsibility or the core problem to be solved.
        *   How does it contribute to the project goals (ref: `[Your_Project_Overview.md]`)?
    2.  **[ ] Contextualize within Architecture:**
        *   Locate its position and role within the existing or target architecture (ref: `[Your_Existing_System_Architecture.md]` or `[Your_Target_System_Architecture.md]`).
        *   Categorize it (e.g., UI, API, data model, business logic, utility, third-party integration).
    3.  **[ ] Identify Key Inputs & Outputs/Interactions:**
        *   What data/events/triggers does it consume or respond to?
        *   What data/events/effects/APIs does it produce or expose?
    4.  **[ ] Identify Key Collaborators (Dependencies):**
        *   List other system components, services, or libraries it directly uses or is used by.
        *   Note any dependencies on external systems or data sources.
    5.  **[ ] Identify Key Internal Logic/Algorithms (if analyzing existing code or defining new complex logic):**
        *   Summarize core logic of important methods or processes.
        *   Note complex algorithms, state management, or significant data transformations.
    6.  **[ ] Relate to User Experience or Business Value (if applicable):**
        *   How would a user perceive this functionality? What business value does it provide?

### Phase 2: MAP (Orient - Part B / Design Solution)
*   **Goal:** Determine how the understood requirements or existing functionality will be best realized using the chosen technology stack and target architecture. For new features, this is a design phase.
*   **Guiding Question:** *"How can the essence of these requirements (or this legacy code) be effectively implemented in our target environment, leveraging our chosen libraries, patterns, and architectural principles?"*

*   **Rubric/Checklist (Adapt as needed):**
    1.  **[ ] Pinpoint Legacy/Problem Specifics (if porting/refactoring):**
        *   Identify usage of old APIs, language-specific features, or outdated library functionalities.
    2.  **[ ] Determine Implementation Strategy:**
        *   Replacement: Can it be replaced by a native feature of the new language/framework or a standard modern API? (ref: `[Your_Technology_Stack_Choices.md]`).
        *   Library Mapping: Does it map to a feature in a chosen library/SDK?
        *   New Abstraction/Component: Does it require a new service, module, class, or utility in the target architecture?
        *   Obsolescence: Is the functionality no longer needed or handled differently?
    3.  **[ ] Define Target Structure/Design:**
        *   Specify the target: class, interface, functions, module, microservice, UI component, API endpoints?
        *   Propose a name and location within the project's directory structure (align with established patterns).
        *   Consider if refactoring or decomposition is needed for better alignment with design principles (e.g., SRP, microservices).
    4.  **[ ] Data Structure & Interface Mapping:**
        *   Define how data structures (from legacy systems or new requirements) will be represented (e.g., classes, interfaces, database schemas, API contracts).

### Phase 3: PLAN (Decide)
*   **Goal:** Break down the implementation effort for the understood and mapped/designed component into specific, actionable, and testable tasks.
*   **Guiding Question:** *"What are the concrete, sequential steps needed to implement and verify this?"*

*   **Rubric/Checklist:**
    1.  **[ ] Define Granular Sub-Tasks:**
        *   List specific coding/implementation steps (e.g., "Create `MyClass.ts`...", "Implement `methodA` using `XyzSDK`...", "Write unit tests for `logicB`...").
    2.  **[ ] Identify Dependencies (Task-Level):**
        *   Note prerequisite tasks from `[Your_Project_Development_Plan.md]` or the `[YOUR_PROJECT_TASK_BOARD.md]` that must be `COMPLETE`.
    3.  **[ ] Estimate Complexity (Qualitative):**
        *   Assign Low, Medium, or High (informs `[YOUR_PROJECT_TASK_BOARD.md]`).
    4.  **[ ] Define Clear Acceptance Criteria:**
        *   List specific, verifiable outcomes that prove the implemented code/feature works correctly.
        *   Reference relevant test cases from `[Your_Project_Test_Plan.md]` or SDET validation points.
    5.  **[ ] Link to Development Plan & Task Board:**
        *   Ensure this detailed plan corresponds to a task in `[Your_Project_Development_Plan.md]` and will be reflected in `[YOUR_PROJECT_TASK_BOARD.md]` as per `[Your_Progress_Tracking_Strategy.md]`.

### Phase 4: EXECUTE (Act / Implement)
*   **Goal:** Carry out the plan to build/implement the component/feature, integrate it, and verify its correctness.
*   **Guiding Question:** *"Am I implementing the plan correctly, and does the new code/feature meet all acceptance criteria?"*

*   **Rubric/Checklist:**
    1.  **[ ] Implement Code/Solution:** Write or generate code/configuration according to the plan from Phase 3.
    2.  **[ ] Adhere to Project Standards:** Follow established coding conventions, commenting guidelines, and architectural patterns.
    3.  **[ ] Test Thoroughly:** Implement and pass unit tests and other relevant tests covering acceptance criteria and core logic.
    4.  **[ ] Integrate Iteratively:** Connect the new work with other existing components or services.
    5.  **[ ] Test Integration Points:** Verify correct operation within the larger system.
    6.  **[ ] Update Progress Tracking:** Regularly update task status and notes in `[YOUR_PROJECT_TASK_BOARD.md]`.
    7.  **[ ] Document Key Decisions/Complexities:** Add in-code comments or notes to the task card for non-obvious design choices or workarounds.

## 4. Using UMPE When "Lost" or Blocked

If progress stalls, or a piece of work becomes particularly challenging:

1.  **PAUSE** current "Execute" (Act) activities.
2.  **RESET to "UNDERSTAND":** Re-engage with the requirements or original code. Focus intensely on the rubric questions for the "Understand" phase.
3.  **RE-EVALUATE in "MAP":** With refreshed understanding, critically assess if the initial mapping/design was optimal.
4.  **REFINE the "PLAN":** Break the problematic area into smaller sub-tasks. Consider a dedicated research spike.
5.  **RESUME "EXECUTE"** on the newly clarified, smaller task.

## 5. Integration with Overall Workflow

The UMPE cycle is intended to be applied when picking up tasks from the `[YOUR_PROJECT_TASK_BOARD.md]` as described in `[Your_Progress_Tracking_Strategy.md]`. The output of UMPE's "PLAN" phase should directly inform task creation/refinement on the board.

By consistently applying UMPE, projects can aim for higher quality, better team understanding, and a more predictable development process. 