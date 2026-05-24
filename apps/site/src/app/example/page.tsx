"use client";

import Link from "next/link";
import { useState } from "react";

export default function ExamplePage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="mb-6 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          <Link href="/" className="hover:text-fd-foreground transition-colors">
            plannar
          </Link>
          <span className="text-fd-border">/</span>
          <span className="text-fd-foreground">example plan</span>
        </div>

        <h1 className="text-3xl font-medium tracking-[-0.02em] text-fd-foreground mb-2">
          Sample plan: hello-world.mdx
        </h1>
        <p className="text-sm text-fd-muted-foreground mb-8 max-w-xl">
          This is what an agent-written Plannar plan looks like when rendered. Every Playground is
          live and interactive — no hooks to wire.
        </p>

        <div className="rounded-lg border border-fd-border bg-fd-card p-6 md:p-8 space-y-8">
          <Heading number="1" title="State binding in 6 lines" />
          <p className="text-sm text-fd-muted-foreground">
            Drag the range, watch the box change. No useState, no handlers — bind="radius:12" does
            both.
          </p>
          <SliderDemo />

          <Heading number="2" title="Component bindings" />
          <p className="text-sm text-fd-muted-foreground">
            The same pattern works for any registered control — inputs, shadcn components.
            Unregistered elements get a setX setter:
          </p>
          <CounterDemo />

          <div className="border-t border-fd-border pt-6">
            <Heading number="3" title="What else Plannar gives you" />

            <div className="mt-4 space-y-4">
              <Feature title="Inline comments">
                Reviewers highlight any text and leave feedback. Plannar generates a prompt you
                paste back to your agent.
              </Feature>
              <Feature title="Self-contained exports">
                plannar export packages this entire plan — interactivity, state, styles and all —
                into a single HTML file.
              </Feature>
              <Feature title="Real components, not screenshots">
                Add shadcn components at any time and use them directly in Playgrounds. Mockups and
                implementation look 1:1.
              </Feature>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
          >
            Read the docs →
          </Link>
          <Link
            href="/"
            className="text-xs text-fd-muted-foreground hover:text-fd-foreground transition-colors"
          >
            ← Back home
          </Link>
        </div>
      </div>
    </main>
  );
}

function Heading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-6 items-center justify-center rounded bg-fd-primary/10 text-[10px] font-mono text-fd-primary">
        {number}
      </span>
      <h2 className="text-lg font-semibold text-fd-foreground">{title}</h2>
    </div>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-fd-border p-4">
      <div className="text-xs font-medium text-fd-foreground mb-1">{title}</div>
      <p className="text-xs text-fd-muted-foreground">{children}</p>
    </div>
  );
}

function SliderDemo() {
  const [radius, setRadius] = useState(12);

  return (
    <div className="space-y-3">
      <input
        type="range"
        min={0}
        max={48}
        value={radius}
        onChange={(e) => setRadius(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex items-center gap-3">
        <div
          className="grid h-24 flex-1 place-items-center bg-fd-primary text-fd-primary-foreground text-sm font-mono transition-[border-radius]"
          style={{ borderRadius: `${radius}px` }}
        >
          {radius}px
        </div>
        <div className="text-[10px] font-mono text-fd-muted-foreground uppercase tracking-wider shrink-0">
          <pre className="whitespace-pre">
            {`bind="radius:12"\n→ useState(12)\n→ onChange wired`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function CounterDemo() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setCount(count + 1)}
        className="inline-flex items-center gap-2 rounded border border-fd-border px-4 py-2 text-sm hover:bg-fd-muted transition-colors"
      >
        Clicked {count} times
      </button>
      <span className="text-[10px] font-mono text-fd-muted-foreground">
        bind="count:0" → onClick wired
      </span>
    </div>
  );
}
