"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

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
  placeholder?: string;
};

/** Ant Design–style multi-select: tags in the field, searchable dropdown. */
export function SelectSlots({
  label,
  options,
  value,
  onChange,
  emptyText,
  placeholder = "Choose…",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const taken = value.filter(Boolean);
  const selected = new Set(taken);

  const chosen = useMemo(
    () =>
      taken
        .map((id) => options.find((option) => option.value === id))
        .filter((option): option is SelectSlotOption => Boolean(option)),
    [options, taken],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(needle),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (options.length === 0) {
    return (
      <p className="mt-3 text-sm text-sheet-muted">
        {emptyText ?? "No options."}
      </p>
    );
  }

  function toggle(id: string) {
    if (selected.has(id)) {
      onChange(taken.filter((item) => item !== id));
      return;
    }
    onChange([...taken, id]);
  }

  function remove(id: string) {
    onChange(taken.filter((item) => item !== id));
  }

  return (
    <div className="mt-3">
      <span
        id={`${listId}-label`}
        className="text-sm font-semibold tracking-wide uppercase text-sheet-muted"
      >
        {label}
      </span>
      <div ref={rootRef} className="relative mt-1.5">
        <div
          className="flex min-h-10 w-full cursor-text flex-wrap items-center gap-1 rounded-lg bg-parchment py-1 pl-2 pr-8 font-sans text-sm normal-case tracking-normal text-parchment-ink"
          onClick={() => {
            setOpen(true);
            inputRef.current?.focus();
          }}
        >
          {chosen.map((option) => (
            <span
              key={option.value}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-parchment-ink/10 py-0.5 pl-2 pr-1 text-sm leading-tight"
            >
              <span className="min-w-0 truncate">{option.label}</span>
              <button
                type="button"
                aria-label={`Remove ${option.label}`}
                className="flex size-5 shrink-0 items-center justify-center rounded text-sheet-muted hover:bg-parchment-ink/10 hover:text-parchment-ink"
                onClick={(event) => {
                  event.stopPropagation();
                  remove(option.value);
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            role="combobox"
            aria-labelledby={`${listId}-label`}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            value={query}
            placeholder={chosen.length === 0 ? placeholder : ""}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="min-w-[5rem] flex-1 bg-transparent py-0.5 outline-none placeholder:text-parchment-ink/35"
          />
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-parchment-ink"
        >
          <svg viewBox="0 0 12 8" className="h-[0.45rem] w-[0.7rem] fill-none stroke-current stroke-[1.75]">
            <path
              d="M1.5 1.5 6 6 10.5 1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby={`${listId}-label`}
            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg bg-parchment py-1 shadow-lg ring-1 ring-parchment-ink/15"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-sheet-muted">No matches.</li>
            ) : (
              filtered.map((option) => {
                const checked = selected.has(option.value);
                return (
                  <li key={option.value} className="px-1">
                    <button
                      type="button"
                      role="option"
                      aria-selected={checked}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
                        checked
                          ? "bg-aether/15 text-parchment-ink"
                          : "text-parchment-ink hover:bg-parchment-ink/5"
                      }`}
                      onClick={() => toggle(option.value)}
                    >
                      <span className="min-w-0 flex-1">{option.label}</span>
                      {checked ? (
                        <span aria-hidden="true" className="text-aether">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
