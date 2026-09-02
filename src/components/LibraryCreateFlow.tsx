"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { armyOfRenownName, getFaction } from "@/engine/queries";
import { getSpearhead } from "@/engine/spearhead";
import type { FactionCatalogue } from "@/engine/types";
import type { TowFactionCatalogue } from "@/engine/tow/types";
import {
  getActiveMenuServerSnapshot,
  getActiveMenuSnapshot,
  subscribeActiveMenu,
} from "@/lib/activeMenu";
import { parseNewListArmyValue } from "@/lib/newListArmyOptions";
import type { PathToGloryPackId } from "@/engine/pathToGlory";
import { factionPickerCounts } from "@/lib/factionSeo";
import { preloadBackdropArt } from "@/lib/factionArt";
import {
  LIST_CREATE_BACKDROP_SCOURGE,
  libraryCreatingSplashVisible,
  listCreateBackdropFactionId,
} from "@/lib/listFlowNav";
import {
  blankArmy,
  blankPathToGlory,
  blankSpearhead,
  blankTowArmy,
  saveArmy,
} from "@/lib/storage";
import {
  rememberListCreate,
  peekListCreateSplash,
  subscribeListOpenFaction,
} from "@/lib/listTransition";
import { newListDraftFromSearch } from "@/lib/newListLink";
import { LIST_PANE_ART_CLASS } from "@/lib/builderUi";
import { FactionArtLayers } from "./FactionArtBackground";
import { LibraryCreateSheet } from "./LibraryCreateSheet";
import { TowCreateSheet } from "./TowCreateSheet";
import { ListLoadingSplash } from "./ListLoadingSplash";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LibraryCreateFlow({ open, onOpenChange }: Props) {
  const router = useRouter();
  const activeMenu = useSyncExternalStore(
    subscribeActiveMenu,
    getActiveMenuSnapshot,
    getActiveMenuServerSnapshot,
  );
  const [draftFaction, setDraftFaction] = useState<FactionCatalogue | null>(
    null,
  );
  const [draftParent, setDraftParent] = useState<FactionCatalogue | null>(
    null,
  );
  const [draftTowFaction, setDraftTowFaction] =
    useState<TowFactionCatalogue | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftPoints, setDraftPoints] = useState(2000);
  const [draftMode, setDraftMode] = useState<
    "points" | "spearhead" | "pathToGlory"
  >("points");
  const [draftSpearheadId, setDraftSpearheadId] = useState<string | null>(null);
  const [draftPackIds, setDraftPackIds] = useState<PathToGloryPackId[]>([
    "ascension",
  ]);
  const [creating, setCreating] = useState(false);
  const createSplash = useSyncExternalStore(
    subscribeListOpenFaction,
    peekListCreateSplash,
    () => false,
  );
  const createCounts = draftFaction
    ? factionPickerCounts(draftFaction)
    : null;

  async function onCreate() {
    if (creating) {
      return;
    }
    if (!draftFaction && activeMenu !== "tow") {
      return;
    }
    if (activeMenu !== "tow") {
      if (!draftFaction) {
        return;
      }
      if (draftMode === "spearhead" && !draftSpearheadId) {
        return;
      }
      if (draftMode === "pathToGlory" && draftPackIds.length === 0) {
        return;
      }
      const artFactionId = listCreateBackdropFactionId({
        parentId: draftParent?.id,
        parentFactionIds: draftFaction.parentFactionIds,
        factionId: draftFaction.id,
      });
      await preloadBackdropArt(artFactionId, LIST_CREATE_BACKDROP_SCOURGE);
      rememberListCreate(
        artFactionId,
        (draftParent ?? draftFaction).name,
        LIST_CREATE_BACKDROP_SCOURGE,
      );
      setCreating(true);
      try {
        const list =
          draftMode === "spearhead" && draftSpearheadId
            ? blankSpearhead(draftSpearheadId, draftName)
            : draftMode === "pathToGlory"
              ? blankPathToGlory(
                  draftFaction.id,
                  draftPackIds,
                  draftName,
                  draftPoints,
                )
            : blankArmy(draftFaction.id, draftName, draftPoints);
        await saveArmy(list);
        onOpenChange(false);
        router.push(`/lists/${list.id}`);
      } catch {
        setCreating(false);
      }
      return;
    }
    if (!draftTowFaction) {
      return;
    }
    setCreating(true);
    rememberListCreate(draftTowFaction.id, draftTowFaction.name);
    try {
      const list = blankTowArmy(
        draftTowFaction.id,
        draftName,
        draftPoints,
      );
      await saveArmy(list);
      onOpenChange(false);
      router.push(`/lists/${list.id}`);
    } catch {
      setCreating(false);
    }
  }

  function closePicker() {
    if (creating) {
      return;
    }
    onOpenChange(false);
    setDraftFaction(null);
    setDraftParent(null);
    setDraftTowFaction(null);
    setDraftName("");
    setDraftPoints(2000);
    setDraftMode("points");
    setDraftSpearheadId(null);
    setDraftPackIds(["ascension"]);
  }

  function onDraftArmyChange(value: string) {
    if (!draftParent) {
      return;
    }
    const parsed = parseNewListArmyValue(value);
    const previousLabel =
      draftMode === "spearhead" && draftSpearheadId
        ? (getSpearhead(draftSpearheadId)?.name ?? draftParent.name)
        : armyOfRenownName(draftFaction ?? draftParent);
    if (parsed.kind === "spearhead") {
      const box = getSpearhead(parsed.spearheadId);
      setDraftMode("spearhead");
      setDraftSpearheadId(parsed.spearheadId);
      setDraftPackIds(["ascension"]);
      setDraftFaction(draftParent);
      setDraftName((current) =>
        current === `My ${previousLabel}`
          ? `My ${box?.name ?? draftParent.name}`
          : current,
      );
      return;
    }
    if (parsed.kind === "pathToGlory") {
      const next = getFaction(parsed.factionId) ?? draftFaction ?? draftParent;
      setDraftMode("pathToGlory");
      setDraftSpearheadId(null);
      setDraftPackIds((current) =>
        current.length > 0 ? current : ["ascension"],
      );
      setDraftFaction(next);
      setDraftPoints((current) => (current === 2000 ? 1000 : current));
      return;
    }
    const next = getFaction(parsed.factionId) ?? draftParent;
    setDraftMode("points");
    setDraftSpearheadId(null);
    setDraftPackIds(["ascension"]);
    setDraftFaction(next);
    setDraftName((current) =>
      current === `My ${previousLabel}`
        ? `My ${armyOfRenownName(next)}`
        : current,
    );
  }

  function backToFactionPicker() {
    setDraftFaction(null);
    setDraftParent(null);
    setDraftTowFaction(null);
    setDraftName("");
    setDraftMode("points");
    setDraftSpearheadId(null);
    setDraftPackIds(["ascension"]);
  }

  useEffect(() => {
    if (!createSplash && creating) {
      setCreating(false);
    }
  }, [createSplash, creating]);

  useLayoutEffect(() => {
    const draft = newListDraftFromSearch(
      new URLSearchParams(window.location.search),
    );
    if (!draft) {
      return;
    }
    onOpenChange(true);
    setDraftFaction(draft.faction);
    setDraftParent(draft.parent);
    setDraftName(draft.name);
    setDraftPoints(draft.points);
    router.replace("/dashboard", { scroll: false });
  }, [onOpenChange, router]);

  return (
    <>
      {open && !creating && activeMenu === "tow" ? (
        <TowCreateSheet
          open
          creating={creating}
          draftFaction={draftTowFaction}
          draftName={draftName}
          draftPoints={draftPoints}
          onClose={closePicker}
          onCreate={onCreate}
          onDraftNameChange={setDraftName}
          onDraftPointsChange={setDraftPoints}
          onSelectFaction={(faction) => {
            setDraftTowFaction(faction);
            setDraftName(`My ${faction.name}`);
            setDraftPoints(faction.pointsCapDefault);
          }}
          onBackToFactions={backToFactionPicker}
        />
      ) : null}
      {open && !creating && activeMenu === "aos" ? (
        <LibraryCreateSheet
          open
          creating={creating}
          draftFaction={draftFaction}
          draftParent={draftParent}
          draftName={draftName}
          draftPoints={draftPoints}
          draftMode={draftMode}
          draftSpearheadId={draftSpearheadId}
          draftPackIds={draftPackIds}
          createCounts={createCounts}
          onClose={closePicker}
          onCreate={onCreate}
          onDraftNameChange={setDraftName}
          onDraftPointsChange={setDraftPoints}
          onSelectFaction={(faction) => {
            setDraftParent(faction);
            setDraftFaction(faction);
            setDraftName(`My ${faction.name}`);
            setDraftPoints(faction.pointsCapDefault);
            setDraftMode("points");
            setDraftSpearheadId(null);
            setDraftPackIds(["ascension"]);
          }}
          onArmyChange={onDraftArmyChange}
          onPackIdsChange={setDraftPackIds}
          onBackToFactions={backToFactionPicker}
        />
      ) : null}
      {libraryCreatingSplashVisible(creating, createSplash) &&
      (draftFaction || draftTowFaction) ? (
        <div className="fixed inset-0 z-[60] text-parchment">
          <div className={LIST_PANE_ART_CLASS} aria-hidden="true">
            {draftFaction ? (
              <FactionArtLayers
                factionId={listCreateBackdropFactionId({
                  parentId: draftParent?.id,
                  parentFactionIds: draftFaction.parentFactionIds,
                  factionId: draftFaction.id,
                })}
                scourgeRealm={LIST_CREATE_BACKDROP_SCOURGE}
                scrim={false}
              />
            ) : null}
          </div>
          <ListLoadingSplash
            factionName={
              draftTowFaction?.name ??
              (draftParent ?? draftFaction)?.name ??
              "New list"
            }
            label="Creating your list"
          />
        </div>
      ) : null}
    </>
  );
}
