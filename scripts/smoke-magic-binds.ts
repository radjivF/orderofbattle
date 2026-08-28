import {
  getFaction,
  preferredUnitForRealm,
} from "../src/engine/queries";
import {
  powerBindRule,
  powerBindKey,
  powerChoiceKey,
  powerBindCandidates,
  combatModifierNotes,
} from "../src/engine/magic";
import { buildPhaseBoards } from "../src/engine/phases";

const fails: string[] = [];
function assert(cond: unknown, msg: string) {
  if (!cond) fails.push(msg);
}

function unitByName(faction: NonNullable<ReturnType<typeof getFaction>>, name: string) {
  const u =
    preferredUnitForRealm(faction, name, null) ??
    faction.units.find((x) => x.name === name);
  if (!u) throw new Error(`missing ${name} in ${faction.id}`);
  return u;
}

function baseList(
  faction: NonNullable<ReturnType<typeof getFaction>>,
  extras: Record<string, unknown> = {},
) {
  return {
    id: "t",
    name: "t",
    factionId: faction.id,
    pointsCap: 2000,
    formationId: faction.formations[0]?.id ?? null,
    spellLoreId: faction.spellLores[0]?.id ?? null,
    prayerLoreId: faction.prayerLores[0]?.id ?? null,
    manifestationLoreId: null,
    artefact: null,
    heroicTrait: null,
    monstrousTrait: null,
    visionOfFate: null,
    specialEnhancements: [],
    battleTacticCardIds: [],
    battleTacticStage: {},
    scourgeRealm: null,
    generalRegimentId: "r1",
    regiments: [] as unknown[],
    auxiliaries: [],
    regimentOfRenown: null,
    powerBinds: {} as Record<string, string>,
    createdAt: 0,
    updatedAt: 0,
    ...extras,
  };
}

function kindOf(power: { kind: string }) {
  return power.kind.toLowerCase() === "prayer" ? "prayer" : "spell";
}

