import prettier, { Plugin } from "prettier";
import embed from "./embed";
import parse from "./parse";
import print from "./print";

function locStart(node: any): number {
  return node.startIndex;
}

function locEnd(node: any): number {
  return node.endIndex;
}

const options: Plugin<any>["options"] = {
  axmlBracketSameLine: {
    name: "axmlBracketSameLine",
    category: "Global",
    type: "boolean",
    default: false,
    description: "Put the `>` of a multiline AXML element on a new line",
    since: "1.0.0"
  },
  axmlBracketSpacing: {
    name: "axmlBracketSpacing",
    category: "Global",
    type: "boolean",
    default: false,
    description: "Print spaces between brackets(`{{}}`) in AXML expressions",
    since: "1.0.0"
  }
};

// We're going to be using the bracketSameLine option, but since it wasn't
// introduced until prettier 2.4.0, we need to add it to our list of options if
// it's not present so that it gets respected.
if (
  !prettier
    .getSupportInfo()
    .options.some((opt) => opt.name === "bracketSameLine")
) {
  options.bracketSameLine = {
    type: "boolean",
    category: "Global",
    default: false,
    description:
      "Put > of opening tags on the last line instead of on a new line.",
    since: "1.0.0"
  };
}

const plugin: Plugin = {
  options,
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
      print,
      embed
    }
  }
};

module.exports = plugin;
