import * as monaco from "monaco-editor";

import Parser from "./parseStack/parser.ts";
import { Tokenizer, Token } from "./parseStack/tokenizer.ts";
import { Cleaner } from "./parseStack/cleaner.ts";
import { RangedError } from "./RangedError.ts";
import { listen } from "../utils/event.ts";
import { Environment } from "./Environment.ts";
import { RangedHint, RangedHintType } from "./RangedHint.ts";
import { DataTypes } from "./DataType/DataTypes.ts";

export class StarEditor {
  private tokenizer = new Tokenizer();
  private parser = new Parser();

  private tokens: Token[] = [];
  private decorationsCollection: monaco.editor.IEditorDecorationsCollection;

  // private inlayHintsProvider: monaco.languages.InlayHintsProvider

  constructor(private editor: monaco.editor.IEditor) {
    this.decorationsCollection = this.editor.createDecorationsCollection([]);
  }

  private setMarkers(
    model: monaco.editor.ITextModel,
    markers: monaco.editor.IMarkerData[]
  ) {
    monaco.editor.setModelMarkers(model, "owner", markers);
  }

  parseCode(code: string, editor: monaco.editor.ICodeEditor) {
    const tokens = this.tokenizer.tokenize(code);
    const { tokens: cleanedTokens, errors } = Cleaner.clean(tokens);
    this.tokens = cleanedTokens;
    const ast = this.parser.parse(this.tokens);
    const parsedCode = ast;
    const environment = new Environment();
    environment.setElement("Integer", DataTypes.Some(DataTypes.Integer));
    environment.setElement("String", DataTypes.Some(DataTypes.String));
    const [typingErrors, typedCode] = listen(() => ast?.getType(environment));
    console.log("TypeChecked: ", typedCode);
    console.log("Errors: ", environment);
    const markers: monaco.editor.IMarkerData[] = [];
    const allErrors: (Error | RangedHint)[] = [
      ...this.parser.errors,
      ...typingErrors,
    ];
    const monacoDecorations: monaco.editor.IModelDeltaDecoration[] = [];
    for (const error of allErrors) {
      console.error(error);
      if (error instanceof RangedError) {
        // monacoDecorations.push({
        //   range: error.range.toMonacoRange(),
        //   options: {
        //     inlineClassName: "errorDecoration",
        //     hoverMessage: { value: error.message },
        //   },
        // });
        markers.push({
          message: error.message,
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: error.range.start.line,
          startColumn: error.range.start.column,
          endLineNumber: error.range.end.line,
          endColumn: error.range.end.column,
          code: {
            target: monaco.Uri.parse(
              `swid:manu/errors/${error.code}#some_instance`
            ),
            value: error.code ?? "more",
          },
        });
      } else if (error instanceof RangedHint) {
        if (error.type == RangedHintType.typeClarification) {
          monacoDecorations.push({
            range: error.range.toMonacoRange(),
            options: {
              inlineClassName: "typeClarificationDecoration",
              hoverMessage: { value: error.content },
            },
          });
        } else if (error.type == RangedHintType.hover) {
          monacoDecorations.push({
            range: error.range.toMonacoRange(),
            options: {
              hoverMessage: { value: error.content },
            },
          });
        }
      } else {
        console.error(error);
      }
    }
    console.log(monacoDecorations);
    this.decorationsCollection.set(monacoDecorations);
    this.setMarkers(editor.getModel()!, markers);

    console.log("AST: ", ast);

    return {
      cleanedTokens,
      parsedCode,
      typedCode,
      typeContext: environment,
      errors: allErrors,
    };
  }
}
