"use client";

import Link from "next/link";
import { useState } from "react";
import { ShikiHighlighter } from "react-shiki";

export default function HomePage() {
  return (
    <main className="flex-1">
      <Hero />
      <PlanExample />
      <Comparison />
      <HowItWorks />
      <FeatureGrid />
      <SourcePeek />
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
        Plans your AI agent writes
        <br />
        <span className="text-fd-primary">that you actually want to read.</span>
      </h1>

      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-fd-muted-foreground">
        Your coding agent already writes plans before it ships features. Plannar gives it an MDX
        surface — tabs, tradeoff tables, live previews — so the plan is skimmable in a minute
        instead of a wall of bullets you scroll past.
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
        <span>Works with Claude Code, Cursor, Codex, or anything that can write a file.</span>
      </div>
    </section>
  );
}

/* ── Plan Example: cursor vs offset pagination ── */

type PageApi = "offset" | "cursor";

const offsetPages = [
  { url: "GET /messages?limit=3&offset=0", items: ["msg_104", "msg_103", "msg_102"], next: 3 },
  { url: "GET /messages?limit=3&offset=3", items: ["msg_101", "msg_100", "msg_099"], next: 6 },
  { url: "GET /messages?limit=3&offset=6", items: ["msg_098", "msg_097", "msg_096"], next: 9 },
];

const cursorPages = [
  {
    url: "GET /messages?limit=3",
    items: ["msg_104", "msg_103", "msg_102"],
    cursor: "eyJpZCI6Im1zZ18xMDIifQ",
  },
  {
    url: "GET /messages?limit=3&after=eyJpZCI6Im1zZ18xMDIifQ",
    items: ["msg_101", "msg_100", "msg_099"],
    cursor: "eyJpZCI6Im1zZ18wOTkifQ",
  },
  {
    url: "GET /messages?limit=3&after=eyJpZCI6Im1zZ18wOTkifQ",
    items: ["msg_098", "msg_097", "msg_096"],
    cursor: "eyJpZCI6Im1zZ18wOTYifQ",
  },
];

