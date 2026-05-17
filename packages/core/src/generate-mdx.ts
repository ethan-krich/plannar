import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compile, type CompileOptions } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkStateBind } from "./plugins/remark-state-bind.js";

export async function generateMdx(
  filepath: string,
  options: CompileOptions & { content?: string } = {},
): Promise<string> {
  const { content, ...mdxOptions } = options;
  const absolutePath = resolve(filepath);
  const value = content ?? (await readFile(absolutePath, "utf-8"));

  const result = await compile(
    { value, path: absolutePath },
    {
      development: false,
      ...mdxOptions,
      remarkPlugins: [remarkStateBind, remarkGfm, ...(mdxOptions.remarkPlugins ?? [])],
      rehypePlugins: [
        rehypePrettyCode,
        rehypeAutolinkHeadings,
        ...(mdxOptions.rehypePlugins ?? []),
      ],
    },
  );

  return String(result.value);
}
