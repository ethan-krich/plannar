import type { BindingMeta } from "./types.js";

/**
 * Built-in HTML element bindings.
 * Keys are element name, or `element:type` for inputs with a type attribute.
 */
export const htmlBindings: Record<string, BindingMeta> = {
  input: {
    valueProp: "value",
    changeProp: "onChange",
    extract: "e.target.value",
  },
  "input:checkbox": {
    valueProp: "checked",
    changeProp: "onChange",
    extract: "e.target.checked",
  },
  "input:number": {
    valueProp: "value",
    changeProp: "onChange",
    extract: "e.target.valueAsNumber",
  },
  textarea: {
    valueProp: "value",
    changeProp: "onChange",
    extract: "e.target.value",
  },
  select: {
    valueProp: "value",
    changeProp: "onChange",
    extract: "e.target.value",
  },
};
