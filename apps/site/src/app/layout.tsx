import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Plannar — skimmable interactive plans",
    template: "%s · Plannar",
  },
  description:
    "Plannar turns agent-written plans into interactive MDX documents. Tabs instead of walls of text. Live previews instead of mockups.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
