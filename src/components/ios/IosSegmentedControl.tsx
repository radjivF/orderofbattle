"use client";

type Option = {
  value: string;
  label: string;
  ariaLabel?: string;
};

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
  scrollable?: boolean;
  className?: string;
};

export function IosSegmentedControl({
  options,
  value,
  onChange,
  size = "md",
  ariaLabel,
  scrollable = false,
  className = "",
}: Props) {
  const scrollClass = scrollable ? "ios-segmented--scroll" : "";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`ios-glass ios-segmented ios-segmented--${size} ${scrollClass} ${className}`.trim()}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={`ios-segmented-option ${
              selected ? "ios-segmented-option--selected" : ""
            }`}
          >
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
