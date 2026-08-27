import { describe, expect, it } from "vitest";
import {
  DAMAGE_STEPPER_LABELS,
  damageStepperActions,
} from "@/lib/damageStepper";

describe("damageStepper", () => {
  it("orders controls as − then +", () => {
    expect(DAMAGE_STEPPER_LABELS).toEqual(["−", "+"]);
    const steps = damageStepperActions(3, 10);
    expect(steps.map((step) => step.label)).toEqual(["−", "+"]);
  });

  it("disables decrement at 0 and increment at max", () => {
    expect(damageStepperActions(0, 10)[0].disabled).toBe(true);
    expect(damageStepperActions(0, 10)[1].disabled).toBe(false);
    expect(damageStepperActions(10, 10)[0].disabled).toBe(false);
    expect(damageStepperActions(10, 10)[1].disabled).toBe(true);
  });

  it("computes next damage values", () => {
    const steps = damageStepperActions(4, 12);
    expect(steps[0].nextDamage).toBe(3);
    expect(steps[1].nextDamage).toBe(5);
  });
});
