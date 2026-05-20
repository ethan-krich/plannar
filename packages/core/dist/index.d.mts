import { CompileOptions } from "@mdx-js/mdx";

//#region src/plugins/meta.d.ts
interface BindingMeta {
  /** Prop that receives the current state value — e.g. 'value', 'checked' */
  valueProp: string;
  /** Prop/callback that fires on change — e.g. 'onChange', 'onValueChange' */
  changeProp: string;
  /**
   * Expression that extracts the value from the change event.
   * Direction: callback arg → state.
   * String form is inlined directly, e.g. 'e.target.value'.
   */
  extract: string;
  /**
   * Optional inverse transform from state → prop shape.
   * When omitted, state is passed directly as valueProp.
   * String form is inlined, with `v` replaced by the state name.
   */
  inject?: string;
}
//#endregion
//#region src/generate-mdx.d.ts
interface GenerateMdxOptions extends CompileOptions {
  content?: string;
  bindings?: Record<string, BindingMeta>;
}
declare function generateMdx(filepath: string, options?: GenerateMdxOptions): Promise<string>;
//#endregion
//#region src/plugins/remark-state-bind.d.ts
interface AstNode {
  type: string;
  children?: AstNode[];
  data?: any;
  [key: string]: any;
}
declare const remarkStateBind: (options?: {
  bindings?: Record<string, BindingMeta>;
}) => (tree: AstNode) => void;
//#endregion
//#region src/plugin.d.ts
declare function mdxPlugin(options?: { bindings?: Record<string, BindingMeta> }): {
  name: string;
  load(id: string): Promise<string | undefined>;
};
//#endregion
export { type BindingMeta, type GenerateMdxOptions, generateMdx, mdxPlugin, remarkStateBind };
