import { FastPath, Doc, ParserOptions } from "prettier";
import { Concat, PrintFn, TextToDoc } from "./types";

import parser from "@babel/parser";
import prettier from "prettier";
import parseTemplate from "./parseTemplate";

const { concat, fill, line, group, indent, dedent, softline, hardline } =
  prettier.doc.builders;
const { mapDoc, stripTrailingHardline } = prettier.doc.utils;

function embed(
  path: FastPath,
  print: PrintFn,
  textToDoc: TextToDoc,
  options: ParserOptions
): Doc | null {
  const node = path.getValue();
  if (!node || !node.type) return null;
  switch (node.type) {
    case "text":
      const text = node.data;
      return parseAndPrintJSExpression(textToDoc, print, options)(text);
    case "tag":
      return printTags(textToDoc, print, options)(path);
    default:
      return null;
  }
}

function printTags(textToDoc: any, print: any, options: ParserOptions<any>) {
  return (path: {
    getValue: () => any;
    each: (
      arg0: (childPath: {
        getValue: () => any;
        call: (arg0: PrintFn) => any;
      }) => void,
      arg1: string
    ) => void;
  }) => {
    const node = path.getValue();
    const hasParent = !!node.parent;
    const hasChildren = node.children.length > 0;
    const children: prettier.doc.builders.Doc[] = [];
    path.each(
      (childPath: { getValue: () => any; call: (arg0: PrintFn) => any }) => {
        const child = childPath.getValue();
        if (
          child.type !== "text" ||
          (child.type === "text" && child.data.trim() !== "")
        ) {
          children.push(softline);
        }
        children.push(childPath.call(print));
      },
      "children"
    );
    const attributeKeys = Object.keys(node.attribs);
    const attributeTexts = attributeKeys.map((key) => {
      const value = node.attribs[key];
      const parts: any = [line, key];
      const forceNakedJSObject =
        (node.name === "template" && key === "data") ||
        (key === "style" &&
          typeof value === "string" &&
          value.trim().startsWith("{{"));
      if (value !== true) {
        parts.push(
          '="',
          parseAndPrintJSExpression(textToDoc, print, options)(
            value,
            forceNakedJSObject,
            true
          ),
          '"'
        );
      }
      return concat(parts);
    });
    const attributes =
      attributeKeys.length > 0
        ? group(
            concat([
              indent(concat(attributeTexts)),
              options.axmlBracketSameLine ? "" : hasChildren ? softline : ""
            ])
          )
        : "";
    const openingTagEnd = hasChildren ? ">" : concat([line, "/>"]);
    return group(
      concat([
        "<",
        node.name,
        attributes,
        openingTagEnd,
        indent(concat(children)),
        hasChildren ? concat([softline, "</", node.name, ">"]) : "",
        hasParent ? "" : softline
      ])
    );
  };
}
function parseAndPrintJSExpression(
  textToDoc: TextToDoc,
  _print: PrintFn,
  options: ParserOptions<any>
) {
  return (text: any, forceNakedJSObject = false, isAttribute = false) => {
    let spans = [["text", text, 0, text.length]];
    try {
      spans = parseTemplate(text);
    } catch {}
    const len = spans.length;
    if (!len || (len === 1 && !spans[0][1].trim())) {
      return concat([""]);
    }
    return group(
      concat(
        spans.map((span, index) => {
          const [type, data] = span.slice(0, 2);
          let str = data;
          // string literal
          if (type === "text") {
            // Keep whitespaces the same in attributes' TEXT
            if (isAttribute) return str;
            const parts = [];
            // Remove Element's first text child's leading whitespaces.
            // `<view>  abcd</view>` -> `<view>abcd</view>`
            if (index === 0) {
              str = str.trimStart();
            }
            // Remove Element's last text child's trailing whitespaces.
            // `<view>abcd   </view>` -> `<view>abcd</view>`
            // `<view>abcd\n   </view>` -> `<view>abcd</view>`
            // `<view>   \n \n  </view>` -> `<view></view>`
            if (index === len - 1) {
              str = str.trimEnd();
            }
            // Make sure to squash linebreaks and whitespaces
            str = str.replace(/[\s]+/g, " ");
            parts.push(
              concat(
                str.split(/(\n)/g).map((value: string) => {
                  if (value === "\n") return line;
                  return fill(
                    value
                      .split(/( )/g)
                      .map((segment: any, index: number) =>
                        index % 2 === 0 ? segment : line
                      )
                  );
                })
              )
            );
            return group(concat(parts));
          }
          // JS expression(or "naked" object expression)
          else if (type === "expression") {
            // Only do isNakedJSObject check for attributes, as a performance improvement
            let forceNaked = forceNakedJSObject;
            if (isAttribute) {
              forceNaked = forceNaked || isNakedJSObject(str);
            }
            const spacing = forceNaked
              ? ""
              : options.axmlBracketSpacing
              ? line
              : softline;
            return concat([
              "{{",
              indent(
                concat([
                  spacing,
                  forceNaked
                    ? printNakedJSObject(str, textToDoc, options)
                    : printJSExpression(str, textToDoc, options)
                ])
              ),
              spacing,
              "}}"
            ]);
          } else {
            return text;
          }
        })
      )
    );
  };
}
function printJSExpression(text: any, textToDoc: TextToDoc, options: any) {
  if (!text) return text;
  let doc = text;
  let comments: any = "";
  let expr;
  try {
    expr = parser.parseExpression(text);
  } catch {}
  if (!expr) return doc;
  if (expr.type === "StringLiteral") {
    return text.trim();
  }
  if (expr.leadingComments) {
    const leadingCommentsEnd =
      expr.leadingComments[expr.leadingComments.length - 1].end;
    // make coments a little prettier too
    comments = concat(
      text
        .slice(0, leadingCommentsEnd)
        .trim()
        .split("\n")
        .map((s: string) => concat([s.trim(), hardline]))
    );
    // remove leading comments, make it easier to remove prefix semi
    text = text.slice(leadingCommentsEnd + 1).trimStart();
  }
  doc = textToDoc(text, {
    parser: "babel",
    semi: false,
    singleQuote: true,
    trailingComma: "none",
    bracketSpacing: options.axmlBracketSpacing
  });
  // remove ASI-ed prefix semi
  doc = removePrefixSemi(doc);
  // remove redundant Doc
  doc = normalizeDoc(stripTrailingHardline(doc));
  // concat coments and the rest
  if (comments) {
    doc = concat([comments, doc]);
  }
  return doc;
}
// Texts that are NOT valid JS expressions.
//   - <template> tags's attribute `data` is an JS object whose wrapping `{}` are omitted.
//     - <template data="{{a: 'a', b: 'b'}}"></template>
//   - some builtin components' attribute `style` is an JS object whose wrapping `{}` are omitted.
//     - <view style="{{backgroundColor: 'red'}}" />
//   - custom components' whatever props
//     - <my-component someData="{{...data, a: 'a'}}" />
function printNakedJSObject(text: string, textToDoc: any, options: any) {
  if (!text) return text;
  let doc = printJSExpression("({" + text + "})", textToDoc, options);
  doc = removeObjectParens(doc, "(", ")");
  doc = removeObjectParens(doc, "{", "}");
  return dedent(doc);
}
// Basically everything inside `{{}}` could be "naked" JS objects...
function isNakedJSObject(text: string) {
  let node;
  try {
    node = parser.parseExpression("({" + text + "})");
  } catch {}
  return node ? node.type === "ObjectExpression" : false;
}
function removeObjectParens(doc: any, open: any, end: any): Doc {
  if (
    typeof doc !== "string" &&
    doc.type === "concat" &&
    doc.parts.length !== 0
  ) {
    const { parts } = doc;
    const firstPart = parts[0];
    const lastPart = parts[parts.length - 1];
    if (parts.length === 1) {
      return removeObjectParens(firstPart, open, end);
    }
    if (firstPart === open && lastPart === end) {
      return {
        type: "concat",
        parts: parts.slice(1, -1)
      };
    }
    return {
      type: "concat",
      parts: [
        removeObjectParens(firstPart, open, end),
        ...parts.slice(1, -1),
        removeObjectParens(lastPart, open, end)
      ]
    };
  } else if (typeof doc !== "string" && doc.type === "group") {
    return removeObjectParens(doc.contents, open, end);
  } else {
    return doc;
  }
}
// Remove prefix semi(via ASI) for formated JS expression
function removePrefixSemi(doc: any): Doc {
  if (
    typeof doc !== "string" &&
    doc.type === "concat" &&
    doc.parts.length !== 0
  ) {
    const { parts } = doc;
    const firstPart = parts[0];
    if (firstPart === ";") {
      return {
        type: "concat",
        parts: doc.parts.slice(1)
      };
    }
    return {
      type: "concat",
      parts: [removePrefixSemi(firstPart), ...doc.parts.slice(1)]
    };
  }
  return doc;
}
// from prettier 2.1.0-dev
function normalizeParts(parts: any[]) {
  const newParts = [];
  const restParts = parts.filter(Boolean);
  while (restParts.length !== 0) {
    const part = restParts.shift();
    if (!part) {
      continue;
    }
    if (typeof part !== "string" && part.type === "concat") {
      restParts.unshift(...part.parts);
      continue;
    }
    if (
      newParts.length !== 0 &&
      typeof newParts[newParts.length - 1] === "string" &&
      typeof part === "string"
    ) {
      newParts[newParts.length - 1] += part;
      continue;
    }
    newParts.push(part);
  }
  return newParts;
}
// from prettier 2.1.0-dev
function normalizeDoc(doc: any) {
  return mapDoc(doc, (currentDoc: any) => {
    if (
      typeof currentDoc === "string" ||
      !["concat", "fill"].includes(currentDoc.type)
    ) {
      return currentDoc;
    }
    if (!currentDoc.parts) {
      return currentDoc;
    }
    return {
      ...currentDoc,
      parts: normalizeParts(currentDoc.parts)
    };
  });
}

export default embed;
