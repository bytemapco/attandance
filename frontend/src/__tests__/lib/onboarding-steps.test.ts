import { describe, expect, it } from "vitest";
import {
  SETUP_STEPS,
  canContinue,
  firstIncompleteStepIndex,
  isStepDone,
  isStepReachable,
  missingOptional,
  requiredSetupSteps,
  stepBlockers,
  stepIndexById,
} from "@/lib/onboarding/setupSteps";
import type { SetupCheck } from "@/types/setupStatus";

const ALL_IDS = ["campus", "departments", "designations", "subjects", "classrooms", "teachers", "students", "classes"];
const REQUIRED = new Set(["campus", "departments", "designations", "subjects", "classrooms"]);

function checks(done: string[]): SetupCheck[] {
  return ALL_IDS.map((id) => ({
    id,
    label: id,
    required: REQUIRED.has(id),
    done: done.includes(id),
    count: null,
    blocker_message: REQUIRED.has(id) ? `Add ${id}` : null,
    href: `/admin/${id}`,
  }));
}

const step = (id: string) => SETUP_STEPS[stepIndexById(id)];

describe("a step is done when all its checks are done", () => {
  it("needs every check a step owns", () => {
    expect(isStepDone(step("structure"), checks(["departments"]))).toBe(false);
    expect(isStepDone(step("structure"), checks(["departments", "designations"]))).toBe(true);
  });

  it("treats a step with no server checks as done, except the final review", () => {
    expect(isStepDone(step("year"), checks([]))).toBe(true);
    expect(isStepDone(step("finish"), checks(ALL_IDS))).toBe(false);
  });
});

describe("moving on", () => {
  it("blocks on an incomplete required step", () => {
    expect(canContinue(step("campus"), checks([]))).toBe(false);
    expect(canContinue(step("campus"), checks(["campus"]))).toBe(true);
  });

  it("never blocks on an optional step", () => {
    expect(canContinue(step("people"), checks([]))).toBe(true);
    expect(canContinue(step("class"), checks([]))).toBe(true);
  });

  it("opens a step only when every required step before it is done", () => {
    expect(isStepReachable(0, checks([]))).toBe(true);
    expect(isStepReachable(1, checks([]))).toBe(false);
    expect(isStepReachable(1, checks(["campus"]))).toBe(true);
    expect(isStepReachable(SETUP_STEPS.length - 1, checks(ALL_IDS))).toBe(true);
  });

  it("finds the first required step still to do, else the last step", () => {
    expect(firstIncompleteStepIndex(checks([]))).toBe(0);
    expect(firstIncompleteStepIndex(checks(["campus", "departments", "designations"]))).toBe(stepIndexById("subjects"));
    expect(firstIncompleteStepIndex(checks(ALL_IDS))).toBe(SETUP_STEPS.length - 1);
  });
});

describe("what is left", () => {
  it("explains what blocks a step, only for required checks that are not done", () => {
    expect(stepBlockers(step("structure"), checks(["departments"]))).toEqual(["Add designations"]);
    expect(stepBlockers(step("structure"), checks(["departments", "designations"]))).toEqual([]);
    expect(stepBlockers(step("people"), checks([]))).toEqual([]);
  });

  it("lists the required steps in order without the review step", () => {
    expect(requiredSetupSteps().map((s) => s.id)).toEqual(["campus", "structure", "subjects", "year"]);
  });

  it("lists the optional items still empty", () => {
    expect(missingOptional(checks(["teachers"])).map((c) => c.id)).toEqual(["students", "classes"]);
  });

  it("looks a step up by id", () => {
    expect(stepIndexById("campus")).toBe(0);
    expect(stepIndexById("nope")).toBe(-1);
    expect(stepIndexById(null)).toBe(-1);
  });
});
