import { Options, FastPath, Doc } from 'prettier';
export interface Concat {
    type: 'concat';
    parts: Doc[];
}
export interface Fill {
    type: 'fill';
    parts: Doc[];
}
export interface Line {
    type: 'line';
    hard: boolean;
}
export declare type PrintFn = (path: FastPath) => Doc;
export declare type TextToDoc = (text: string, options: Options) => Doc;
export declare type TemplateTokens = ['text' | 'expression', string, number, number][];