import { useState, type ComponentType } from "react";
import { Bot, Check, ChevronDown, Copy, Terminal } from "lucide-react";
import { useCommentState } from "./comment-state.js";
import {
  GENERATE_ACTIONS,
  loadGenerateAction,
  runGenerateAction,
  saveGenerateAction,
  type GenerateActionId,
} from "./generate-actions.js";
import { cn } from "./lib/utils.js";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover.js";

const ACTION_ICONS: Record<GenerateActionId, ComponentType<{ className?: string }>> = {
  claude: Terminal,
  codex: Bot,
  copy: Copy,
};

const ACTION_LABELS: Record<GenerateActionId, string> = {
  claude: "Implement with Claude",
  codex: "Implement with Codex",
  copy: "Copy prompt",
};

export function GenerateButton() {
  const { comments } = useCommentState();
  const [action, setAction] = useState<GenerateActionId>(() => loadGenerateAction());
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  if (comments.length === 0) return null;

  const run = (id: GenerateActionId) => {
    setAction(id);
    saveGenerateAction(id);
    setOpen(false);
    if (id === "copy") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopied(false);
    }
    runGenerateAction(id, comments);
  };

  const Icon = ACTION_ICONS[action];
  const label = ACTION_LABELS[action];
  const showCopied = copied && action === "copy";

  return (
    <div className="fixed bottom-6 right-20 z-40 inline-flex items-stretch overflow-hidden rounded-lg shadow-lg">
      <button
        type="button"
        onClick={() => run(action)}
        className="inline-flex items-center gap-1.5 bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        {showCopied ? <Check className="size-3" /> : <Icon className="size-3" />}
        {showCopied ? "Copied" : `${label} (${comments.length})`}
      </button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          aria-label="Choose generate action"
          className="inline-flex items-center border-l border-primary-foreground/20 bg-primary px-2 py-2 text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <ChevronDown className="size-3" />
        </PopoverTrigger>
        <PopoverContent align="end" side="top" sideOffset={6} className="w-56 p-1">
          {GENERATE_ACTIONS.map((a) => {
            const ItemIcon = ACTION_ICONS[a.id];
            const active = a.id === action;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => run(a.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                  active && "bg-accent",
                )}
              >
                <ItemIcon className="size-4 text-muted-foreground" />
                <span className="flex-1">{a.label}</span>
                {active && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
}
