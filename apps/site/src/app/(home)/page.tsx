"use client";

import Link from "next/link";
import { useState } from "react";
import { ShikiHighlighter } from "react-shiki";

export default function HomePage() {
  return (
    <main className="flex-1">
      <Hero />
      <LiveDemo />
      <Comparison />
      <HowItWorks />
      <FeatureGrid />
      <CodePeek />
      <Footer />
    </main>
  );
}

/* ── Hero ── */

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-16 pb-16 md:pt-24 md:pb-20">
      <div className="mb-6 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
        <span className="text-fd-primary">01</span>
        <span className="inline-block h-px w-3 bg-fd-border" />
        <span>plannar</span>
      </div>

      <h1 className="text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-fd-foreground md:text-6xl">
        Plans that are actually
        <br />
        <span className="text-fd-primary">skimmable and interactive.</span>
      </h1>

      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-fd-muted-foreground">
        Plannar turns agent-written plans into interactive MDX documents. Tabs instead of walls of
        text. Live previews instead of mockups. Export as a single HTML file when you are done.
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 rounded bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          Get started <span aria-hidden>→</span>
        </Link>
        <Link
          href="/example"
          className="inline-flex items-center gap-2 rounded border border-fd-border px-4 py-2 text-sm text-fd-foreground transition-colors hover:bg-fd-muted"
        >
          View a sample plan
        </Link>
      </div>

      <div className="mt-6 inline-flex items-center gap-3 rounded border border-fd-border bg-fd-card px-3 py-2 font-mono text-[13px]">
        <span className="text-fd-muted-foreground">$</span>
        <span className="text-fd-foreground">npx plannar init</span>
      </div>

      <div className="mt-6 flex items-center gap-6 text-[11px] font-mono text-fd-muted-foreground tracking-[0.04em]">
        <a
          href="https://github.com/ekrich/plannar"
          className="hover:text-fd-foreground transition-colors"
        >
          GitHub →
        </a>
        <span className="h-px w-px bg-fd-border" />
        <span>MIT</span>
      </div>
    </section>
  );
}

/* ── Live Demo ── */

