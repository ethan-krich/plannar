import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { createJiti } from "jiti";

export type PlannarConfig = {
  plannarFolder: string;
  exportsFolder: string;
  globalCss?: string;
  cssFilePath?: string;
  viteConfig?: {
    editor?: Record<string, unknown>;
    exports?: Record<string, unknown>;
  };
};

const DEFAULTS: PlannarConfig = {
  plannarFolder: ".plannar",
  exportsFolder: ".plannar/exports",
  globalCss: ".plannar/index.css",
};

function applyDerivedDefaults(
  config: PlannarConfig,
  overrides: {
    exportsFolder?: boolean;
    globalCss?: boolean;
  },
): PlannarConfig {
  if (!overrides.exportsFolder) {
    config.exportsFolder = `${config.plannarFolder}/exports`;
  }

  if (!overrides.globalCss) {
    config.globalCss = `${config.plannarFolder}/index.css`;
  }

  return config;
}

async function loadConfigFile(filePath: string): Promise<Partial<PlannarConfig> | null> {
  if (!existsSync(filePath)) return null;

  if (filePath.endsWith(".json")) {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Partial<PlannarConfig>;
  }

  const jiti = createJiti(import.meta.url);
  const mod = await jiti.import<{ default?: PlannarConfig }>(filePath);
  return (mod.default ?? mod) as Partial<PlannarConfig>;
}

export function merge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (
      sv &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      result[key] = merge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else {
      result[key] = sv;
    }
  }
  return result;
}

export async function resolveConfig(cwd: string = process.cwd()): Promise<PlannarConfig> {
  const home = homedir();
  const globalConfigDir = join(home, ".config", "plannar");

  let globalConfig: Partial<PlannarConfig> | null = null;
  for (const ext of ["js", "ts", "json"]) {
    globalConfig = await loadConfigFile(join(globalConfigDir, `plannar.config.${ext}`));
    if (globalConfig) break;
  }

  let localConfig: Partial<PlannarConfig> | null = null;
  for (const ext of ["js", "ts", "json"]) {
    localConfig = await loadConfigFile(join(cwd, `plannar.config.${ext}`));
    if (localConfig) break;
  }

  let merged = { ...DEFAULTS };

  if (globalConfig) {
    merged = merge(
      merged as unknown as Record<string, unknown>,
      globalConfig as unknown as Record<string, unknown>,
    ) as unknown as PlannarConfig;
  }

  if (localConfig) {
    merged = merge(
      merged as unknown as Record<string, unknown>,
      localConfig as unknown as Record<string, unknown>,
    ) as unknown as PlannarConfig;
  }

  return applyDerivedDefaults(merged, {
    exportsFolder: Boolean(localConfig?.exportsFolder || globalConfig?.exportsFolder),
    globalCss: Boolean(localConfig?.globalCss || globalConfig?.globalCss),
  });
}

export function resolvePath(cwd: string, configPath: string): string {
  return resolve(cwd, configPath);
}
