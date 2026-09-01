import {
  matchTotal,
  type GameSession,
} from "./gameSession";

/** Plain-text battle result for copy / Web Share. */
export function formatBattleRecapText(
  session: GameSession,
  battleplanName: string,
): string {
  const when = new Date(session.updatedAt).toLocaleString();
  const yourFinal = matchTotal(session, "you");
  const opponentFinal = matchTotal(session, "opponent");
  const turnLines = session.rounds.map(
    (round, index) =>
      `Turn ${index + 1}: ${session.yourName} ${round.yourVp} – ${session.opponentName} ${round.opponentVp}`,
  );
  return [
    `${session.yourName} vs ${session.opponentName}`,
    `${session.yourArmy} vs ${session.opponentArmy}`,
    `Mission: ${battleplanName}`,
    `When: ${when}`,
    "",
    ...turnLines,
    "",
    `Final: ${yourFinal} – ${opponentFinal}`,
  ].join("\n");
}
