"use client";

import Link from "next/link";
import { useState } from "react";

export default function ExamplePage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="mb-6 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          <Link href="/" className="hover:text-fd-foreground transition-colors">
            plannar
          </Link>
          <span className="text-fd-border">/</span>
          <span className="text-fd-foreground">example plan</span>
        </div>

        <div className="mb-2 inline-flex items-center gap-2 rounded border border-fd-border bg-fd-card px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fd-muted-foreground">
          <span>.plannar/plans/hello-world.mdx</span>
        </div>

        <h1 className="text-4xl font-medium tracking-[-0.02em] text-fd-foreground mb-3">
          Hello, Plannar!
        </h1>

        <blockquote className="mb-10 border-l-2 border-fd-border pl-4 text-sm text-fd-muted-foreground">
          A worked example of what a real plan looks like. Delete this file when you write your
          first one — or keep it around as a reference.
        </blockquote>

        <article className="space-y-10">
          <Section>
            <H2>
              Plan: add <Code>--dry-run</Code> to <Code>plannar export</Code>
            </H2>
            <Prose>
              Today <Code>plannar export</Code> writes HTML to disk immediately. Reviewers who just
              want to see <em>what</em> would be written — and where — have to delete the output
              after the fact.
            </Prose>
            <Prose>
              A <Code>--dry-run</Code> flag prints the resolved plan list, output paths, and total
              size, then exits without touching the filesystem.
            </Prose>
          </Section>

          <Section>
            <H2>Behavior</H2>
            <Prose>Toggle the flag to see the difference:</Prose>
            <DryRunDemo />
          </Section>

          <Section>
            <H2>Edge cases</H2>
            <ul className="space-y-2 text-sm text-fd-foreground/90">
              <Bullet term="Empty plans directory">
                exit 0 with <Code>no plans found</Code> (same as today).
              </Bullet>
              <Bullet term="--out set to a non-existent dir">
                dry-run still validates the path and warns; no <Code>mkdir</Code>.
              </Bullet>
              <Bullet term="A plan fails to compile">
                dry-run reports the error and exits non-zero, matching the non-dry path.
              </Bullet>
            </ul>
          </Section>

          <Section>
            <H2>Acceptance</H2>
            <ul className="space-y-2 text-sm text-fd-foreground/90">
              <Check>
                <Code>plannar export --dry-run</Code> exits 0 and writes nothing
              </Check>
              <Check>Output lists each plan, target path, and byte size</Check>
              <Check>Same exit codes as a real export on compile errors</Check>
              <Check>
                Covered by a test in <Code>packages/plannar/src/commands/export.test.ts</Code>
              </Check>
            </ul>
          </Section>

          <Section>
            <H2>Next steps for you</H2>
            <ul className="space-y-2 text-sm text-fd-foreground/90 list-disc pl-5 marker:text-fd-muted-foreground">
              <li>
                Edit this file in <Code>.plannar/plans/hello-world.mdx</Code> to draft your own plan
              </li>
              <li>
                Run <Code>plannar editor</Code> to preview it live with HMR
              </li>
              <li>
                Run <Code>plannar export &lt;name&gt;</Code> to package it as a single HTML file
              </li>
            </ul>
          </Section>
        </article>

        <div className="mt-12 flex items-center gap-4">
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

function Section({ children }: { children: React.ReactNode }) {
  return <section className="space-y-3">{children}</section>;
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-fd-foreground tracking-[-0.01em]">{children}</h2>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-fd-foreground/90">{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-[0.85em] text-fd-foreground">
      {children}
    </code>
  );
}

function Bullet({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <li className="rounded border border-fd-border bg-fd-card px-3 py-2">
      <span className="font-medium text-fd-foreground">{term}</span>
      <span className="text-fd-muted-foreground"> — {children}</span>
    </li>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden
        className="mt-[3px] inline-flex size-4 shrink-0 items-center justify-center rounded border border-fd-border bg-fd-card"
      />
      <span className="text-fd-foreground/90">{children}</span>
    </li>
  );
}

function DryRunDemo() {
  const [dryRun, setDryRun] = useState(false);

  const output = dryRun
    ? `$ plannar export --dry-run
[dry-run] would write 3 plans:
  .plannar/exports/onboarding.html   (42 KB)
  .plannar/exports/pagination.html   (38 KB)
  .plannar/exports/rate-limit.html   (51 KB)
[dry-run] total: 131 KB — no files written`
    : `$ plannar export
✓ wrote .plannar/exports/onboarding.html
✓ wrote .plannar/exports/pagination.html
✓ wrote .plannar/exports/rate-limit.html
3 plans exported (131 KB)`;

  return (
    <div className="rounded-lg border border-fd-border bg-fd-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setDryRun(!dryRun)}
          className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
            dryRun
              ? "border-fd-primary bg-fd-primary text-fd-primary-foreground"
              : "border-fd-border bg-fd-background text-fd-foreground hover:bg-fd-muted"
          }`}
        >
          <span
            className={`size-2 rounded-full ${dryRun ? "bg-fd-primary-foreground" : "bg-fd-muted-foreground/40"}`}
          />
          {dryRun ? "--dry-run ON" : "--dry-run OFF"}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fd-muted-foreground">
          {dryRun ? "preview only" : "writes to disk"}
        </span>
      </div>
      <pre className="rounded-md border border-fd-border bg-fd-background px-3 py-3 font-mono text-[12px] leading-relaxed text-fd-foreground whitespace-pre overflow-x-auto">
        {output}
      </pre>
    </div>
  );
}
