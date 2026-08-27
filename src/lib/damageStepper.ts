/** Order for play damage controls: heal/reduce first, then raise damage. */
export const DAMAGE_STEPPER_LABELS = ["−", "+"] as const;

export type DamageStepperAction = {
  label: (typeof DAMAGE_STEPPER_LABELS)[number];
  nextDamage: number;
  disabled: boolean;
};

export function damageStepperActions(
  damage: number,
  healthMax: number,
): DamageStepperAction[] {
  return [
    {
      label: "−",
      nextDamage: damage - 1,
      disabled: damage <= 0,
    },
    {
      label: "+",
      nextDamage: damage + 1,
      disabled: damage >= healthMax,
    },
  ];
}
