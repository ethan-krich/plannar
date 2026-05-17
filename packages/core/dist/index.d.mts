import { CompileOptions } from "@mdx-js/mdx";

//#region src/generate-mdx.d.ts
declare function generateMdx(filepath: string, options?: CompileOptions): Promise<string>;
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
export { generateMdx, remarkStateBind };
