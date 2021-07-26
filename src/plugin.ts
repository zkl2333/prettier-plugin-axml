import type { Plugin } from "prettier";
import { FastPath, Doc, ParserOptions, doc } from "prettier";
import embed from "./embed";
import parse from "./parse";
import print from "./print";
const { concat, group, indent, join, line, softline } = doc.builders;

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
      // If you're using VS Code with prettier extension installed, enjoy!
      // Note you have to install an `xml` or `axml` VS Code extension first.
      vscodeLanguageIds: ["xml", "axml"]
    }
  ],
  parsers: {
    axml: {
      parse,
      locStart,
      locEnd,
      // 为 ast 格式命个名，后面会用到
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

export = plugin;
