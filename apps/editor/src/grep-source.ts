import type { CommentAnchor } from "./comment-state.js";

export type PlanSource = {
  source: string;
  lines: string[];
};

export function findLineRange(
  anchor: CommentAnchor,
  source: PlanSource,
): { start: number; end: number } | null {
  if (!source.lines.length) return null;
  const search = anchor.text.replace(/\s+/g, " ").trim();
  if (!search) return null;

  let startLine: number | null = null;

  for (let i = 0; i < source.lines.length; i++) {
    const lineClean = source.lines[i].replace(/\s+/g, " ").trim();
    if (lineClean.includes(search)) {
      startLine = i + 1;
      break;
    }
  }

  if (startLine === null) {
    const words = search.split(/\s+/).filter((w) => w.length > 2);
    for (let i = 0; i < source.lines.length; i++) {
      const lineClean = source.lines[i].replace(/\s+/g, " ").trim();
      const matchCount = words.filter((w) =>
        lineClean.toLowerCase().includes(w.toLowerCase()),
      ).length;
      if (matchCount >= Math.ceil(words.length / 2)) {
        startLine = i + 1;
        break;
      }
    }
    if (startLine === null) return null;
  }

  if (anchor.type === "text") {
    return { start: startLine, end: startLine };
  }

  const headingLevel = getHeadingLevel(source.lines[startLine - 1]);
  if (headingLevel === 0) return { start: startLine, end: startLine };

  let endLine = source.lines.length;
  for (let i = startLine; i < source.lines.length; i++) {
    const level = getHeadingLevel(source.lines[i]);
    if (level > 0 && level <= headingLevel) {
      endLine = i;
      break;
    }
  }

  return { start: startLine, end: endLine };
}

function getHeadingLevel(line: string): number {
  const match = line.match(/^(#{1,6})\s/);
  return match ? match[1].length : 0;
}

export function generatePrompt(
  comments: {
    anchor: CommentAnchor;
    content: string;
    file: string;
    line: number | null;
    lineEnd: number | null;
  }[],
): string {
  const sorted = [...comments].sort((a, b) => (a.line ?? Infinity) - (b.line ?? Infinity));
  if (sorted.length === 0) return "";

  let prompt = "The user left the following comments for you to address:\n\n";
  for (const c of sorted) {
    const loc = formatLoc(c);
    const quoted = truncateContext(c.anchor);
    prompt += `${loc}: "${quoted}" — ${c.content}\n`;
  }
  return prompt.trimEnd();
}

function formatLoc(c: { file: string; line: number | null; lineEnd: number | null }): string {
  if (!c.line) return c.file;
  if (c.lineEnd && c.lineEnd > c.line) return `lines ${c.line}-${c.lineEnd} ${c.file}`;
  return `line ${c.line} ${c.file}`;
}

function truncateContext(anchor: CommentAnchor): string {
  const cleaned = anchor.text.replace(/\s+/g, " ").trim();
  return cleaned.length > 80 ? cleaned.slice(0, 77) + "..." : cleaned;
}
