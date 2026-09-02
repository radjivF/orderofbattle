# Path to Glory — complete ship plan

Review this before more implementation. High demand: an incomplete release will bounce users. Same app (builder + Play), not a VTT.

**Branch:** `feat/path-to-glory` · **PR:** https://github.com/radjivF/orderofbattle/pull/24

## Product bar

A player can create a campaign roster, **forge an Anvil of Apotheosis hero** (not just pick a destiny rank), mark a warlord, pick legal Paths and rank abilities, track leftover wounds / Drained / scars, learn spells / prayers / manifestations correctly, pick a quest and a battleplan, run Play with those extras, then do aftermath (glory, renown, quest).

Battleplan **maps** stay in the book. Everything you write on the roster is in the app.

## Already on this branch (WIP, not the complete bar)

- List kind `pathToGlory`; packs Ascension / Ravaged Coast / Blighted Wilds (independent multi-select)
- Unit extras: Path, renown, rank ability checkboxes
- Learned spells / manifestations as one-by-one checkboxes
- Anvil heroes in the PTG picker only (`pathToGloryOnly`) — **destiny rank dropdown only**
- Path catalogue extract (`path-to-glory-paths.json`); rank unlocks 5 / 15 / 30 / 45

Known holes vs this plan: Anvil is rank-only (no chamber, mount, origin, flaw, upgrades, destiny budget); tactics/Scourge still in Options; wounds/scars gated on Coast and modelled wrong; Paths unfiltered; no warlord; prayers still a lore menu; no quest/glory/aftermath.

## 1. Strip matched-play leftovers

On a Path to Glory list:

- No Battle tactic cards
- No Scourge season picker
- Options label: **Battlepacks · Lores · Quest** (not Tactics)
- Play has no tactic tracker

## 2. Roster rules (always on)

**Warlord** (exactly one)

- Non-unique, one model, ≤ 350 pts (Sons of Behemat ignored)
- Starts at 5 renown / Aspiring with a Path + first ability
- If they are in the army for a battle, they must be general
- Marked on the hero card (no nickname field in extras)

**Paths** (filtered, not a dump)

| Who | Paths |
| --- | --- |
| Hero | Warrior, Leader |
| Wizard | + Mage |
| Priest | + Devout |
| Non-hero | Attacker, Defender |
| Coast / Wilds on | Extra paths from that pack, same eligibility |

Rank abilities stay as now: 1 pick per rank at 5 / 15 / 30 / 45.

**Starting size** 1000 pts (already the default). Warn if over.

**Enhancements:** every earned artefact / trait stays on its unit. No matched-play “one artefact in the army” cap. Quest can add extra ones.

## 3. Anvil of Apotheosis (first-class, not optional)

Custom hero builder. Today the picker has the hero and extras have **Knight / Templar / Lord**. That is not Anvil. The rest of “The Anvil of Apotheosis” group from each faction library ships in this plan.

**Where it appears**

- Regiment picker on Path to Glory lists only (already). Hidden in matched play.
- On the Anvil hero card: the full forge UI below Path / renown.
- Play: only the **picked** origin, flaw, mount, and upgrade abilities — not the dumped list of every possible Anvil ability that is on the warscroll today.
- Factions with no Anvil in BSData (e.g. Fyreslayers, Seraphon, Sons of Behemat) stay without one. We do not invent entries.

**On every Anvil hero**

| Pick | Required? | What it does |
| --- | --- | --- |
| Destiny rank | Yes | Sets **points** and **destiny budget** (typical Knight 150 / 10, Templar 250 / 30, Lord 350 / 50; some factions differ, e.g. Sylvaneth Forest Elder 18 / 38) |
| Chamber / form | Yes, if the faction has the group | Keyword + regiment options + any chamber ability. Stormcast: Warrior, Vanguard (−4), Extremis (−4, mount required), Ruination (−4) |
| Origins | 0–1 | Spends destiny; ability on Play (e.g. Freshly Forged, Redeemed) |
| Flaws | 0–1 | **Gives back** destiny; ability on Play (e.g. Brash and Impulsive, Fractured Soul) |
| Battle Mount | 0–1 (required for some chambers) | Spends destiny; changes Move / Health / keywords; adds companion weapons |
| Battle Mount upgrades | Only if a mount is picked | Extra destiny spend (Swift, Stormblast, …) |
| Upgrades | Named picks, each 0–1 | Destiny spend + warscroll change or ability (Commanding Presence, Fleet of Foot, …) |
| Extra weapons | Where the catalogue has them | Default melee stays; extra weapon / companion profiles from picks. **Blighted Wilds** adds pack Anvil weapons / Ghyranite mounts when that pack is on |

