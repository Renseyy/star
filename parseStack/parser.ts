import { editor, IMarkdownString, Range as MonacoRange } from "monaco-editor";
import { cast } from "../../utils/as.ts";
import { printOr } from "../../utils/string.ts";
import {
  InfixOperatorField,
  OperatorPrecedenceGroups,
  operators,
  TokenType,
  WithResolver,
} from "../language.ts";
import { ContentToken, Position, Token } from "./tokenizer.ts";
import { IExpression } from "../expression/IExpression.ts";
import { IdentifierExpression } from "../expression/IdentifierExpression.ts";
import { IntegerLiteralExpression } from "../expression/IntegerLiteralExpression.ts";
import { BuilderExpression } from "../expression/BuilderExpression.ts";
import { BlockExpression } from "../expression/BlockExpression.ts";
import { BinaryOperator } from "../expression/BinaryOperator.ts";
import { UnaryOperator } from "../expression/UnaryOperator.ts";
import { go } from "../../utils/go.ts";
import { lastMapOr } from "../../utils/LazyArray.ts";
import { StringLiteralExpression } from "../expression/StringLiteralExpression.ts";
import { SubclassOf } from "../../utils/types.ts";
import { RangedError } from "../RangedError.ts";
import { GroupExpression } from "../expression/GroupExpression.ts";
import { CallExpression } from "../expression/CallExpression.ts";

export class Range {
  constructor(public start: Position, public end: Position) {}

  toMonacoRange(): MonacoRange {
    return new MonacoRange(
      this.start.line,
      this.start.column,
      this.end.line,
      this.end.column
    );
  }
}

export class ParserError extends RangedError {
  public uuid = crypto.randomUUID();
  constructor(public message: string, start: Position, end: Position = start) {
    super(message, new Range(start, end));
  }
}

export class EndOfTokensError extends ParserError {}
export type Decoration =
  | {
      startToken: Token;
      endToken: Token;
      message: IMarkdownString;
      type: string;
    }
  | {
      type: "TypeHint";
      beforeToken: Token;
      content: string;
    };

/**
 * After error parser will go to next end token and show this as error, so this is some recovery option, like in tokenizer and cleaner
 */

export type ParsingContext = {
  isType: boolean;
};

export type InfixOperatorFieldInfo = Prettify<
  | {
      bindingPower: number;
    } & (
      | {
          type: "simple";
          bindingPower: number;
        }
      | {
          type: "construction";
          constructor: SubclassOf<BinaryOperator>;
          additionalArguments: any[];
          bindingPower: number;
        }
      | {
          type: "function";
          resolver: (
            operator: Token,
            left: IExpression,
            parser: Parser
          ) => BinaryOperator;
        }
    )
>;

export function parseInfixOperatorField(
  infixOperatorField: InfixOperatorField
): InfixOperatorFieldInfo {
  if (Array.isArray(infixOperatorField)) {
    const copy = infixOperatorField.slice();
    const bindingPower: number = copy.shift();
    const resolvant: SubclassOf<BinaryOperator> | WithResolver = copy.shift();
    if (resolvant == WithResolver) {
      return {
        bindingPower: bindingPower,
        type: "function",
        resolver: copy.shift(),
      };
    } else {
      return {
        bindingPower: bindingPower,
        type: "construction",
        constructor: resolvant,
        additionalArguments: copy,
      };
    }
  } else
    return {
      bindingPower: infixOperatorField,
      type: "simple",
    };
}

export default class Parser {
  constructor() {}
  decorations: Decoration[] = [];
  tokens!: Token[];
  currentTokenIndex: number = 0;
  public errors: ParserError[] = [];

  private throwError(error: ParserError) {
    this.errors.push(error);
    throw error;
  }

  // Returns last position or { line: 1, column: 1 }
  private getLastPosition() {
    return lastMapOr(this.tokens, (token) => token.position, {
      index: -1,
      line: 1,
      column: 1,
    });
  }