function PlanExample() {
  const [api, setApi] = useState<PageApi>("cursor");
  const [pageIdx, setPageIdx] = useState(0);
  const pages = api === "offset" ? offsetPages : cursorPages;
  const page = pages[Math.min(pageIdx, pages.length - 1)];

  return (
    <section className="border-t border-fd-border">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          <span className="text-fd-primary">02</span>
          <span className="inline-block h-px w-3 bg-fd-border" />
          <span>A plan, rendered</span>
        </div>

        <h2 className="text-3xl font-medium tracking-[-0.02em] text-fd-foreground mb-2">
          Pagination for <span className="font-mono text-[0.85em]">/messages</span>
        </h2>
        <p className="text-sm text-fd-muted-foreground max-w-2xl mb-8">
          The exact MDX file the agent wrote is in the next section. Below is what the reviewer
          sees: a tab per option, a tradeoff table, and a live API preview to click through.
        </p>

        <div className="rounded-lg border border-fd-border bg-fd-card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-fd-border bg-fd-muted/30">
            {(["offset", "cursor"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setApi(t);
                  setPageIdx(0);
                }}
                className={`relative px-5 py-3 text-sm transition-colors ${
                  api === t
                    ? "text-fd-foreground bg-fd-card"
                    : "text-fd-muted-foreground hover:text-fd-foreground"
                }`}
              >
                {t === "offset" ? "Option A — Offset" : "Option B — Cursor"}
                {api === t && <span className="absolute inset-x-0 -bottom-px h-px bg-fd-primary" />}
              </button>
            ))}
            <div className="ml-auto flex items-center px-4 text-[10px] uppercase tracking-[0.18em] text-fd-muted-foreground">
              {api === "cursor" ? "Recommended" : "Current"}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <p className="text-sm text-fd-foreground/90 leading-relaxed">
              {api === "offset"
                ? "Use ?limit + ?offset. Simple to implement, but rows shift when new messages arrive between requests — readers see duplicates or skips."
                : "Return an opaque cursor with each page; the client passes it back as ?after. Stable under concurrent writes, and the index lookup stays O(log n) at any depth."}
            </p>

            {/* Live API preview */}
            <div className="rounded border border-fd-border bg-fd-background">
              <div className="flex items-center justify-between border-b border-fd-border px-4 py-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-fd-muted-foreground">
                  Live request
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                    disabled={pageIdx === 0}
                    className="rounded border border-fd-border px-2 py-1 font-mono text-[11px] text-fd-foreground hover:bg-fd-muted disabled:opacity-40"
                  >
                    ← prev
                  </button>
                  <button
                    onClick={() => setPageIdx((i) => Math.min(pages.length - 1, i + 1))}
                    disabled={pageIdx >= pages.length - 1}
                    className="rounded border border-fd-border px-2 py-1 font-mono text-[11px] text-fd-foreground hover:bg-fd-muted disabled:opacity-40"
                  >
                    next →
                  </button>
                </div>
              </div>
              <div className="px-4 py-3 font-mono text-[12px] text-fd-foreground break-all">
                {page.url}
              </div>
              <div className="border-t border-fd-border px-4 py-3 font-mono text-[12px] text-fd-muted-foreground leading-relaxed">
                {"{"}
                <div className="pl-4">
                  <div>
                    <span className="text-fd-primary">"items"</span>: [
                    {page.items.map((it, i) => (
                      <span key={it}>
                        <span className="text-fd-foreground">"{it}"</span>
                        {i < page.items.length - 1 ? ", " : ""}
                      </span>
                    ))}
                    ],
                  </div>
                  {api === "offset" ? (
                    <div>
                      <span className="text-fd-primary">"next_offset"</span>:{" "}
                      <span className="text-fd-foreground">
                        {(page as (typeof offsetPages)[number]).next}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-fd-primary">"next_cursor"</span>:{" "}
                      <span className="text-fd-foreground break-all">
                        "{(page as (typeof cursorPages)[number]).cursor}"
                      </span>
                    </div>
                  )}
                </div>
                {"}"}
              </div>
            </div>

            {/* Tradeoffs */}
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              {[
                api === "offset"
                  ? ["Stable under writes", "No — rows shift", "text-fd-muted-foreground"]
                  : ["Stable under writes", "Yes", "text-fd-primary"],
                api === "offset"
                  ? ["Deep page cost", "O(n) — DB scans offset rows", "text-fd-muted-foreground"]
                  : ["Deep page cost", "O(log n) — index seek", "text-fd-primary"],
                api === "offset"
                  ? ["Jump to page N", "Yes (offset = N × limit)", "text-fd-foreground"]
                  : ["Jump to page N", "No — sequential only", "text-fd-muted-foreground"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded border border-fd-border p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-fd-muted-foreground mb-1">
                    {label}
                  </div>
                  <div className={`text-[13px] ${color}`}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-fd-muted-foreground">
          Switching tabs swaps the prose, the request, the response, and the tradeoffs in one click
          — the agent wrote it once, in one MDX file.
        </p>
      </div>
    </section>
  );
}

/* ── Why Plannar ── */

function Comparison() {
  const cols = ["Plain markdown", "Hand-rolled HTML", "Plannar"] as const;

  return (
    <section className="border-t border-fd-border">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          <span className="text-fd-primary">03</span>
          <span className="inline-block h-px w-3 bg-fd-border" />
          <span>Why Plannar</span>
        </div>

        <h2 className="text-3xl font-medium tracking-[-0.02em] text-fd-foreground mb-6">
          Built for what agents are already good at
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
                ["Tokens to author", "Cheap", "Expensive (full page)", "Cheap (MDX + components)"],
                ["Easy to revise", "Easy", "Hard (one blob)", "Easy (named components)"],
                ["Agent re-runs", "Rewrites prose", "Rewrites whole page", "Patches MDX in place"],
                ["Reads like a doc", "Yes", "One-off webpage", "Yes (Fumadocs chrome)"],
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
          Agents are great at writing components and structured MDX. Plannar leans into that instead
          of asking them to format pretty prose.
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
      title: "Your agent writes the plan",
      body: "Plannar ships a Claude Code skill (and works with any agent). The agent emits an MDX file with tabs, tradeoff tables, and Playground blocks instead of a flat wall of bullets.",
    },
    {
      step: "2",
      title: "You review it in the editor",
      body: "plannar editor opens a local preview with HMR. Every Playground is live. Highlight any line to leave inline feedback for the agent.",
    },
    {
      step: "3",
      title: "Send it back, or export it",
      body: "Comments turn into a prompt you paste straight back to the agent. When the plan is final, plannar export packages it as a single HTML file to share.",
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
              title: "Inline comments → agent prompt",
              body: "Highlight any line and leave feedback. Plannar bundles every comment into a single prompt your agent can act on directly — no copy-paste roundtrips.",
            },
            {
              n: "02",
              title: "Self-contained exports",
              body: "plannar export packages a plan — interactivity, state, styles — into one HTML file. Drop it in Slack, attach it to a ticket, no server required.",
            },
            {
              n: "03",
              title: "Real components, not screenshots",
              body: "Plans render with the same shadcn/ui primitives as your app. The agent's mockup and the eventual implementation look the same.",
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

/* ── Source Peek: the MDX behind the plan above ── */

function SourcePeek() {
  return (
    <section className="border-t border-fd-border">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          <span className="text-fd-primary">06</span>
          <span className="inline-block h-px w-3 bg-fd-border" />
          <span>The source the agent wrote</span>
        </div>

        <h2 className="text-3xl font-medium tracking-[-0.02em] text-fd-foreground mb-2">
          One MDX file produced the plan above
        </h2>
        <p className="text-sm text-fd-muted-foreground max-w-2xl mb-6">
          No hand-wired state, no per-tab component. The agent writes structured MDX; Plannar
          handles tabs, bindings, and the Playground.
        </p>

        <div className="rounded-lg border border-fd-border bg-fd-card">
          <div className="flex items-center justify-between border-b border-fd-border px-4 py-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-fd-muted-foreground">
              .plannar/plans/messages-pagination.mdx
            </span>
            <span className="font-mono text-[10px] text-fd-muted-foreground">~ 40 lines</span>
          </div>
          <ShikiHighlighter language="mdx" theme="github-dark" className="text-xs leading-relaxed">
            {`---
title: Pagination for /messages
author: claude-code
---

## Context

The mobile feed double-renders messages when a new one
arrives mid-scroll. Today we paginate by \`offset\`.

## Options

<Tabs bind="api:cursor">
  <Tab value="offset">
    ### Offset
    Keep \`?limit\` + \`?offset\`. Simplest change,
    but rows shift under concurrent writes.

    <Playground>
      <PageStepper bind="page:0" pages={offsetPages} />
    </Playground>

    | Stable under writes | Deep page cost  | Jump to page N |
    | ------------------- | --------------- | -------------- |
    | No                  | O(n) row scan   | Yes            |
  </Tab>

  <Tab value="cursor">
    ### Cursor *(recommended)*
    Return an opaque \`next_cursor\`; client passes
    it back as \`?after\`. Index seek stays O(log n).

    <Playground>
      <PageStepper bind="page:0" pages={cursorPages} />
    </Playground>

    | Stable under writes | Deep page cost  | Jump to page N |
    | ------------------- | --------------- | -------------- |
    | Yes                 | O(log n) seek   | No (sequential)|
  </Tab>
</Tabs>

## Recommendation

Ship cursor. The feed never needs page-N jumps;
stability under writes is the actual bug.`}
          </ShikiHighlighter>
        </div>

        <p className="mt-4 text-xs text-fd-muted-foreground">
          <span className="font-mono">bind="api:cursor"</span> wires the tab state without a single
          <span className="font-mono"> useState</span>. The same pattern works for sliders, selects,
          and any registered control.
        </p>
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
            Give your agent a better way to plan
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
