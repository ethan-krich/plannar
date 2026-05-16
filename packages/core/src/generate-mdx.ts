import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compile, type CompileOptions } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkStateBind } from "./plugins/remark-state-bind.js";

export async function generateMdx(filepath: string, options: CompileOptions = {}): Promise<string> {
  const absolutePath = resolve(filepath);
  const content = await readFile(absolutePath, "utf-8");

  const result = await compile(
    { value: content, path: absolutePath },
    {
      development: false,
      ...options,
      remarkPlugins: [remarkStateBind, remarkGfm, ...(options.remarkPlugins ?? [])],
      rehypePlugins: [rehypePrettyCode, rehypeAutolinkHeadings, ...(options.rehypePlugins ?? [])],
    },
  );

  return String(result.value);
}
