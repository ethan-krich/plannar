import { toast } from "sonner";
import type { Comment } from "./comment-state.js";
import { generatePrompt } from "./grep-source.js";

export type GenerateActionId = "claude" | "codex" | "copy";

export type GenerateAction = {
  id: GenerateActionId;
  label: string;
};

export const GENERATE_ACTIONS: readonly GenerateAction[] = [
  { id: "claude", label: "Implement with Claude" },
  { id: "codex", label: "Implement with Codex" },
  { id: "copy", label: "Copy prompt" },
];

const STORAGE_KEY = "plannar-generate-action";
const CLAUDE_Q_MAX = 5000;

function isValidAction(value: string | null): value is GenerateActionId {
  return value === "claude" || value === "codex" || value === "copy";
}

export function loadGenerateAction(): GenerateActionId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidAction(stored)) return stored;
  } catch {
    // localStorage unavailable (private mode, SSR, exported HTML).
  }
  return "copy";
}

export function saveGenerateAction(action: GenerateActionId): void {
  try {
    localStorage.setItem(STORAGE_KEY, action);
  } catch {
    // ignore write failures
  }
}

export function getWorkspaceRoot(): string | null {
  const meta = document.querySelector('meta[name="plannar-workspace"]');
  return meta?.getAttribute("content") || null;
}

export function buildClaudeDeeplink(prompt: string, cwd: string | null): string {
  const q = prompt.slice(0, CLAUDE_Q_MAX);
  let url = `claude-cli://open?q=${encodeURIComponent(q)}`;
  if (cwd) url += `&cwd=${encodeURIComponent(cwd)}`;
  return url;
}

export function buildCodexDeeplink(prompt: string, path: string | null): string {
  let url = `codex://new?prompt=${encodeURIComponent(prompt)}`;
  if (path) url += `&path=${encodeURIComponent(path)}`;
  return url;
}

function openDeeplink(url: string): void {
  window.location.href = url;
}

export function runGenerateAction(action: GenerateActionId, comments: Comment[]): void {
  const prompt = generatePrompt(comments);

  if (action === "copy") {
    void navigator.clipboard.writeText(prompt).then(() => {
      toast.success("Prompt copied to clipboard");
    });
    return;
  }

  const cwd = getWorkspaceRoot();
  const url =
    action === "claude" ? buildClaudeDeeplink(prompt, cwd) : buildCodexDeeplink(prompt, cwd);
  openDeeplink(url);
  toast(`Opening ${action === "claude" ? "Claude Code" : "Codex"}…`);
}
