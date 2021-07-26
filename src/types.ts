import { Options, AstPath, Doc, ParserOptions } from "prettier";
export interface AxmlOptions extends ParserOptions<any> {
  axmlBracketSameLine: boolean;
  axmlBracketSpacing: boolean;
}
export interface Concat {
  type: "concat";
  parts: Doc[];
}
export interface Fill {
  type: "fill";
  parts: Doc[];
}
export interface Line {
  type: "line";
  hard: boolean;
}
export declare type PrintFn = (path: AstPath) => Doc;
export declare type TextToDoc = (text: string, options: Options) => Doc;
export declare type TemplateTokens = [
  "text" | "expression",
  string,
  number,
  number
][];
