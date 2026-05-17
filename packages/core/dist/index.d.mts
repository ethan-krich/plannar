import { CompileOptions } from "@mdx-js/mdx";

//#region src/generate-mdx.d.ts
declare function generateMdx(
  filepath: string,
  options?: CompileOptions & { content?: string },
): Promise<string>;
//#endregion
//#region src/plugins/remark-state-bind.d.ts
interface AstNode {
  type: string;
  children?: AstNode[];
  data?: any;
  [key: string]: any;
}
declare const remarkStateBind: () => (tree: AstNode) => void;
//#endregion
//#region src/plugin.d.ts
declare const mdxPlugin: {
  name: string;
  transform(code: string, id: string): Promise<{ code: string; map: null } | undefined> | undefined;
};
//#endregion
export { generateMdx, remarkStateBind, mdxPlugin };