  // Uruchamiając te funkcję możemy założyć, że jakiś token jest w tokens
  public getCurrentToken(): Token {
    let token = this.tokens[this.currentTokenIndex];
    if (!token) {
      throw this.throwError(
        new ParserError("Unexpected end of input", this.getLastPosition())
      );
    }
    return token;
  }

  private getFirstToken(): Token {
    return this.tokens[0];
  }

  private getLastToken(): Token {
    return this.tokens[this.tokens.length - 1];
  }

  public getCurrentPosition(): Position {
    return cast<ContentToken>(this.getCurrentToken()).position;
  }

  public expect<T extends Token>(...tokenTypes: TokenType[]): T {
    const token = this.assert(...tokenTypes);
    this.eat();
    return token as T;
  }

  public assert(...tokenTypes: TokenType[]): Token {
    if (this.is(...tokenTypes)) {
      return this.getCurrentToken();
    }
    const currentToken = this.getCurrentToken();
    throw this.throwError(
      new ParserError(
        `Expected ${printOr(tokenTypes)} but got ${currentToken.type}`,
        currentToken.position,
        currentToken.endPosition
      )
    );
  }

  public expectBeforeBegin() {
    if (this.currentTokenIndex > -1) {
      throw this.throwError(
        new ParserError(
          "Expected to be at the beginning of input",
          this.getFirstToken().position
        )
      );
    }
    this.eat();
  }

  public assertAfterEnd() {
    if (this.currentTokenIndex < this.tokens.length) {
      throw this.throwError(
        new ParserError(
          "Expected to be after end of input",
          this.getLastToken().position
        )
      );
    }
  }

  public is(...tokenTypes: TokenType[]): boolean {
    const token = this.getCurrentToken();
    return tokenTypes.includes(token.type as TokenType);
  }

  private checker(...tokenTypes: TokenType[]) {
    return () => this.is(...tokenTypes);
  }

  public eat() {
    this.currentTokenIndex++;
  }

  public omit(...tokenTypes: TokenType[]): number {
    let omitted = 0;
    let token = this.getCurrentToken();
    while (token && tokenTypes.includes(token.type as TokenType)) {
      this.currentTokenIndex++;
      token = this.getCurrentToken();
      omitted++;
    }
    return omitted;
  }

  public hasToken(): boolean {
    return this.currentTokenIndex < this.tokens.length;
  }

  public parseBlock(context: ParsingContext): BlockExpression {
    const startToken = this.expect(TokenType.BlockStart) as ContentToken;
    const expressions = this.parseInner(context, () =>
      this.is(TokenType.BlockEnd)
    ) as ContentToken;
    const endToken = this.expect(TokenType.BlockEnd);
    return new BlockExpression(startToken, endToken, expressions);
  }

  private parseGroup(context: ParsingContext): GroupExpression {
    const startToken = this.expect(TokenType.GroupStart);
    const expressions = this.parseInner(
      context,
      () => this.is(TokenType.GroupEnd),
      TokenType.Comma
    );
    const endToken = this.expect(TokenType.GroupEnd);
    return new GroupExpression(startToken, endToken, expressions);
  }

  private parseIndexer(): Group {
    this.expect(TokenType.IndexerStart);
    const expressions = this.parseInner(
      this.checker(TokenType.IndexerEnd, TokenType.Comma)
    );
    this.expect(TokenType.IndexerEnd);
    return {
      type: "Group",
      positionalElements: expressions,
      namedElements: [],
    };
  }

  private parseMaybePrefixOperator(): null | IExpression {
    const token = this.getCurrentToken() as ContentToken;
    const prefixOperator = operators.prefix[token.type];
    if (prefixOperator) {
      const precedence = prefixOperator;
      this.eat();
      const operand = this.parseExpression({ isType: false }, precedence);
      return new UnaryOperator(token, operand, true);
    } // Ad support for atoms
    return null;
  }

  public returnWithIncrement<T extends IExpression>(expression: T): T {
    this.currentTokenIndex++;
    return expression;
  }

