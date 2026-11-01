import type { SetupCheck } from "@/types/setupStatus";

export type StepId =
  | "campus"
  | "structure"
  | "subjects"
  | "year"
  | "people"
  | "class"
  | "finish";

export interface SetupStepDef {
  id: StepId;
  title: string;
  /** Ids of the server checks this step completes. */
  checkIds: string[];
  /** Optional steps never block moving on. */
  optional: boolean;
}

export const SETUP_STEPS: SetupStepDef[] = [
  { id: "campus", title: "Campus location", checkIds: ["campus"], optional: false },
  { id: "structure", title: "Departments and teachers", checkIds: ["departments", "designations"], optional: false },
  { id: "subjects", title: "Subjects and rooms", checkIds: ["subjects", "classrooms"], optional: false },
  { id: "year", title: "Attendance rules", checkIds: [], optional: false },
  { id: "people", title: "Teachers and students", checkIds: ["teachers", "students"], optional: true },
  { id: "class", title: "First class", checkIds: ["classes"], optional: true },
  { id: "finish", title: "Review and finish", checkIds: [], optional: false },
];

function checksFor(step: SetupStepDef, checks: SetupCheck[]): SetupCheck[] {
  return checks.filter((c) => step.checkIds.includes(c.id));
}

/** A step is done when every server check it owns is done. The review step is done only by finishing setup. */
export function isStepDone(step: SetupStepDef, checks: SetupCheck[]): boolean {
  if (step.id === "finish") return false;
  return checksFor(step, checks).every((c) => c.done);
}

/** Required steps must be done before the admin can move on. Optional steps never block. */
export function canContinue(step: SetupStepDef, checks: SetupCheck[]): boolean {
  return step.optional || isStepDone(step, checks);
}

/** Index of the first required step that is not done. Falls back to the last step. */
export function firstIncompleteStepIndex(checks: SetupCheck[]): number {
  const index = SETUP_STEPS.findIndex((step) => !step.optional && !isStepDone(step, checks));
  return index === -1 ? SETUP_STEPS.length - 1 : index;
}

/** A step can be opened only if every required step before it is done. */
export function isStepReachable(index: number, checks: SetupCheck[]): boolean {
  return SETUP_STEPS.slice(0, index).every((step) => canContinue(step, checks));
}

/** The plain-language reasons the given step is not finished yet. */
export function stepBlockers(step: SetupStepDef, checks: SetupCheck[]): string[] {
  return checksFor(step, checks)
    .filter((c) => c.required && !c.done && c.blocker_message)
    .map((c) => c.blocker_message as string);
}

/** The steps an admin must complete, in wizard order. The final review step is excluded. */
export function requiredSetupSteps(): SetupStepDef[] {
  return SETUP_STEPS.filter((step) => !step.optional && step.id !== "finish");
}

/** Optional items (teachers, students, first class) that are still empty. */
export function missingOptional(checks: SetupCheck[]): SetupCheck[] {
  return checks.filter((c) => !c.required && !c.done);
}

/** Index of the step with this id, or -1. */
export function stepIndexById(id: string | null): number {
  return SETUP_STEPS.findIndex((step) => step.id === id);
}
