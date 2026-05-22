import type { BindingMeta } from "@plannar/core";
import type { UserConfig } from "vite";
export declare const shadcnBindings: Record<string, BindingMeta>;
export declare function isSafePlanSlug(slug: string): boolean;
export declare function resolvePlanPath(plansDir: string, slug: string): string | null;
export declare function injectTailwindSource(css: string, plannarRoot: string): string;
type CreateEditorViteConfigOptions = {
  appDir: string;
  workspaceRoot: string;
};
export declare function createEditorViteConfig({
  appDir,
  workspaceRoot,
}: CreateEditorViteConfigOptions): UserConfig;
