"use client";

type Tab = {
  value: string;
  label: string;
  ariaLabel?: string;
};

type Props = {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  scrollable?: boolean;
  variant?: "default" | "parchment";
  uppercase?: boolean;
  className?: string;
};

export function IosUnderlineTabs({
  tabs,
  value,
  onChange,
  ariaLabel,
  scrollable = false,
  variant = "default",
  uppercase = false,
  className = "",
}: Props) {
  const variantClass =
    variant === "parchment" ? "ios-tab-underline--parchment" : "";
  const scrollClass = scrollable ? "ios-tab-underline--scroll" : "";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`ios-tab-underline ${variantClass} ${scrollClass} ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const selected = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={tab.ariaLabel}
            onClick={() => onChange(tab.value)}
            className={`ios-tab-underline-option ${
              selected ? "ios-tab-underline-option--selected" : ""
            } ${uppercase ? "tracking-wide uppercase" : ""}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