**Destiny budget**

- Show spent / remaining on the card.
- Overspend = red error. Rank change that invalidates picks is also an error until the player drops something.
- Army points come from the **rank**, not from destiny.

**Warscroll on the card and in Play**

Picked mounts and upgrades change the stats the player sees (Move, Health, Control, Infantry → Cavalry / Monster / Fly). Unpicked companion weapons and unpicked abilities stay off the board.

**Warlord**

Anvil heroes are custom, not Unique named characters. They **can** be the warlord (≤ 350 pts still applies). The extract’s `unique: true` is a “one of this template” roster cap, not the UNIQUE keyword.

**Out of Anvil (still complete enough)**

- A full BSData modifier engine for every hidden condition
- Auto-rolling destiny or forging tables — the player picks named options

## 4. Injuries

Always visible in Path to Glory:

- **Battle Wounds** — leftover wounds as a **number** (campaign leftover, not Play damage)
- **Drained** — heroes only, on/off

When **Ravaged Coast** or **Blighted Wilds** is on:

- **Scar** — one from that pack’s Critical / Serious / Severe table, with rules on Play

Play **Damage** stays the in-game tracker. After Play: keep leftover wounds / Drained / Scar; clear battle damage for the next game.

## 5. Custom lores

- First Wizard: pick **1 spell + 1 manifestation** (not a whole lore)
- First Priest: pick **1 prayer + 1 manifestation**
- Same one-by-one lists as now, but **cap 6 per lore**. Over 6 → must drop one
- Prayers stop being a lore dropdown
- Play Magic only shows learned picks

## 6. Quest + battleplan (replaces tactics)

**Quest** (list-level)

- One embarked quest + quest points
- Ascension six: Search for the Artefact, Master Magical Lore, Learn Ancient Scriptures, Seek Glory in Battle, Harness Manifestation, Rise of a Champion
- Coast / Wilds extra quests if those packs are on

**Battleplan** (for the next game)

- Pick or roll D6: Ruined Settlement, Relics of Myth, Decisive Battle, Ambush, Wreck and Ruin, The Ritual
- Show name + that plan’s **twist table names** (not the map)

## 7. Aftermath (after Play)

1. Result (major / minor / loss) + general slain? → **glory** from the size table
2. **Renown** on units that fought (tick who was there)
3. Quest complete / add points / abandon
4. Spend glory: add unit, reinforce, retire
5. Clear Play damage; leftover wounds / scars stay

## 8. Pack extras (only if that pack is ticked)

**Ravaged Coast:** Emberstone shards, emberstone weapon, Aqshian artefacts, Coast scars, Coast Paths, Coast RoRs if we already have them.

**Blighted Wilds:** Wilds Paths, Wilds scars, Thyrian wonders / concoctions, extra Anvil mounts / weapons (same as §3 when this pack is on).

## 9. Play

- Path abilities on the phase board
- Anvil: picked origin / flaw / mount / upgrade abilities and updated stats
- Scar / Drained on the unit
- Learned spells / prayers / manifestations only
- Battleplan name at the top
- No tactics

## Out of this ship (on purpose)

These would not make the mode feel fake:

- Full battleplan maps / terrain diagrams
- Auto-rolling every aftermath dice table (fields + glory math; you roll)
- Opponent’s army / shared campaign
- Copying battleplan body text from the book (names + twists from BSData only)
- Unofficial Freeform

## Build order

1. Hide tactics / Scourge; add battleplan + quest slots
2. **Anvil forge** (chamber, destiny budget, origin, flaw, mount, upgrades, Play picks)
3. Injuries: leftover wounds, Drained, extracted scars
4. Path eligibility + warlord rules (Anvil can be warlord)
5. Lore caps + one-by-one prayers
6. Extra enhancements on units
7. Aftermath (glory, renown, spend)
8. Pack extras (Coast, then Wilds — including Wilds Anvil extras)

## Open for review

- Warlord points cap: **350** (Wahapedia / current assumption). Confirm vs book if you want 300.
- Anvil is in this ship. Cut only aftermath or pack extras if you want a thinner first drop.
