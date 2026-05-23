import type { CommentAnchor } from "./comment-state.js";

export type PlanSource = {
  source: string;
  lines: string[];
};

export function findLineNumber(anchor: CommentAnchor, source: PlanSource): number | null {
  if (!source.lines.length) return null;
  const search = anchor.type === "text" ? anchor.text : anchor.text;
  const clean = search.replace(/\s+/g, " ").trim();
  if (!clean) return null;

  let bestLine: number | null = null;
  let bestScore = 0;

  for (let i = 0; i < source.lines.length; i++) {
    const lineClean = source.lines[i].replace(/\s+/g, " ").trim();
    if (!lineClean) continue;
    if (lineClean.includes(clean)) {
      const score = lineClean.length;
      if (score > bestScore) {
        bestScore = score;
        bestLine = i + 1;
      }
    }
  }

  if (bestLine === null) {
    const words = clean.split(/\s+/).filter((w) => w.length > 2);
    if (words.length === 0) return null;
    for (let i = 0; i < source.lines.length; i++) {
      const lineClean = source.lines[i].replace(/\s+/g, " ").trim();
      const matchCount = words.filter((w) =>
        lineClean.toLowerCase().includes(w.toLowerCase()),
      ).length;
      if (matchCount >= Math.ceil(words.length / 2)) {
        return i + 1;
      }
    }
  }

  return bestLine;
}

export function generatePrompt(
  comments: { anchor: CommentAnchor; content: string; file: string; line: number | null }[],
): string {
  if (comments.length === 0) return "";

  let prompt = "The user left the following comments for you to address:\n\n";
  for (const c of comments) {
    const loc = c.line ? `line ${c.line} ${c.file}` : c.file;
    const quoted = truncateContext(c.anchor);
    prompt += `${loc}: "${quoted}" — ${c.content}\n`;
  }
  return prompt.trimEnd();
}

function truncateContext(anchor: CommentAnchor): string {
  const text = anchor.type === "text" ? anchor.text : anchor.text;
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > 80 ? cleaned.slice(0, 77) + "..." : cleaned;
}
