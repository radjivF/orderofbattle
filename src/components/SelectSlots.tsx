"use client";

export type SelectSlotOption = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  options: SelectSlotOption[];
  value: string[];
  max: number;
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  hint?: string;
  itemNoun?: string;
  selectClassName?: string;
};

const DEFAULT_SELECT_CLASS =
  "min-h-10 w-full rounded-lg bg-parchment px-3 font-sans text-sm normal-case tracking-normal text-parchment-ink";

/** Native dropdowns, one per pick — no Cmd-click `<select multiple>`. */
export function SelectSlots({
  label,
  options,
  value,
  max,
  onChange,
  placeholder = "Choose…",
  emptyText,
  hint,
  itemNoun = "Option",
  selectClassName = DEFAULT_SELECT_CLASS,
}: Props) {
  const cap = Math.max(1, max);
  const taken = value.filter(Boolean).slice(0, cap);

  if (options.length === 0) {
    return (
      <p className="mt-3 text-sm text-sheet-muted">
        {emptyText ?? "No options."}
      </p>
    );
  }

  const unused = options.length - taken.length;
  const slots =
    taken.length < cap && unused > 0 ? [...taken, ""] : taken;

  function onSlotChange(index: number, nextId: string) {
    const next = [...taken];
    if (!nextId) {
      next.splice(index, 1);
    } else if (index >= next.length) {
      next.push(nextId);
    } else {
      next[index] = nextId;
    }
    onChange(next.slice(0, cap));
  }

  if (cap <= 1) {
    return (
      <label className="mt-3 flex flex-col gap-1.5 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        {label}
        <SlotSelect
          options={options}
          placeholder={placeholder}
          selectClassName={selectClassName}
          value={taken[0] ?? ""}
          onChange={(nextId) => onChange(nextId ? [nextId] : [])}
        />
      </label>
    );
  }

  return (
    <fieldset className="mt-3 flex flex-col gap-1.5">
      <legend className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        {label}
      </legend>
      {slots.map((slotValue, index) => (
        <SlotSelect
          key={`${index}-${slotValue || "add"}`}
          ariaLabel={
            slotValue
              ? `${itemNoun} ${index + 1}`
              : `Add ${itemNoun.toLowerCase()}`
          }
          options={optionsForSlot(options, taken, slotValue)}
          placeholder={placeholder}
          selectClassName={selectClassName}
          value={slotValue}
          onChange={(nextId) => onSlotChange(index, nextId)}
        />
      ))}
      {hint ? (
        <span className="text-xs font-normal normal-case tracking-normal text-sheet-muted">
          {hint}
        </span>
      ) : null}
    </fieldset>
  );
}

function optionsForSlot(
  options: SelectSlotOption[],
  taken: string[],
  slotValue: string,
): SelectSlotOption[] {
  const usedElsewhere = new Set(taken.filter((id) => id && id !== slotValue));
  return options.filter(
    (option) => option.value === slotValue || !usedElsewhere.has(option.value),
  );
}

function SlotSelect({
  ariaLabel,
  options,
  placeholder,
  selectClassName,
  value,
  onChange,
}: {
  ariaLabel?: string;
  options: SelectSlotOption[];
  placeholder: string;
  selectClassName: string;
  value: string;
  onChange: (nextId: string) => void;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={selectClassName}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
