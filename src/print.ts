import prettier from "prettier";
import { FastPath, Doc, ParserOptions } from "prettier";
import { PrintFn } from "./types";

const { concat } = prettier.doc.builders;
function print(path: FastPath, _options: ParserOptions, _print: PrintFn): Doc {
  const node = path.getValue();
  if (!node) return "";
  if (Array.isArray(node)) {
    return concat(path.map(_print));
  }
  // `text` and `tag` goes to embed.ts
  switch (node.type) {
    case "comment":
      return concat(["<!-- ", node.data.trim(), " -->"]);
    default:
      throw new Error(`Unknown htmlparser2 type: ${node.type}`);
  }
}
export default print;
