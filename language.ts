import { Enum, StringEnum } from "../utils/constructs";
import { Position, Token, TokenizationGrammar } from "./parseStack/tokenizer";
import { BinaryOperator } from "./expression/BinaryOperator";
import { MemberExpression } from "./expression/MemberExpression";
import { SubclassOf } from "../utils/types";
import { DeclareOperator } from "./expression/DeclareOperator";
import { AssignmentOperator } from "./expression/AssignmentOperator.ts";
import Parser from "./parseStack/parser.ts";
import { IExpression } from "./expression/IExpression.ts";
export const root = Symbol("root");
export type RootSymbol = typeof root;

export const pop = Symbol("pop");
export type PopSymbol = typeof pop;

export class IdentifierToken extends Token {
  public holds: "value" | "type" = "value";
  public visiblity: "public" | "private" = "public";
  constructor(content: string, position: Position) {
    super(ContentTokenType.Identifier, content, position);
    let firstChar = content.charAt(0);
    if (firstChar == "_") {
      this.visiblity = "private";
      firstChar = content.charAt(1);
    }
    if (firstChar.toUpperCase() == firstChar) {
      this.holds = "type";
    }
  }
}

export const OperatorPrecedenceGroups = Enum(
  "Minimum",
  "MemberOperator",
  "UnaryPostfix",
  "UnaryPrefix",
  "Multiplicative",
  "Exponential",
  "Additive",
  "Shift",
  "Bitwise",
  "RelationalAndTest",
  "Equality",
  "Logical",
  "Conditional",
  "Cascade",
  "Assignment",
  "Spread",
  "Maximum"
);

export const Operators = {
  MemberOperator: {
    precedence: OperatorPrecedenceGroups.UnaryPostfix,
  },
};

export const ContentTokenType = StringEnum(
  "WhiteSpace",
  "LineSeparator",
  "FloatLiteral",
  "IntegerLiteral",
  "StringLiteralQuote",
  "StringLiteralContent",
  "StringLiteralInterpolationStart",
  "StringLiteralInterpolationEnd",
  "AtomLiteral",
  "CharacterLiteral",
  "Keyword",
  "Identifier",
  "Operator",

  "DoKeyword",
  "EndKeyword",

  "BlockStart",
  "BlockEnd",
  "GroupStart",
  "GroupEnd",
  "IndexerStart",
  "IndexerEnd",

  "Comma",
  "Semicolon",

  "LineComment",
  "MultiLineComment",

  "InvalidToken",

  //! Operators
  "MemberOperator",
  "ObserveOperator",
  "ReferenceOperator",
  // Logic operators
  "LessThanOperator",
  "GreaterThanOperator",
  "LessThanOrEqualOperator",
  "GreaterThanOrEqualOperator",
  "EqualOperator",
  "NotEqualOperator",

  // Assignment
  "AssignmentOperator",
  "DeclareOperator",
  "ConstDeclareOperator",
  "ConstAssignmentOperator",
  "ValueSetOperator",

  // Arithmetic operators
  "AdditionOperator",
  "SubtractionOperator",
  "MultiplicationOperator",
  "DivisionOperator",
  "ModuloOperator",
  "ExponentiationOperator",
  "OptionOperator",
  "StatefulOperator",
  "ErrorOperator",
  "LogicNegationOperator",

  // Keywords
  "IfKeyword",
  "ThenKeyword",
  "ElseKeyword",

  "IncrementOperator",
  "DecrementOperator",
  "MiddleSlashOperator"
);

export type ContentTokenType = keyof typeof ContentTokenType;