// --- Daughters of Khaine ---
{
  const f = getFaction("daughters-of-khaine")!;
  const medusa = unitByName(f, "Bloodwrack Medusa");
  const sisters = unitByName(f, "Blood Sisters");
  const stalkers = unitByName(f, "Blood Stalkers");
  const hag = unitByName(f, "Hag Queen");

  const mindrazor = f.spellLores[0].powers.find((p) => p.name === "Mindrazor")!;
  const catechism = f.prayerLores[0].powers.find(
    (p) => p.name === "Catechism of Murder",
  )!;
  const dance = f.prayerLores[0].powers.find((p) => p.name === "Dance of Doom")!;
  const blackHorror = f.spellLores[0].powers.find(
    (p) => p.name === "Black Horror of Ulgu",
  )!;

  assert(powerBindRule(mindrazor).role === "target", "DoK Mindrazor target");
  assert(powerBindRule(catechism).role === "target", "DoK Catechism target");
  assert(powerBindRule(dance).role === "target", "DoK Dance target");
  assert(powerBindRule(blackHorror).role === "enemy", "DoK Black Horror enemy");

  const list = baseList(f, {
    regiments: [
      {
        id: "r1",
        hero: { id: "h1", unitId: medusa.id, reinforced: false },
        units: [
          { id: "u1", unitId: sisters.id, reinforced: false },
          { id: "u2", unitId: stalkers.id, reinforced: false },
        ],
      },
      {
        id: "r2",
        hero: { id: "h2", unitId: hag.id, reinforced: false },
        units: [],
      },
    ],
  });

  const mindCands = powerBindCandidates(list as never, f, mindrazor).map(
    (c) => c.unit.name,
  );
  assert(mindCands.includes("Blood Sisters"), "Mindrazor can pick Blood Sisters");
  assert(
    mindCands.includes("Blood Stalkers"),
    "Mindrazor can pick Blood Stalkers",
  );
  assert(
    mindCands.includes("Bloodwrack Medusa"),
    "Mindrazor can pick Medusa",
  );
  assert(mindCands.includes("Hag Queen"), "Mindrazor can pick Hag Queen");

  list.powerBinds = {
    [powerBindKey("spell", "Mindrazor")]: "u1",
    [powerBindKey("prayer", "Catechism of Murder")]: "u2",
    [powerBindKey("prayer", "Dance of Doom")]: "h1",
    [powerBindKey("spell", "Black Horror of Ulgu")]: "Enemy Witch Aelves",
  };

  const notes = combatModifierNotes(list as never, f);
  const bySel = Object.fromEntries(
    notes
      .filter((n) => n.selectionId)
      .map((n) => [n.selectionId!, `${n.powerName}:${n.summary}`]),
  );
  assert(bySel.u1?.startsWith("Mindrazor"), `Mindrazor on sisters got ${bySel.u1}`);
  assert(
    bySel.u2?.includes("Catechism"),
    `Catechism on stalkers got ${bySel.u2}`,
  );
  assert(bySel.h1?.includes("Dance"), `Dance on medusa got ${bySel.h1}`);

  const enemy = notes.find((n) => n.selectionId === null);
  assert(enemy?.enemyLabel === "Enemy Witch Aelves", "enemy bind label");
  assert(enemy?.powerName === "Black Horror of Ulgu", "enemy bind power");

  const combat = buildPhaseBoards(list as never, f).find(
    (b) => b.phase.id === "combat",
  )!;
  const sistersWeapons = combat.weapons.filter((w) => w.selectionId === "u1");
  assert(sistersWeapons.length > 0, "Blood Sisters appear in combat weapons");
  assert(
    notes.some((n) => n.selectionId === "u1" && n.powerName === "Mindrazor"),
    "UI would show Mindrazor on sisters combat card",
  );

  // Rebind away from sisters
  list.powerBinds[powerBindKey("spell", "Mindrazor")] = "missing-id";
  const notes2 = combatModifierNotes(list as never, f);
  assert(
    !notes2.some((n) => n.selectionId === "u1" && n.powerName === "Mindrazor"),
    "Mindrazor not stuck on sisters after rebind away",
  );

  console.log("DoK OK", {
    candidates: mindCands,
    notes: notes.map((n) => ({
      on: n.selectionId ?? n.enemyLabel,
      power: n.powerName,
      summary: n.summary,
    })),
  });
}

// --- Maggotkin ---
{
  const f = getFaction("maggotkin-of-nurgle")!;
  const festus = unitByName(f, "Festus the Leechlord");
  const rots = unitByName(f, "Rotswords");
  const fleshy = f.spellLores[0].powers.find((p) =>
    p.name.includes("Fleshy"),
  )!;
  const list = baseList(f, {
    spellLoreId: f.spellLores[0].id,
    regiments: [
      {
        id: "r1",
        hero: {
          id: "h1",
          unitId: festus.id,
          reinforced: false,
          play: { damage: 10 },
        },
        units: [{ id: "u1", unitId: rots.id, reinforced: true }],
      },
    ],
    powerBinds: {
      [powerBindKey("spell", fleshy.name)]: "u1",
      [powerChoiceKey(powerBindKey("spell", fleshy.name))]: "1",
    },
  });
  const notes = combatModifierNotes(list as never, f);
  assert(
    notes.some((n) => n.selectionId === "u1" && n.summary.includes("wound")),
    "Maggotkin −1 wound on Rotswords",
  );
  const cands = powerBindCandidates(list as never, f, fleshy).map(
    (c) => c.unit.name,
  );
  assert(cands.includes("Rotswords"), "Fleshy can bind Rotswords");
  assert(cands.includes("Festus the Leechlord"), "Fleshy can bind Festus");
  console.log("Maggotkin OK", { note: notes[0], cands });
}

