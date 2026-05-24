import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="font-mono text-sm tracking-tight">
        <span className="text-fd-primary">▣</span>&nbsp;plannar{" "}
        <span className="text-[10px] uppercase tracking-wider text-fd-muted-foreground ml-1">
          v0.1
        </span>
      </span>
    ),
  },
  links: [
    { text: "Docs", url: "/docs" },
    { text: "Example", url: "/example" },
    { text: "GitHub", url: "https://github.com/ekrich/plannar", external: true },
  ],
};
