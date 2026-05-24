import { docs } from "../../.source";
import { loader } from "fumadocs-core/source";

const src = docs.toFumadocsSource();
const getFiles = src.files as unknown;

export const source = loader({
  baseUrl: "/docs",
  source: {
    files: typeof getFiles === "function" ? getFiles() : getFiles,
  } as unknown as typeof src,
});
