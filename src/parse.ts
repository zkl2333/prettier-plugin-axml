// parse.ts

import { parseDocument } from "htmlparser2";

export default function parse(text: string) {
  const dom = parseDocument(text, {
    xmlMode: true,
    withStartIndices: true,
    withEndIndices: true
  });
  return dom;
}
