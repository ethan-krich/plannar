import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog.js";
import { useCommentState } from "./comment-state.js";
import { generatePrompt } from "./grep-source.js";

type PromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PromptDialog({ open, onOpenChange }: PromptDialogProps) {
  const { comments } = useCommentState();
  const [copied, setCopied] = useState(false);

  const prompt = generatePrompt(comments);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [prompt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generated Prompt</DialogTitle>
          <DialogDescription>Ready to paste into any LLM</DialogDescription>
        </DialogHeader>

        <div className="bg-zinc-950 rounded-lg p-4 overflow-auto max-h-80">
          <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-zinc-300 font-mono">
            <code>{prompt || "No comments to generate."}</code>
          </pre>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleCopy}
            disabled={!prompt}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:bg-muted disabled:opacity-50"
          >
            {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