  public parseElement(context: ParsingContext): IExpression {
    const prefix = this.parseMaybePrefixOperator();
    if (prefix) return prefix;

    let currentToken = this.getCurrentToken();
    if (currentToken.type == TokenType.GroupStart) {
      return this.parseGroup(context);
    } else if (currentToken.type == TokenType.IntegerLiteral) {
      return this.returnWithIncrement(
        new IntegerLiteralExpression(currentToken)
      );
    } else if (currentToken.type == TokenType.AtomLiteral) {
      // FIX ATOMS
      return this.returnWithIncrement(
        new IntegerLiteralExpression(currentToken)
      );
    } else if (currentToken.type == TokenType.CharacterLiteral) {
      return this.returnWithIncrement(
        new StringLiteralExpression(currentToken)
      );
    } else if (currentToken.type == TokenType.StringLiteralQuote) {
      this.expect(TokenType.StringLiteralQuote);
      const texts = [];
      const interpolations = [];
      let token: Token;
      let firstIsInterpolation: boolean | null = null;
      while (true) {
        token = this.getCurrentToken();
        if (
          !this.is(
            TokenType.StringLiteralQuote,
            TokenType.StringLiteralContent,
            TokenType.StringLiteralInterpolationStart
          )
        ) {
          console.error("Unexpected token", token);
          this.throwTokenError(token, `Unexpected token "${token.type}"`);
        }
        if (token.type == TokenType.StringLiteralQuote) {
          break;
        } else if (token.type == TokenType.StringLiteralInterpolationStart) {
          if (firstIsInterpolation == null) firstIsInterpolation = true;
          this.currentTokenIndex++;
          interpolations.push(this.parseExpression({ isType: false }));
          this.expect(TokenType.StringLiteralInterpolationEnd);
        } else if (token.type == TokenType.StringLiteralContent) {
          if (firstIsInterpolation == null) firstIsInterpolation = false;
          texts.push(token.content);
          this.eat();
        }
      }
      const endToken = this.expect(TokenType.StringLiteralQuote);
      if (interpolations.length == 0) {
        return new StringLiteralExpression(
          currentToken,
          endToken,
          texts.join("")
        );
      }
      return {
        type: "StringTemplate",
        texts,
        interpolations,
        firstIsInterpolation: firstIsInterpolation as boolean,
        startToken: currentToken,
        endToken,
      };
    } else if (currentToken.type == TokenType.Identifier) {
      return this.returnWithIncrement(
        new IdentifierExpression(currentToken, context.isType)
      );
    } else if (currentToken.type == TokenType.IfKeyword) {
      this.eat();
      const condition = this.parseExpression({ isType: false });
      const token = this.assert(
        TokenType.BlockStart,
        TokenType.ThenKeyword
      ) as Token;
      if (token.type == TokenType.BlockStart) {
        const block = this.parseBlock(context);
        return {
          type: "IfExpression",
          condition,
          then: block,
          else: null,
        };
      } else {
        this.eat();
        const then = this.parseExpression({ isType: false });
        return {
          type: "IfExpression",
          condition,
          then,
          else: null,
        };
      }
    } else if (currentToken.type == TokenType.BlockStart) {
      return this.parseBlock(context);
    } else if (currentToken.type == TokenType.IndexerStart) {
      return this.parseIndexer();
    }
    this.throwError(
      new ParserError(
        `Unexpected token "${currentToken.type}"`,
        currentToken.position,
        currentToken.endPosition
      )
    );
  }
  /**
   * @mutates elements
   */

