"use client";

export type SelectSlotOption = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  options: SelectSlotOption[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyText?: string;
};

/** iOS-style checkmark list. Tap any number of rows — no dropdown. */
export function SelectSlots({
  label,
  options,
  value,
  onChange,
  emptyText,
}: Props) {
  const selected = new Set(value.filter(Boolean));

  if (options.length === 0) {
    return (
      <p className="mt-3 text-sm text-sheet-muted">
        {emptyText ?? "No options."}
      </p>
    );
  }

  function toggle(id: string) {
    if (selected.has(id)) {
      onChange(value.filter((item) => item && item !== id));
      return;
    }
    onChange([...value.filter(Boolean), id]);
  }

  return (
    <fieldset className="mt-3">
      <legend className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        {label}
      </legend>
      <ul className="mt-1.5 flex flex-col">
        {options.map((option) => {
          const checked = selected.has(option.value);
          return (
            <li key={option.value}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-parchment-ink/5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option.value)}
                  className="peer sr-only"
                />
                <span className="min-w-0 flex-1 font-sans text-sm font-normal normal-case tracking-normal text-parchment-ink">
                  {option.label}
                </span>
                <CheckCircle checked={checked} />
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function CheckCircle({ checked }: { checked: boolean }) {
  if (!checked) {
    return (
      <span
        aria-hidden="true"
        className="size-5 shrink-0 rounded-full ring-[1.5px] ring-parchment-ink/30"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-aether text-parchment"
    >
      <svg
        viewBox="0 0 12 12"
        className="size-3 fill-none stroke-current stroke-[2] [stroke-linecap:round] [stroke-linejoin:round]"
      >
        <path d="M2.5 6.2 4.8 8.5 9.5 3.5" />
      </svg>
    </span>
  );
}
