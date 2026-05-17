import type { BindingMeta } from "./types.js";

/**
 * shadcn/ui component bindings for stateful two-way binding.
 *
 * Each key is the shadcn registry component name (lowercase), matching the
 * name used in `npx shadcn add <name>`.
 *
 * Elements with a `type` attribute are looked up as `name:type` first,
 * falling back to `name`. This mirrors the HTML binding lookup.
 */
export const shadcnBindings: Record<string, BindingMeta> = {
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
  "native-select": {
    valueProp: "value",
    changeProp: "onChange",
    extract: "e.target.value",
  },
  checkbox: {
    valueProp: "checked",
    changeProp: "onCheckedChange",
    extract: "e",
  },
  switch: {
    valueProp: "checked",
    changeProp: "onCheckedChange",
    extract: "e",
  },
  toggle: {
    valueProp: "pressed",
    changeProp: "onPressedChange",
    extract: "e",
  },
  slider: {
    valueProp: "value",
    changeProp: "onValueChange",
    extract: "e[0]",
    inject: "[v]",
  },
  select: {
    valueProp: "value",
    changeProp: "onValueChange",
    extract: "e",
  },
  "radio-group": {
    valueProp: "value",
    changeProp: "onValueChange",
    extract: "e",
  },
  tabs: {
    valueProp: "value",
    changeProp: "onValueChange",
    extract: "e",
  },
  accordion: {
    valueProp: "value",
    changeProp: "onValueChange",
    extract: "e",
  },
  dialog: {
    valueProp: "open",
    changeProp: "onOpenChange",
    extract: "e",
  },
  "alert-dialog": {
    valueProp: "open",
    changeProp: "onOpenChange",
    extract: "e",
  },
  sheet: {
    valueProp: "open",
    changeProp: "onOpenChange",
    extract: "e",
  },
  drawer: {
    valueProp: "open",
    changeProp: "onOpenChange",
    extract: "e",
  },
  popover: {
    valueProp: "open",
    changeProp: "onOpenChange",
    extract: "e",
  },
  "hover-card": {
    valueProp: "open",
    changeProp: "onOpenChange",
    extract: "e",
  },
  tooltip: {
    valueProp: "open",
    changeProp: "onOpenChange",
    extract: "e",
  },
  "dropdown-menu": {
    valueProp: "open",
    changeProp: "onOpenChange",
    extract: "e",
  },
  "context-menu": {
    valueProp: "open",
    changeProp: "onOpenChange",
    extract: "e",
  },
  collapsible: {
    valueProp: "open",
    changeProp: "onOpenChange",
    extract: "e",
  },
};
