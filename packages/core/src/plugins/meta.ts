export interface BindingMeta {
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
