"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CORE_RULE_GROUPS,
  SCOURGE_AQSHY_RULES,
  coreRuleMentionsQuery,
  type CoreRuleEntry,
  type CoreRuleGroup,
} from "@/engine/coreRules";
import {
  IOS_NAV_ICON_BUTTON_CLASS,
  LIBRARY_TITLE_CLASS,
  LIBRARY_TITLE_ROW_CLASS,
  SITE_COLUMN_CLASS,
} from "@/lib/builderUi";
import { ExpandableRuleCard } from "./ExpandableRuleCard";
import { IosNavCloseButton } from "./ios/IosNavIconButton";
import { IosSearchIcon } from "./ios/SheetIconButton";

type Pack = "core" | "scourge";

const SCOURGE_GROUP: CoreRuleGroup = {
  id: "scourge-aqshy",
  name: "",
  rules: SCOURGE_AQSHY_RULES,
};

export function CoreRulesScreen({ pack = "core" }: { pack?: Pack }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const needle = query.trim();
  const scourge = pack === "scourge";
  const title = scourge ? "Scourge of Aqshy" : "Core Rules";
  const searchId = scourge ? "scourge-rules-search" : "core-rules-search";

  const visibleGroups = useMemo(() => {
    const groups = scourge ? [SCOURGE_GROUP] : CORE_RULE_GROUPS;
    if (!needle) {
      return groups;
    }
    return groups
      .map((group) => ({
        ...group,
        rules: group.rules.filter((rule) => coreRuleMentionsQuery(rule, needle)),
      }))
      .filter((group) => group.rules.length > 0);
  }, [scourge, needle]);

  const matchCount = visibleGroups.reduce(
    (total, group) => total + group.rules.length,
    0,
  );

  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus();
    }
  }, [searchOpen]);

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  function clearQuery() {
    setQuery("");
    searchRef.current?.focus();
  }

  return (
    <div className="relative z-10 min-h-full text-parchment">
      <div className={`${SITE_COLUMN_CLASS} pt-2 pb-3`}>
        <div className={LIBRARY_TITLE_ROW_CLASS}>
          {searchOpen ? (
            <div className="relative flex min-w-0 flex-1 items-center">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 text-parchment-ink/45"
              >
                <IosSearchIcon className="h-4 w-4" />
              </span>
              <input
                ref={searchRef}
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search rules"
                aria-label="Search rules"
                autoComplete="off"
                enterKeyHint="search"
                className="min-h-11 w-full rounded-xl bg-parchment pr-10 pl-9 text-parchment-ink shadow-[0_8px_24px_-12px_rgba(0,0,0,0.85)] outline-none ring-1 ring-parchment-ink/15 placeholder:text-sheet-muted [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={clearQuery}
                  className="pressable absolute right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-parchment-ink/45"
                >
                  <ClearIcon />
                </button>
              ) : null}
            </div>
          ) : (
            <h1 className={LIBRARY_TITLE_CLASS}>{title}</h1>
          )}
          {searchOpen ? (
            <IosNavCloseButton label="Close search" onClick={closeSearch} />
          ) : (
            <button
              type="button"
              aria-label="Search rules"
              onClick={() => setSearchOpen(true)}
              className={IOS_NAV_ICON_BUTTON_CLASS}
            >
              <IosSearchIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <main className={`${SITE_COLUMN_CLASS} flex flex-col gap-4 pb-20`}>
        {needle ? (
          <p aria-live="polite" className="text-sm text-parchment/70">
            {matchCount === 0
              ? `No rules match “${needle}”`
              : `${matchCount} ${matchCount === 1 ? "rule matches" : "rules match"}`}
          </p>
        ) : null}
        {matchCount > 0 ? (
          <section className="parchment-card divide-y divide-parchment-ink/10 rounded-2xl text-parchment-ink">
            {visibleGroups.map((group) => (
              <RuleGroup key={group.id} group={group} query={needle} />
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}

function RuleGroup({
  group,
  query,
}: {
  group: CoreRuleGroup;
  query: string;
}) {
  return (
    <section className="p-3 sm:p-4">
      {group.name ? (
        <h2 className="px-1 pb-2 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
          {group.name}
        </h2>
      ) : null}
      <ul className="flex flex-col divide-y divide-parchment-ink/10">
        {group.rules.map((rule) => (
          <li key={rule.id}>
            <RuleRow rule={rule} query={query} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RuleRow({ rule, query }: { rule: CoreRuleEntry; query: string }) {
  const matched = coreRuleMentionsQuery(rule, query);
  return (
    <ExpandableRuleCard
      flush
      title={rule.name}
      effect={rule.effect}
      open={query ? matched : undefined}
      highlight={matched ? query : undefined}
    />
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
      <circle cx="10" cy="10" r="7.25" fill="currentColor" />
      <path
        d="m7.6 7.6 4.8 4.8M12.4 7.6l-4.8 4.8"
        fill="none"
        stroke="var(--parchment)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
