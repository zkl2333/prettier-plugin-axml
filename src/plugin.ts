import type { Plugin } from "prettier";
import embed from "./embed";
import parse from "./parse";
import print from "./print";

function locStart(node: any): number {
  return node.startIndex;
}

function locEnd(node: any): number {
  return node.endIndex;
}

const plugin: Plugin = {
  languages: [
    {
      name: "axml",
      parsers: ["axml"],
      extensions: [".axml"],
      vscodeLanguageIds: ["xml", "axml"]
    }
  ],
  parsers: {
    axml: {
      parse,
      locStart,
      locEnd,
      astFormat: "axml-ast"
    }
  },
  printers: {
    "axml-ast": {
      print: print,
      embed: embed
    }
  },
  defaultOptions: {
    printWidth: 80,
    tabWidth: 2
  }
};

module.exports = plugin;