function LiveDemo() {
  const [radius, setRadius] = useState(12);

  return (
    <section className="border-t border-fd-border">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          <span className="text-fd-primary">02</span>
          <span className="inline-block h-px w-3 bg-fd-border" />
          <span>Live demo — drag the slider</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="rounded-lg border border-fd-border bg-fd-card p-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-fd-muted-foreground mb-3">
              MDX source
            </div>
            <ShikiHighlighter
              language="jsx"
              theme="github-dark"
              className="text-xs leading-relaxed"
            >
              {`<Playground>
  <Slider bind="radius:12"
    min={0} max={48} />
  <div style={{
    borderRadius: \`\${radius}px\`
  }}>
    {radius}px
  </div>
</Playground>`}
            </ShikiHighlighter>
          </div>

          <div className="hidden lg:flex items-center justify-center text-fd-primary text-2xl font-mono">
            →
          </div>

          <div className="rounded-lg border border-fd-border bg-fd-card p-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-fd-muted-foreground mb-3">
              Live preview
            </div>
            <input
              type="range"
              min={0}
              max={48}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full mb-4"
            />
            <div
              className="grid h-24 place-items-center text-sm font-mono bg-fd-primary text-fd-primary-foreground transition-[border-radius]"
              style={{ borderRadius: `${radius}px` }}
            >
              {radius}px
            </div>
            <p className="text-[11px] text-fd-muted-foreground mt-4">
              One bind= replaces useState + onChange. No hooks to wire.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Why Plannar ── */

function Comparison() {
  const cols = ["Plain markdown", "Raw HTML page", "Plannar"] as const;

  return (
    <section className="border-t border-fd-border">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          <span className="text-fd-primary">03</span>
          <span className="inline-block h-px w-3 bg-fd-border" />
          <span>Why Plannar</span>
        </div>

        <h2 className="text-3xl font-medium tracking-[-0.02em] text-fd-foreground mb-6">
          A better surface for agent output
        </h2>

        <div className="overflow-x-auto rounded-lg border border-fd-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fd-border bg-fd-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-fd-muted-foreground text-xs uppercase tracking-wider">
                  Property
                </th>
                {cols.map((c) => (
                  <th
                    key={c}
                    className={`px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wider ${
                      c === "Plannar" ? "text-fd-primary" : "text-fd-muted-foreground"
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Skimmable layout", "Walls of text", "Yes", "Yes (tabs / cards / accordion)"],
                ["Interactive preview", "No", "Yes, hand-rolled", "Yes, via <Playground>"],
                [
                  "Token cost to write",
                  "Cheap",
                  "Expensive (full page)",
                  "Cheap (MDX + components)",
                ],
                ["Edit-by-user", "Easy", "Hard (one blob)", "Easy (named imports)"],
                ["Agent re-runs", "Rewrites prose", "Rewrites page", "Patches MDX in place"],
                ["Looks like a doc", "Yes", "One-off webpage", "Yes (Fumadocs chrome)"],
              ].map(([prop, md, html, plannar], i) => (
                <tr
                  key={prop}
                  className={`border-b border-fd-border ${i % 2 === 0 ? "bg-fd-muted/20" : ""}`}
                >
                  <td className="px-4 py-2.5 font-medium text-fd-foreground">{prop}</td>
                  <td className="px-4 py-2.5 text-fd-muted-foreground">{md}</td>
                  <td className="px-4 py-2.5 text-fd-muted-foreground">{html}</td>
                  <td className="px-4 py-2.5 text-fd-primary font-medium">{plannar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-fd-muted-foreground">
          The "Raw HTML" column models the Karpathy-style approach — interactive but token-expensive
          and brittle across re-runs.
        </p>
      </div>
    </section>
  );
}

/* ── How It Works (Stepper) ── */

function HowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Write MDX",
      body: "Your agent writes a plan in MDX. Import shadcn components, use Playground blocks, and add inline comments.",
    },
    {
      step: "2",
      title: "Preview in the editor",
      body: "plannar editor starts a dev server with HMR. Every Playground is live. Dark mode, comment threads, instant reloads.",
    },
    {
      step: "3",
      title: "Export as HTML",
      body: "plannar export packages the entire plan — interactivity, state, and styles — into a single HTML file.",
    },
  ];

  return (
    <section className="border-t border-fd-border">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          <span className="text-fd-primary">04</span>
          <span className="inline-block h-px w-3 bg-fd-border" />
          <span>How it works</span>
        </div>

        <div className="relative max-w-lg">
          {steps.map(({ step, title, body }, i) => (
            <div key={step} className="relative flex gap-5 pb-8 last:pb-0">
              <div className="flex flex-col items-center shrink-0">
                <div className="flex size-7 items-center justify-center rounded-full bg-fd-primary text-[11px] font-mono font-medium text-fd-primary-foreground">
                  {step}
                </div>
                {i < steps.length - 1 && <div className="mt-2 w-px flex-1 bg-fd-border" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-fd-foreground mb-1">{title}</div>
                <p className="text-xs leading-relaxed text-fd-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── What You Get ── */

function FeatureGrid() {
  return (
    <section className="border-t border-fd-border">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          <span className="text-fd-primary">05</span>
          <span className="inline-block h-px w-3 bg-fd-border" />
          <span>What you get</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Inline comments",
              body: "Reviewers highlight any line and leave feedback. Plannar collects the comments and generates a prompt the author can paste straight back to their agent.",
            },
            {
              n: "02",
              title: "Self-contained exports",
              body: "plannar export turns a plan into a single HTML file. Interactivity preserved, no server required.",
            },
            {
              n: "03",
              title: "Real components, not screenshots",
              body: "Plans use the same shadcn/ui primitives as your real app — mockups and implementation look 1:1.",
            },
          ].map(({ n, title, body }) => (
            <div key={n} className="rounded-lg border border-fd-border bg-fd-card p-5">
              <div className="mb-3 text-[11px] font-mono text-fd-primary">{n}</div>
              <div className="text-sm font-medium text-fd-foreground mb-2">{title}</div>
              <p className="text-xs leading-relaxed text-fd-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Code Peek ── */

function CodePeek() {
  const [tab, setTab] = useState<"option-a" | "option-b">("option-a");
  const [r, setR] = useState(8);

  return (
    <section className="border-t border-fd-border">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          <span className="text-fd-primary">06</span>
          <span className="inline-block h-px w-3 bg-fd-border" />
          <span>Code peek</span>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-fd-border bg-fd-card">
            <div className="border-b border-fd-border px-4 py-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-fd-muted-foreground">
                plans/feature.mdx
              </span>
            </div>
            <ShikiHighlighter
              language="mdx"
              theme="github-dark"
              className="text-xs leading-relaxed"
            >
              {`---
title: Feature RFC
---

## Options

<Tabs bind="tab:option-a">
  <Tab value="option-a">
    ## Option A
    <Playground>
      <Slider bind="r:8"
        max={64} />
      <Card style={{
        borderRadius: \`\${r}px\`
      }}>
        Option A preview
      </Card>
    </Playground>
  </Tab>
  <Tab value="option-b">
    ## Option B
    A different approach...
  </Tab>
</Tabs>`}
            </ShikiHighlighter>
          </div>

          <div className="rounded-lg border border-fd-border bg-fd-card">
            <div className="border-b border-fd-border px-4 py-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-fd-muted-foreground">
                Rendered output
              </span>
            </div>
            <div className="p-4">
              <div className="flex gap-1 border-b border-fd-border pb-3 mb-4">
                {(["option-a", "option-b"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1.5 text-xs rounded transition-colors ${
                      tab === t
                        ? "bg-fd-primary text-fd-primary-foreground"
                        : "text-fd-muted-foreground hover:text-fd-foreground"
                    }`}
                  >
                    {t === "option-a" ? "Option A" : "Option B"}
                  </button>
                ))}
              </div>
              {tab === "option-a" ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-fd-foreground">Option A</div>
                  <input
                    type="range"
                    value={r}
                    onChange={(e) => setR(Number(e.target.value))}
                    min={0}
                    max={64}
                    className="w-full"
                  />
                  <div
                    className="grid h-16 place-items-center text-xs bg-fd-primary text-fd-primary-foreground transition-[border-radius]"
                    style={{ borderRadius: `${r}px` }}
                  >
                    {r}px radius
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-fd-foreground">Option B</div>
                  <p className="text-xs text-fd-muted-foreground leading-relaxed">
                    A different approach could render entirely different content here — driven by
                    the same MDX source, switching tabs with a single bind= prop. No routing, no
                    state wiring.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA + Footer ── */

function Footer() {
  return (
    <section className="border-t border-fd-border">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          <span className="text-fd-primary">07</span>
          <span className="inline-block h-px w-3 bg-fd-border" />
          <span>Get started</span>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-medium tracking-[-0.02em] text-fd-foreground mb-4">
            One command to start
          </h2>

          <div className="inline-flex items-center gap-3 rounded border border-fd-border bg-fd-card px-4 py-3 font-mono text-sm mb-4">
            <span className="text-fd-muted-foreground">$</span>
            <span className="text-fd-foreground">npx plannar init</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
            >
              Read the docs →
            </Link>
            <a
              href="https://github.com/ekrich/plannar"
              className="inline-flex items-center gap-2 rounded border border-fd-border px-4 py-2 text-sm text-fd-foreground transition-colors hover:bg-fd-muted"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-fd-border flex flex-wrap items-center justify-between gap-4 text-xs text-fd-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="font-mono text-fd-foreground">plannar</span>
            <span>·</span>
            <span>v0.1</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="hover:text-fd-foreground transition-colors">
              Docs
            </Link>
            <Link href="/example" className="hover:text-fd-foreground transition-colors">
              Example
            </Link>
            <a
              href="https://github.com/ekrich/plannar"
              className="hover:text-fd-foreground transition-colors"
            >
              GitHub
            </a>
            <span>MIT License</span>
          </div>
        </div>
      </div>
    </section>
  );
}
