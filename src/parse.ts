// parse.ts

import { parseDOM } from "htmlparser2";
import { Node } from "domhandler";

export default function parse(text: string): Node[] {
  const dom = parseDOM(text, {
    xmlMode: true,
    withStartIndices: true,
    withEndIndices: true
  });
  return dom;
}
