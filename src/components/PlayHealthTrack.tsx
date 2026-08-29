import { selectionPlayState } from "@/engine/queries";
import { damageStepperActions } from "@/lib/damageStepper";

function StepperButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-parchment-ink/10 text-sm leading-none disabled:opacity-30"
    >
      {label}
    </button>
  );
}

export function PlayHealthTrack({
  track,
  onChange,
  aside = false,
}: {
  track: ReturnType<typeof selectionPlayState>;
  onChange: (damage: number) => void;
  aside?: boolean;
}) {
  const singleModel = track.modelsMax <= 1;
  const dead = track.damage >= track.healthMax;
  const [dec, inc] = damageStepperActions(track.damage, track.healthMax);

  if (aside) {
    return (
      <div
        className="flex w-full flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-parchment-ink/10 pt-2 sm:w-auto sm:flex-col sm:items-end sm:justify-center sm:gap-1 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3"
        onClick={(event) => event.stopPropagation()}
      >
        {dead && singleModel ? (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="rounded-md bg-illegal/15 px-1.5 py-1 text-center text-[10px] leading-tight tracking-wide uppercase text-illegal"
          >
            Dead · revive
          </button>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <StepperButton
                label={dec.label}
                onClick={() => onChange(dec.nextDamage)}
                disabled={dec.disabled}
              />
              <p className="min-w-[2.75rem] text-center font-serif text-base tabular-nums leading-none">
                {track.damage}
                <span className="ml-0.5 text-xs tracking-wide uppercase text-sheet-muted">
                  dmg
                </span>
              </p>
              <StepperButton
                label={inc.label}
                onClick={() => onChange(inc.nextDamage)}
                disabled={inc.disabled}
              />
            </div>
            <p className="text-xs tabular-nums text-sheet-muted">
              {track.healthMax} hp
              {!singleModel
                ? ` · ${track.models}/${track.modelsMax}`
                : ""}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-parchment-ink/10 pt-2"
      onClick={(event) => event.stopPropagation()}
    >
      {dead && singleModel ? (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="rounded-md bg-illegal/15 px-2 py-1 text-xs tracking-wide uppercase text-illegal"
        >
          Dead · tap to revive
        </button>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <StepperButton
              label={dec.label}
              onClick={() => onChange(dec.nextDamage)}
              disabled={dec.disabled}
            />
            <p className="min-w-[3.5rem] text-center font-serif text-base tabular-nums leading-none">
              {track.damage}
              <span className="ml-0.5 text-xs tracking-wide uppercase text-sheet-muted">
                dmg
              </span>
            </p>
            <StepperButton
              label={inc.label}
              onClick={() => onChange(inc.nextDamage)}
              disabled={inc.disabled}
            />
          </div>
          <p className="text-xs tabular-nums text-sheet-muted">
            {track.healthMax} hp
          </p>
          {!singleModel ? (
            <p className="text-xs tabular-nums text-sheet-muted">
              {track.models}
              <span className="text-sheet-muted">/{track.modelsMax}</span>
              {" models"}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