  public parseExpression(
    context: ParsingContext,
    leftBindingPower: number = OperatorPrecedenceGroups.Maximum
  ): IExpression {
    let left = this.parseElement(context);
    console.log(left);
    while (this.shouldParseInfixOrPostfix()) {
      const token = this.getCurrentToken();
      // Groups
      if (
        token.type == TokenType.BlockStart &&
        OperatorPrecedenceGroups.Minimum < leftBindingPower
      ) {
        const right = this.parseBlock(context);
        left = new BuilderExpression(left, right);
        continue;
      } else if (
        /* !token.skipped && */
        token.type == TokenType.IndexerStart &&
        OperatorPrecedenceGroups.Minimum < leftBindingPower
      ) {
        const right = this.parseIndexer();
        left = {
          type: "IndexerExpression",
          what: left,
          arguments: right,
        };
        continue;
      } else if (
        /* !token.skipped && */
        token.type == TokenType.GroupStart &&
        OperatorPrecedenceGroups.MemberOperator < leftBindingPower
      ) {
        const parameters = this.parseGroup(context);
        left = new CallExpression(left, parameters, token, parameters.endToken);
        continue;
      }
      const postfixOperator: number | null =
        (operators.postfix as Record<string, any>)[String(token.type)] ?? null;
      if (postfixOperator != null) {
        if (postfixOperator < leftBindingPower) {
          left = new UnaryOperator(token, left, false);
          this.eat();
          continue;
        }
      }
      const infixOperator =
        operators.infix[String(token.type) as keyof typeof operators.infix] ??
        null;
      if (infixOperator != null) {
        const operatorFieldInfo = parseInfixOperatorField(infixOperator);
        const { bindingPower } = operatorFieldInfo;
        if (
          bindingPower < leftBindingPower ||
          (bindingPower == leftBindingPower &&
            operators.rightBinded.includes(token.type as any))
        ) {
          this.eat();
          if (operatorFieldInfo.type == "function") {
            left = operatorFieldInfo.resolver(token, left, this);
          } else {
            const Constructor = operatorFieldInfo.constructor ?? BinaryOperator;
            const right = this.parseExpression({ isType: false }, bindingPower);
            const additionalArguments =
              operatorFieldInfo.type == "construction"
                ? operatorFieldInfo.additionalArguments
                : [];
            // @ts-ignore
            left = new Constructor(token, left, right, ...additionalArguments);
          }

          continue;
        }
      }
      break;
    }
    return left;
  }

  public shouldParseInfixOrPostfix(): boolean {
    if (!this.hasToken()) return false;
    const token = this.getCurrentToken();
    if (!token) return false;
    if (
      [
        TokenType.GroupStart,
        TokenType.IndexerStart,
        TokenType.BlockStart,
      ].includes(token.type as any)
    )
      return true;
    const indixAndPostifxOperators = [
      ...Object.keys(operators.infix),
      ...Object.keys(operators.postfix),
    ];
    return indixAndPostifxOperators.includes(token.type as any);
  }

  private parseInner(
    context: ParsingContext,
    endCheck: () => boolean,
    expressionsSeparator: TokenType = TokenType.Semicolon
  ): IExpression[] {
    console.log("ParsingInner: ", expressionsSeparator);
    if (endCheck()) {
      return [];
    }
    const expressions: IExpression[] = [];
    while (true) {
      const [error, expression] = go<ParserError, IExpression>(
        this.parseExpression.bind(this),
        context
      );
      if (expression) {
        expressions.push(expression);
      } else {
        this.errors.push(error);
      }

      while (
        !endCheck() &&
        !this.is(TokenType.LineSeparator) &&
        !this.is(expressionsSeparator)
      ) {
        const currentToken = this.getCurrentToken() as ContentToken;
        const parserError = new ParserError(
          `Unexpected token ${currentToken.type}, expected line separator, ${expressionsSeparator} or endType`,
          currentToken.position
        );

        this.errors.push(parserError);
        this.eat();
      }
      if (endCheck()) {
        return expressions;
      }
      this.expect(TokenType.LineSeparator, expressionsSeparator);
    }
  }

  public parseFile(): BlockExpression | null {
    // Assertion, that we parsed full file
    this.expectBeforeBegin();
    const expressions = this.parseInner(
      { isType: false },
      () => !this.hasToken()
    );
    this.assertAfterEnd();
    if (expressions.length == 0) return null;
    return new BlockExpression(
      this.getFirstToken(),
      this.getLastToken(),
      expressions
    );
  }

  public parse(tokens: Token[]): BlockExpression | null {
    if (tokens.length == 0) return null;
    this.tokens = tokens;
    this.currentTokenIndex = -1;
    return this.parseFile();
  }
}
