import {
  formatBattleRecapText,
} from "@/engine/battleRecap";
import { matchTotal, type GameSession } from "@/engine/gameSession";

export async function copyBattleRecap(
  session: GameSession,
  battleplanName: string,
): Promise<void> {
  const text = formatBattleRecapText(session, battleplanName);
  await navigator.clipboard.writeText(text);
}

export async function shareBattleRecap(
  session: GameSession,
  battleplanName: string,
): Promise<void> {
  const text = formatBattleRecapText(session, battleplanName);
  const title = `${session.yourName} vs ${session.opponentName}`;
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text });
      return;
    } catch {
      // Fall through to clipboard when share is cancelled or unavailable.
    }
  }
  await navigator.clipboard.writeText(text);
}

export function downloadBattleRecapPng(
  session: GameSession,
  battleplanName: string,
): void {
  const width = 720;
  const height = 520;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#efe6d2";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#2a2118";
  ctx.font = "600 28px Georgia, serif";
  ctx.fillText(`${session.yourName} vs ${session.opponentName}`, 40, 60);

  ctx.font = "16px system-ui, sans-serif";
  ctx.fillStyle = "#5c4f42";
  ctx.fillText(`${session.yourArmy} vs ${session.opponentArmy}`, 40, 92);
  ctx.fillText(`Mission · ${battleplanName}`, 40, 120);
  ctx.fillText(`When · ${new Date(session.updatedAt).toLocaleString()}`, 40, 148);

  ctx.fillStyle = "#2a2118";
  ctx.font = "600 56px Georgia, serif";
  const score = `${matchTotal(session, "you")} – ${matchTotal(session, "opponent")}`;
  ctx.fillText(score, 40, 230);

  ctx.font = "15px system-ui, sans-serif";
  ctx.fillStyle = "#5c4f42";
  session.rounds.forEach((round, index) => {
    const y = 280 + index * 28;
    ctx.fillText(
      `Turn ${index + 1}  ${session.yourName} ${round.yourVp}  ·  ${session.opponentName} ${round.opponentVp}`,
      40,
      y,
    );
  });

  ctx.fillStyle = "#8a7358";
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText("Order of Battle", 40, height - 28);

  const link = document.createElement("a");
  link.download = `battle-recap-${session.id.slice(0, 8)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
