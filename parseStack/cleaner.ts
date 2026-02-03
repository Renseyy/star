import { ArrayReader } from "../../utils/ArrayReader";
import { arr } from "../../utils/LazyArray";
import {
  BraceRangeSettings,
  braces,
  irrelevantTokensFilter,
  lineSeparatorEaters,
  TokenType,
  trimmableTypes,
} from "../language";
import { Token } from "./tokenizer";

export type CleanerError = {
  from: Token;
  to: Token;
  message: string;
};

// Dzieli program na bloki, co pozwala na leprzą normalizację i wykrywanie błędów
export class Cleaner {
  private static cleanBracement(
    reader: ArrayReader<Token>,
    endType: TokenType[],
    braceRangeSettings: BraceRangeSettings,
    errors: CleanerError[]
  ): Token[] {
    let done = false;
    const tokens: Token[] = [];
    const openingMap = braces.reduce(
      (p, c) => ({
        [c.start]: {
          end: arr(c.end),
          settings: c.settings,
        },
        ...p,
      }),
      {} as {
        [key: string]: {
          end: TokenType[];
          settings: BraceRangeSettings;
        };
      }
    );
    const closingBraces = braces
      .map((brace) => arr(brace.end))
      .reduce((p, c) => [...p, ...c], []);
    for (const token of reader) {
      const lastToken = tokens[tokens.length - 1];
      if (
        (!lastToken || trimmableTypes.includes(lastToken.type as any)) &&
        trimmableTypes.includes(token.type as any)
      ) {
        console.log("trimmed", token);
        continue;
      }
      const lastTokenType: TokenType = tokens[tokens.length - 1]?.type;
      if (
        lastTokenType &&
        lineSeparatorEaters.after.includes(lastTokenType as any) &&
        token.type == TokenType.LineSeparator
      ) {
        continue;
      }
      if (endType?.includes(token.type)) {
        if (braceRangeSettings.trim) {
          while (
            tokens.length > 0 &&
            trimmableTypes.includes(tokens[tokens.length - 1].type as any)
          ) {
            tokens.pop();
          }
        }
        tokens.push(token);
        done = true;
        break;
      }
      if (token.type in openingMap) {
        const element = openingMap[token.type];
        tokens.push(
          token,
          ...this.cleanBracement(reader, element.end, element.settings, errors)
        );
      } else if (closingBraces.includes(token.type)) {
        errors.push({
          from: token,
          to: token,
          message: `Unexpected token of type ${token.type} at position ${token.position.line}:${token.position.column}, expecting ${endType}`,
        });
        continue;
      } else {
        tokens.push(token);
      }
    }
    if (braceRangeSettings.trim) {
      while (
        tokens.length > 0 &&
        trimmableTypes.includes(tokens[tokens.length - 1].type as any)
      ) {
        tokens.pop();
      }
    }
    if (braceRangeSettings.disableEmptySet) {
      if (tokens.length == 0) {
        throw new Error(`Unexpected empty set`);
      }
    }

    // if (!done && endType.length > 0) {
    //   const lastToken = tokens[tokens.length - 1];
    //   errors.push({
    //     from: lastToken,
    //     to: lastToken,
    //     message: `Unexpected end of input, expecting ${endType}`,
    //   });
    // }
    return tokens as Token[];
  }
  public static clean(tokens: Token[]): {
    tokens: Token[];
    errors: CleanerError[];
  } {
    const reader = new ArrayReader(tokens, [irrelevantTokensFilter]);
    const errors: CleanerError[] = [];
    return {
      tokens: this.cleanBracement(reader, [], { trim: true }, errors),
      errors,
    };
  }
}
