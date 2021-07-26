import { AstPath, ParserOptions, Doc } from "prettier";
import { PrintFn } from "./types";

function print(path: AstPath, _options: ParserOptions, _print: PrintFn) {
  const node = path.getValue();
  if (!node) return "";
  if (node.type === "root") {
    const children: Doc[] = [];
    path.each((childPath) => {
      children.push(childPath.call(_print));
    }, "children");
    return children;
  }
  if (Array.isArray(node)) {
    return path.map(_print);
  }
  // `text` and `tag` goes to embed.ts
  switch (node.type) {
    case "comment":
      return ["<!-- ", node.data.trim(), " -->"];
    default:
      throw new Error(`Unknown htmlparser2 type: ${node.type}`);
  }
}
export default print;