export const commandKeywords = [
  ["vr", "var", "variable"],
  ["vl", "val", "value"],
  ["lt", "let", null],
  ["ct", "const", "constant"],
  ["fn", "fun", "function"],
  ["cl", "class", null],
  ["if", null, null],
  ["el", "else", null],
  ["en", "entry", "entry_point"],
  ["tn", "then", null],
  ["st", "state", "stateful_variable"],
  ["sg", "sig", "signal"],
  ["do", null, null],
  ["end", null, null],
];
const commandKeywordsMatch = commandKeywords.flat().toReversed().join("|");
const commandKeywordMatcher = new RegExp(
  `\\b(${commandKeywordsMatch})(?=\\s+([a-zA-Z0-9])|\\s*[{"']|\\s+\\(|\\s*$)`
);

export const EnclosingTokenType = StringEnum("EnclosingToken");

export type EnclosingTokenType = keyof typeof EnclosingTokenType;

export const TokenType = { ...ContentTokenType, ...EnclosingTokenType };

export type TokenType = keyof typeof TokenType;

export const WithResolver = Symbol("WithResolver");

export type WithResolver = typeof WithResolver;

export type InfixOperatorField =
  | number
  | [number, SubclassOf<BinaryOperator>, ...any[]]
  | [
      number,
      WithResolver,
      (operator: Token, left: IExpression, parser: Parser) => BinaryOperator
    ];

export const operators: {
  prefix: Partial<Record<TokenType, number>>;
  postfix: Partial<Record<TokenType, number>>;
  infix: Partial<Record<TokenType, InfixOperatorField>>;
  rightBinded: TokenType[];
} = {
  prefix: {
    [TokenType.AdditionOperator]: OperatorPrecedenceGroups.UnaryPrefix,
    [TokenType.SubtractionOperator]: OperatorPrecedenceGroups.UnaryPrefix,
    [TokenType.OptionOperator]: OperatorPrecedenceGroups.UnaryPrefix,
    [TokenType.ReferenceOperator]: OperatorPrecedenceGroups.UnaryPrefix,
    [TokenType.LogicNegationOperator]: OperatorPrecedenceGroups.UnaryPrefix,
    [TokenType.StatefulOperator]: OperatorPrecedenceGroups.UnaryPrefix,
  },
  postfix: {
    [TokenType.OptionOperator]: OperatorPrecedenceGroups.UnaryPostfix,
    [TokenType.IncrementOperator]: OperatorPrecedenceGroups.UnaryPostfix,
    [TokenType.DecrementOperator]: OperatorPrecedenceGroups.UnaryPostfix,
    [TokenType.MiddleSlashOperator]: OperatorPrecedenceGroups.UnaryPostfix,
  },
  infix: {
    [TokenType.AdditionOperator]: OperatorPrecedenceGroups.Additive,
    [TokenType.SubtractionOperator]: OperatorPrecedenceGroups.Additive,
    [TokenType.MultiplicationOperator]: OperatorPrecedenceGroups.Multiplicative,
    [TokenType.DivisionOperator]: OperatorPrecedenceGroups.Multiplicative,
    [TokenType.ModuloOperator]: OperatorPrecedenceGroups.Multiplicative,
    [TokenType.ExponentiationOperator]: OperatorPrecedenceGroups.Exponential,
    [TokenType.LessThanOperator]: OperatorPrecedenceGroups.Logical,
    [TokenType.GreaterThanOperator]: OperatorPrecedenceGroups.Logical,
    [TokenType.LessThanOrEqualOperator]: OperatorPrecedenceGroups.Logical,
    [TokenType.GreaterThanOrEqualOperator]: OperatorPrecedenceGroups.Logical,
    [TokenType.EqualOperator]: OperatorPrecedenceGroups.Logical,
    [TokenType.NotEqualOperator]: OperatorPrecedenceGroups.Logical,
    [TokenType.MemberOperator]: [
      OperatorPrecedenceGroups.MemberOperator,
      MemberExpression,
    ],
    [TokenType.DeclareOperator]: [
      OperatorPrecedenceGroups.Assignment,
      WithResolver,
      (operator: Token, left: IExpression, parser: Parser) => {
        const right = parser.parseExpression({ isType: false });
        return new DeclareOperator(operator, left, right, true);
      },
    ],

    [TokenType.ConstDeclareOperator]: [
      OperatorPrecedenceGroups.Assignment,
      DeclareOperator,
      true,
    ],

    [TokenType.AssignmentOperator]: [
      OperatorPrecedenceGroups.Assignment,
      AssignmentOperator,
      false,
    ],

    [TokenType.ConstAssignmentOperator]: [
      OperatorPrecedenceGroups.Assignment,
      AssignmentOperator,
      true,
    ],

    [TokenType.ValueSetOperator]: OperatorPrecedenceGroups.Assignment,
  },
  rightBinded: [],
};

