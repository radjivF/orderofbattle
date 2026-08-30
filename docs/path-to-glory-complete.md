# Path to Glory — complete ship plan

Review this before more implementation. High demand: an incomplete release will bounce users. Same app (builder + Play), not a VTT.

**Branch:** `feat/path-to-glory` · **PR:** https://github.com/radjivF/orderofbattle/pull/24

## Product bar

A player can create a campaign roster, mark a warlord, pick legal Paths and rank abilities, track leftover wounds / Drained / scars, learn spells / prayers / manifestations correctly, pick a quest and a battleplan, run Play with those extras, then do aftermath (glory, renown, quest). Anvil heroes are usable, not rank-only.

Battleplan **maps** stay in the book. Everything you write on the roster is in the app.

## Already on this branch (WIP, not the complete bar)

- List kind `pathToGlory`; packs Ascension / Ravaged Coast / Blighted Wilds (independent multi-select)
- Unit extras: Path, renown, rank ability checkboxes, Anvil destiny rank
- Learned spells / manifestations as one-by-one checkboxes
- Anvil heroes in the PTG picker only (`pathToGloryOnly`)
- Path catalogue extract (`path-to-glory-paths.json`); rank unlocks 5 / 15 / 30 / 45

Known holes vs this plan: tactics/Scourge still in Options; wounds/scars gated on Coast and modelled wrong; Paths unfiltered; no warlord; prayers still a lore menu; no quest/glory/aftermath; Anvil rank only.

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

## 3. Injuries

Always visible in Path to Glory:

- **Battle Wounds** — leftover wounds as a **number** (campaign leftover, not Play damage)
- **Drained** — heroes only, on/off

When **Ravaged Coast** or **Blighted Wilds** is on:

- **Scar** — one from that pack’s Critical / Serious / Severe table, with rules on Play

Play **Damage** stays the in-game tracker. After Play: keep leftover wounds / Drained / Scar; clear battle damage for the next game.

## 4. Custom lores

- First Wizard: pick **1 spell + 1 manifestation** (not a whole lore)
- First Priest: pick **1 prayer + 1 manifestation**
- Same one-by-one lists as now, but **cap 6 per lore**. Over 6 → must drop one
- Prayers stop being a lore dropdown
- Play Magic only shows learned picks

## 5. Quest + battleplan (replaces tactics)

**Quest** (list-level)

- One embarked quest + quest points
- Ascension six: Search for the Artefact, Master Magical Lore, Learn Ancient Scriptures, Seek Glory in Battle, Harness Manifestation, Rise of a Champion
- Coast / Wilds extra quests if those packs are on

**Battleplan** (for the next game)

- Pick or roll D6: Ruined Settlement, Relics of Myth, Decisive Battle, Ambush, Wreck and Ruin, The Ritual
- Show name + that plan’s **twist table names** (not the map)

## 6. Aftermath (after Play)

1. Result (major / minor / loss) + general slain? → **glory** from the size table
2. **Renown** on units that fought (tick who was there)
3. Quest complete / add points / abandon
4. Spend glory: add unit, reinforce, retire
5. Clear Play damage; leftover wounds / scars stay

## 7. Anvil of Apotheosis

Not rank-only. On an Anvil hero:

- Destiny rank (Knight / Templar / Lord) — already there
- **Chamber / form** (required)
- **Mount** (optional)
- **Upgrades / flaws / weapons** as named picks from the catalogue, with destiny-point budget

Points come from the rank. Destiny overspend is a red error.

## 8. Pack extras (only if that pack is ticked)

**Ravaged Coast:** Emberstone shards, emberstone weapon, Aqshian artefacts, Coast scars, Coast Paths, Coast RoRs if we already have them.

**Blighted Wilds:** Wilds Paths, Wilds scars, Thyrian wonders / concoctions as named picks.

## 9. Play

- Path abilities on the phase board
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
2. Injuries: leftover wounds, Drained, extracted scars
3. Path eligibility + warlord rules
4. Lore caps + one-by-one prayers
5. Extra enhancements on units
6. Anvil parts
7. Aftermath (glory, renown, spend)
8. Pack extras (Coast, then Wilds)

## Open for review

- Warlord points cap: **350** (Wahapedia / current assumption). Confirm vs book if you want 300.
- Cut any of: Anvil parts, aftermath, pack extras — say so before implementation starts.