// --- Skaven ---
{
  const f = getFaction("skaven")!;
  const bindables = [...f.spellLores, ...f.prayerLores]
    .flatMap((l) => l.powers.map((p) => ({ power: p, rule: powerBindRule(p) })))
    .filter((x) => x.rule.role !== "none");
  console.log(
    "Skaven bindables",
    bindables.map((b) => `${b.power.name} (${b.rule.role})`),
  );

  const grey =
    f.units.find((u) => /Grey Seer$/i.test(u.name)) ??
    f.units.find((u) => u.hero && /Grey Seer/i.test(u.name));
  const clanrats = unitByName(f, "Clanrats");
  const storm = f.units.find((u) => /Stormvermin/i.test(u.name));
  const pick =
    bindables.find((b) => b.rule.role === "target") ?? bindables[0];
  if (!pick || !grey) {
    console.log("Skaven skip (no bindable/grey)");
  } else {
    const list = baseList(f, {
      regiments: [
        {
          id: "r1",
          hero: { id: "h1", unitId: grey.id, reinforced: false },
          units: [
            { id: "u1", unitId: clanrats.id, reinforced: false },
            ...(storm
              ? [{ id: "u2", unitId: storm.id, reinforced: false }]
              : []),
          ],
        },
      ],
    });
    if (pick.rule.role === "target") {
      const cands = powerBindCandidates(list as never, f, pick.power);
      assert(cands.length >= 1, "Skaven has bind candidates");
      assert(
        cands.some((c) => c.unit.name === "Clanrats"),
        "Skaven can select Clanrats",
      );
      list.powerBinds = {
        [powerBindKey(kindOf(pick.power), pick.power.name)]: "u1",
      };
      const notes = combatModifierNotes(list as never, f);
      assert(
        notes.some(
          (n) => n.selectionId === "u1" && n.powerName === pick.power.name,
        ),
        `Skaven note on clanrats for ${pick.power.name}`,
      );
      console.log("Skaven OK", {
        power: pick.power.name,
        summary: notes[0]?.summary,
        cands: cands.map((c) => c.unit.name),
      });
    } else {
      list.powerBinds = {
        [powerBindKey(kindOf(pick.power), pick.power.name)]: "Enemy Clanrats",
      };
      const notes = combatModifierNotes(list as never, f);
      assert(
        notes.some((n) => n.enemyLabel === "Enemy Clanrats"),
        "Skaven enemy note",
      );
      console.log("Skaven enemy OK", pick.power.name, notes[0]);
    }
  }
}

// --- Stormcast ---
{
  const f = getFaction("stormcast-eternals")!;
  const bindables = [...f.spellLores, ...f.prayerLores].flatMap((l) =>
    l.powers.filter((p) => powerBindRule(p).role === "target"),
  );
  console.log(
    "SCE target-bindable",
    bindables.map((p) => p.name),
  );
  if (bindables[0]) {
    const lord =
      f.units.find((u) => /Lord-Relictor/i.test(u.name)) ??
      f.units.find((u) => u.hero)!;
    const liberators = f.units.find((u) => /Liberators/i.test(u.name));
    const list = baseList(f, {
      regiments: [
        {
          id: "r1",
          hero: { id: "h1", unitId: lord.id, reinforced: false },
          units: liberators
            ? [{ id: "u1", unitId: liberators.id, reinforced: false }]
            : [],
        },
      ],
    });
    const power = bindables[0];
    const cands = powerBindCandidates(list as never, f, power);
    assert(cands.length >= 1, "SCE candidates");
    const targetId =
      cands.find((c) => !c.unit.hero)?.selectionId ?? cands[0].selectionId;
    list.powerBinds = {
      [powerBindKey(kindOf(power), power.name)]: targetId,
    };
    const notes = combatModifierNotes(list as never, f);
    assert(
      notes.some(
        (n) => n.selectionId === targetId && n.powerName === power.name,
      ),
      "SCE combat note",
    );
    console.log("SCE OK", {
      power: power.name,
      summary: notes[0]?.summary,
      cands: cands.map((c) => c.unit.name),
    });
  }
}

if (fails.length) {
  console.error("FAILURES:\n" + fails.map((f) => " - " + f).join("\n"));
  process.exit(1);
}
console.log("\nMULTI_ARMY_MAGIC_OK");