export const expressionSeparators = [
  TokenType.Comma,
  TokenType.Semicolon,
  TokenType.LineSeparator,
  TokenType.BlockEnd,
  TokenType.GroupEnd,
  TokenType.IndexerEnd,
];

export const grammar: TokenizationGrammar<TokenType> = {
  [root]: [
    { match: /\/\/.*/, type: TokenType.LineComment },
    {
      match: /\/\*/,
      type: TokenType.MultiLineComment,
      next: "multiLineComment",
    },
    {
      match: /,/,
      type: TokenType.Comma,
    },
    // Teraz parsowanie nowych linii
    {
      match: /[\r\n]\s*/,
      type: TokenType.LineSeparator,
    },
    // Liczby
    {
      match: /[0-9]*\.[0-9]+/,
      type: TokenType.FloatLiteral,
    },
    {
      match: /[0-9']+/,
      type: TokenType.IntegerLiteral,
    },

    // CharacterLiteral
    {
      match: /'/,
      type: TokenType.CharacterLiteral,
      next: "characterLiteral",
    },

    // String literals
    {
      match: /"/,
      type: TokenType.StringLiteralQuote,
      next: "stringLiteral",
      separated: true,
    },
    {
      match: /\+\+/,
      type: TokenType.IncrementOperator,
    },
    {
      match: /--/,
      type: TokenType.DecrementOperator,
    },
    {
      match: /&/,
      type: TokenType.ReferenceOperator,
    },
    {
      match: /\?/,
      type: TokenType.OptionOperator,
    },
    {
      match: /\$/,
      type: TokenType.StatefulOperator,
    },
    // {
    //   match: /#/,
    //   type: TokenType.ErrorOperator,
    // },

    // Keywords
    {
      match: commandKeywordMatcher,
      type: TokenType.Keyword,
    },

    // Identifiers
    {
      match: /[A-Za-z_][A-Za-z0-9_]*/,
      type: IdentifierToken,
    },

    // AtomLiterals
    {
      match: /`[A-Za-z_][A-Za-z0-9_]*/,
      type: TokenType.AtomLiteral,
    },
    // Time
    {
      match: /`[0-9]{2}:[0-9]{2}(:[0-9]{2})?/,
      type: TokenType.AtomLiteral,
    },
    // Whitespace
    {
      match: /[^\S\n]/,
      type: TokenType.WhiteSpace,
    },
    // Blocks
    {
      match: /\{/,
      type: TokenType.BlockStart,
      separated: true,
    },
    {
      match: /\}/,
      type: TokenType.BlockEnd,
      separated: true,
    },
    // Groups
    {
      match: /\(/,
      type: TokenType.GroupStart,
      separated: true,
    },
    {
      match: /\)/,
      type: TokenType.GroupEnd,
      separated: true,
    },
    // Indexers
    {
      match: /\[/,
      type: TokenType.IndexerStart,
      separated: true,
    },
    {
      match: /\]/,
      type: TokenType.IndexerEnd,
      separated: true,
    },

    // Operators
    {
      match: /@/,
      type: TokenType.ObserveOperator,
    },
    {
      match: /\./,
      type: TokenType.MemberOperator,
    },
    {
      match: /</,
      type: TokenType.LessThanOperator,
    },
    {
      match: />/,
      type: TokenType.GreaterThanOperator,
    },
    {
      match: /<=/,
      type: TokenType.LessThanOrEqualOperator,
    },
    {
      match: />=/,
      type: TokenType.GreaterThanOrEqualOperator,
    },
    {
      match: /==/,
      type: TokenType.EqualOperator,
    },
    {
      match: /!=/,
      type: TokenType.NotEqualOperator,
    },
    {
      match: /\.=/,
      type: TokenType.ValueSetOperator,
    },
    {
      match: /=/,
      type: TokenType.AssignmentOperator,
    },
    {
      match: /:=/,
      type: TokenType.ConstAssignmentOperator,
    },
    {
      match: /::/,
      type: TokenType.ConstDeclareOperator,
    },
    {
      match: /:/,
      type: TokenType.DeclareOperator,
    },
    {
      match: /\+/,
      type: TokenType.AdditionOperator,
    },
    {
      match: /\-/,
      type: TokenType.SubtractionOperator,
    },
    {
      match: /\*/,
      type: TokenType.MultiplicationOperator,
    },
    {
      match: /\//,
      type: TokenType.DivisionOperator,
    },
    {
      match: /%/,
      type: TokenType.ModuloOperator,
    },
    {
      match: /!/,
      type: TokenType.LogicNegationOperator,
    },
  ],
  multiLineComment: [
    { match: /\*\//, type: TokenType.MultiLineComment, next: pop },
    {
      match: /\/\*/,
      type: TokenType.MultiLineComment,
      next: "multiLineComment",
    },
    { match: /./s, type: TokenType.MultiLineComment },
  ],
  characterLiteral: [
    { match: /\\'/, type: TokenType.CharacterLiteral },
    {
      match: /'/,
      type: TokenType.CharacterLiteral,
      next: pop,
    },
    { match: /./s, type: TokenType.CharacterLiteral },
  ],

  stringInterpolation: [
    {
      match: /\}/,
      type: TokenType.StringLiteralInterpolationEnd,
      next: pop,
    },
    { extends: root },
  ],

  stringLiteral: [
    { match: /\\"/, type: TokenType.StringLiteralContent },
    {
      match: /"/,
      type: TokenType.StringLiteralQuote,
      separated: true,
      next: pop,
    },
    {
      match: /%\{/,
      type: TokenType.StringLiteralInterpolationStart,
      next: "stringInterpolation",
    },
    { match: /./s, type: TokenType.StringLiteralContent },
    { error: "String literal not closed" },
  ],
};

export type BraceRangeSettings = {
  trim?: true;
  disableEmptySet?: true;
};

export const braces: {
  start: TokenType;
  end: TokenType | TokenType[];
  settings: BraceRangeSettings;
}[] = [
  {
    start: TokenType.BlockStart,
    end: TokenType.BlockEnd,
    settings: { trim: true },
  },
  {
    start: TokenType.GroupStart,
    end: TokenType.GroupEnd,
    settings: { trim: true },
  },
  {
    start: TokenType.IndexerStart,
    end: TokenType.IndexerEnd,
    settings: { trim: true },
  },
  {
    start: TokenType.StringLiteralInterpolationStart,
    end: TokenType.StringLiteralInterpolationEnd,
    settings: { trim: true },
  },
  {
    start: TokenType.StringLiteralQuote,
    end: TokenType.StringLiteralQuote,
    settings: {},
  },
];

export const lineSeparatorEaters = {
  after: [TokenType.ElseKeyword, TokenType.ThenKeyword],
  before: [],
};

export const irrelevantTokensFilter = (token: Token) => {
  return (
    token.type != TokenType.WhiteSpace &&
    token.type != TokenType.LineComment &&
    token.type != TokenType.MultiLineComment
  );
};

export const trimmableTypes = [TokenType.LineSeparator, TokenType.Semicolon];
