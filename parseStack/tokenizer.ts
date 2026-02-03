import { ConstructorOf } from "../../utils/ConstructorOf";
import {
  ContentTokenType,
  EnclosingTokenType,
  grammar,
  pop,
  PopSymbol,
  root,
  RootSymbol,
  TokenType,
} from "../language";

export type Position = {
  index: number;
  line: number;
  column: number;
  newLineInfo?: {
    count: number;
    lastLength: number;
  };
};

export class Token {
  public constructor(
    public type: TokenType,
    public content: string,
    public position: Position
  ) {}

  get endPosition() {
    return calculateEndPosition(this);
  }
}

// fix typing
export type TokenInfo<TokenTypes extends string, RuleNames extends string> = {
  match: RegExp;
  type: TokenTypes | ConstructorOf<Token>;
  next?: RuleNames | PopSymbol;
  separated?: true;
};

export type RuleError = {
  error: string;
};

export type ExtendsDirective<RuleNames extends string> = {
  extends: RuleNames | RootSymbol;
};

export type TokenizationRule<
  TokenTypes extends string,
  RuleNames extends string
> = TokenInfo<TokenTypes, RuleNames> | ExtendsDirective<RuleNames> | RuleError;

export type TokenizationRules<
  TokenTypes extends string,
  RuleNames extends string
> = TokenizationRule<TokenTypes, RuleNames>[];

export type TokenizationGrammar<TokenTypes extends string> = {
  [root]: TokenizationRules<TokenTypes, string>;
  [key: string]: TokenizationRules<TokenTypes, string>;
};

export function calculateEndPosition(token: Token): Position {
  const position = { ...token.position };
  if (token.position.newLineInfo) {
    position.column = token.position.newLineInfo.lastLength + 1;
    position.line += token.position.newLineInfo.count;
  } else {
    position.column += token.content.length;
  }
  return position;
}

export class Tokenizer {
  private tokens!: Token[];
  private position!: Position;
  private text!: string;
  private stack: string[] = [];

  private clonePosition() {
    return { ...this.position };
  }

  private hasChars() {
    return this.position.index < this.text.length;
  }

  #get() {
    return this.text[this.position.index++];
  }

  #hasTokens() {
    return this.tokens.length != 0;
  }

  private pushToken(token: Token, separated: boolean = false) {
    this.updatePosition(token.position, token.content.length);
    // Jeżeli zgadzają się typy, to łączymy tokeny
    if (!separated) {
      const lastToken = this.#lastToken();
      if (
        lastToken &&
        lastToken.type == token.type /** tmp */ &&
        token.position
      ) {
        lastToken.content += token.content;
        if (lastToken.position.newLineInfo) {
          if (token.position.newLineInfo) {
            lastToken.position.newLineInfo.count +=
              token.position.newLineInfo.count;
            lastToken.position.newLineInfo.lastLength =
              token.position.newLineInfo.lastLength;
          }
        } else {
          lastToken.position.newLineInfo = token.position.newLineInfo;
        }

        return;
      }
    }

    this.tokens.push(token);
  }

  #lastToken() {
    return this.tokens[this.tokens.length - 1];
  }

  private updatePosition(position: Position, length: number): void {
    this.position.index += length;
    this.position.column += length;
    if (position.newLineInfo) {
      this.position.column = position.newLineInfo.lastLength + 1;
      this.position.line += position.newLineInfo.count;
    }
  }

  private matchToken(
    regexp: RegExp,
    tokenType: TokenType | ConstructorOf<Token>,
    next?: string | PopSymbol,
    separated: boolean = false
  ): boolean {
    const fromLineStartRegexp = new RegExp(`^${regexp.source}`, regexp.flags);
    const substring = this.text.substring(this.position.index);
    const match = fromLineStartRegexp.exec(substring);
    if (match) {
      const position = this.clonePosition();
      const content = match[0];
      let token!: Token;
      if (typeof tokenType != "string") {
        token = new tokenType(content, position);
      } else {
        token = new Token(tokenType, content, position);
      }

      let lastIndexOf = content.indexOf("\n");
      let newLineCount = 0;
      if (lastIndexOf != -1) {
        newLineCount++;
        while (true) {
          const nextIndexOf = content.indexOf("\n", lastIndexOf + 1);
          if (nextIndexOf == -1) {
            break;
          }
          lastIndexOf = nextIndexOf;
          newLineCount++;
        }
      }

      if (lastIndexOf != -1) {
        position.newLineInfo = {
          count: newLineCount,
          lastLength: content.length - lastIndexOf - 1,
        };
      }
      this.pushToken(token, separated);
      if (next) {
        if (next == pop) {
          this.stack.pop();
        } else {
          this.stack.push(next);
        }
      }
      return true;
    }
    return false;
  }

  private matchRule(
    grammar: TokenizationGrammar<TokenType>,
    rule: TokenizationRule<TokenType, string>
  ) {
    if ("extends" in rule) {
      return this.matchKey(grammar, rule.extends);
    } else if ("error" in rule) {
      throw new Error(`${rule.error} (with stack ${this.stack.join(", ")})`);
    } else {
      return this.matchToken(rule.match, rule.type, rule.next, rule.separated);
    }
  }
  private matchKey(
    grammar: TokenizationGrammar<TokenType>,
    key: string | RootSymbol
  ) {
    const rules = grammar[key];
    if (!rules) throw new Error(`Rules for ${String(key)} not found`);
    for (const rule of rules) {
      if (this.matchRule(grammar, rule)) return true;
    }
    return false;
  }
  private matchGrammar(grammar: TokenizationGrammar<TokenType>): void {
    const key = this.stack[this.stack.length - 1] ?? root;
    const result = this.matchKey(grammar, key);
    if (!result) {
      console.debug(
        `Nie udało się rozwiązać klucza ${String(key)} znakiem ${
          this.text[this.position.index]
        } (stos: [${this.stack.join(" ")}])`
      );
      this.matchToken(/./s, TokenType.InvalidToken);
    }
  }

  tokenize(text: string) {
    this.text = text;
    this.tokens = [];
    this.position = {
      index: 0,
      column: 1,
      line: 1,
    };
    this.stack = [];
    while (this.hasChars()) this.nextToken();
    return this.tokens;
  }

  public static rules = {};
  /** rules */
  /** main function when we dont know  */
  public nextToken() {
    this.matchGrammar(grammar);
  }
}
