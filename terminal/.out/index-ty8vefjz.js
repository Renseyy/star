// ../star/token.ts
var TokenType = {
  InvalidToken: "InvalidToken",
  IrrelevantToken: "IrrelevantToken",
  EndOfLine: "EndOfLine",
  Identifier: "Identifier",
  String: "String",
  Number: "Number",
  MetaDirective: "MetaDirective",
  Directive: "Directive",
  Resource: "Resource",
  LeftParenthesis: "LeftParenthesis",
  RightParenthesis: "RightParenthesis",
  LeftBracket: "LeftBracket",
  RightBracket: "RightBracket",
  LeftBrace: "LeftBrace",
  RightBrace: "RightBrace",
  Comma: "Comma",
  Semicolon: "Semicolon"
};
function Token(type, text, index, content) {
  return {
    type,
    text,
    index,
    content,
    toString: () => `[ ${type} '${text.replace(`
`, "⏎")}' @${index})]`
  };
}

// ../star/ArrayUtil.ts
Array.prototype.last = function(index = 1) {
  if (this.length === 0)
    return;
  return this[this.length - index];
};
String.prototype.in = function(...array) {
  return array.includes(this);
};

// ../star/tokenizerUtil.ts
function isValidIdentifier(character, notStartingCharacter = true) {
  const code = character.charCodeAt(0);
  if (code == 33)
    return true;
  if (code > 32 && code < 39)
    return true;
  if (code == 42 || code == 43 || code > 44 && code < 48)
    return true;
  if (code == 58)
    return true;
  if (code > 59 && code < 65)
    return true;
  if (code == 92)
    return true;
  if (code == 94)
    return true;
  if (code == 95)
    return notStartingCharacter;
  if (code == 124 || code == 126)
    return true;
  return false;
}
function isValidAlphaNumericIdentifier(character, notStartingCharacter = true) {
  const code = character.charCodeAt(0);
  if (code > 47 && code < 58)
    return notStartingCharacter;
  if (code > 64 && code < 91)
    return true;
  if (code == 95)
    return true;
  if (code > 96 && code < 123)
    return true;
  return false;
}
function isSpace(character) {
  return [" ", "\t", `
`, "\r", "\f", "\v"].includes(character);
}
function isDigit(character) {
  return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(character);
}

// ../star/tokenizer.ts
class Tokenizer {
  length = 0;
  index = 0;
  input = "";
  errors = [];
  options = {
    throwErrors: false
  };
  tokens = [];
  bracketStack = [];
  endTrimable = 0;
  constructor(options = {}) {
    this.options = { ...this.options, ...options };
  }
  lastRelevantToken() {
    for (let i = this.tokens.length - 1;i >= 0; i--) {
      if (this.tokens[i]?.type != TokenType.IrrelevantToken) {
        return this.tokens[i];
      }
    }
    return;
  }
  getChar() {
    return this.input[this.index] || "\x00";
  }
  nextChar(delta = 1) {
    return this.input[this.index + delta];
  }
  next() {
    this.index++;
    return this.index < this.length;
  }
  previous() {
    this.index--;
    return this.index >= 0;
  }
  match(text) {
    return this.input.slice(this.index, this.index + text.length) === text;
  }
  hasChars() {
    return this.index < this.length;
  }
  reportError(message) {
    if (this.options.throwErrors) {
      throw new Error(message);
    }
    this.errors.push({
      message,
      index: this.index.toString()
    });
  }
  trimBefore() {
    if (this.tokens.length <= 0)
      return false;
    const last = this.tokens.last();
    if (last && last.type === TokenType.EndOfLine) {
      last.type = TokenType.IrrelevantToken;
      return true;
    }
    return false;
  }
  pushToken(token, pushToBracketStack = false) {
    if (pushToBracketStack) {
      this.bracketStack.push([token.type, this.index]);
    }
    this.tokens.push(token);
  }
  expect(tokenType, current) {
    const lastTokenType = this.bracketStack.last();
    if (!lastTokenType) {
      this.reportError(`Unexpected token: ${current}, no matching ${tokenType} found before`);
      return;
    } else if (lastTokenType[0] !== tokenType) {
      this.reportError(`Unexpected token: ${current}, expected ${tokenType} witch started with ${lastTokenType[0]} @ ${lastTokenType[1]}`);
    } else {
      this.bracketStack.pop();
    }
  }
  tokenize(input) {
    this.input = input;
    this.length = input.length;
    this.errors = [];
    this.tokens = [];
    this.index = 0;
    this.bracketStack = [];
    for (let i = this.length - 1;i >= 0; i--) {
      if (!isSpace(this.input[i])) {
        this.endTrimable = i + 1;
        break;
      }
    }
    while (this.hasChars()) {
      const start = this.index;
      let currentChar = this.getChar();
      if (currentChar == ",") {
        this.pushToken(Token(TokenType.Comma, currentChar, start));
      } else if (currentChar == "(") {
        this.pushToken(Token(TokenType.LeftParenthesis, currentChar, start), true);
      } else if (currentChar == ")") {
        this.trimBefore();
        this.expect(TokenType.LeftParenthesis, TokenType.RightParenthesis);
        this.pushToken(Token(TokenType.RightParenthesis, currentChar, start));
      } else if (currentChar == "{") {
        this.pushToken(Token(TokenType.LeftBrace, currentChar, start), true);
      } else if (currentChar == "}") {
        this.trimBefore();
        this.expect(TokenType.LeftBrace, TokenType.RightBrace);
        this.pushToken(Token(TokenType.RightBrace, currentChar, start));
      } else if (currentChar == "[") {
        this.pushToken(Token(TokenType.LeftBracket, currentChar, start), true);
      } else if (currentChar == "]") {
        this.trimBefore();
        this.expect(TokenType.LeftBracket, TokenType.RightBracket);
        this.tokens.push(Token(TokenType.RightBracket, currentChar, start));
      } else if (currentChar == "'") {
        let content = "'";
        let finished = false;
        while (true) {
          if (!this.next()) {
            break;
          }
          currentChar = this.getChar();
          if (currentChar == "'") {
            finished = true;
            content += "'";
            this.next();
            break;
          }
          content += currentChar;
        }
        if (!finished) {
          this.reportError("Unterminated string started at " + start);
        }
        this.tokens.push(Token(TokenType.String, content, start));
        continue;
      } else if (currentChar == "#") {
        let directive = "";
        while (true) {
          if (!this.next()) {
            break;
          }
          currentChar = this.getChar();
          if (isSpace(currentChar) || currentChar == "{") {
            break;
          }
          directive += currentChar;
        }
        this.tokens.push(Token(TokenType.Directive, "#" + directive, start, directive));
        continue;
      } else {
        if (isSpace(currentChar)) {
          if (currentChar == `
`) {
            const tokenBefore = this.tokens.last();
            const canAppend = tokenBefore ? tokenBefore.text.startsWith(`
`) : false;
            const lastToken = canAppend ? this.tokens.last(2) : tokenBefore;
            const nextChar = this.nextChar();
            const isLastToken = nextChar === undefined;
            const isFirstToken = lastToken === undefined;
            const lastType = lastToken?.type;
            const shouldEmitEol = !isLastToken && !isFirstToken && lastType !== TokenType.Comma && lastType !== TokenType.EndOfLine && lastType !== TokenType.LeftBrace && lastType !== TokenType.LeftBracket && lastType !== TokenType.LeftParenthesis;
            let type = shouldEmitEol ? TokenType.EndOfLine : TokenType.IrrelevantToken;
            if (canAppend) {
              const token = tokenBefore;
              token.text += `
`;
              token.type = type;
              this.tokens[this.tokens.length - 1] = token;
            } else {
              const token = Token(type, `
`, start, "newline");
              console.log(token);
              this.tokens.push(token);
            }
          } else {
            const tokenBefore = this.tokens.last();
            if (tokenBefore && tokenBefore.type == TokenType.IrrelevantToken && tokenBefore.content == "space") {
              tokenBefore.text += currentChar;
              this.tokens[this.tokens.length - 1] = tokenBefore;
            } else
              this.tokens.push(Token(TokenType.IrrelevantToken, currentChar, start, "space"));
          }
        } else if (isDigit(currentChar)) {
          let number = currentChar;
          while (true) {
            if (!this.next())
              break;
            currentChar = this.getChar();
            if (!isDigit(currentChar))
              break;
            number += currentChar;
          }
          this.tokens.push(Token(TokenType.Number, number, start));
          continue;
        } else if (isValidIdentifier(currentChar)) {
          let text = currentChar;
          while (true) {
            if (!this.next())
              break;
            currentChar = this.getChar();
            if (isValidIdentifier(currentChar)) {
              text += currentChar;
              continue;
            }
            break;
          }
          this.tokens.push(Token(TokenType.Identifier, text, start));
          continue;
        } else if (isValidAlphaNumericIdentifier(currentChar, false)) {
          let text = currentChar;
          while (true) {
            if (!this.next())
              break;
            currentChar = this.getChar();
            if (isValidAlphaNumericIdentifier(currentChar, false)) {
              text += currentChar;
              continue;
            }
            break;
          }
          this.tokens.push(Token(TokenType.Identifier, text, start));
          continue;
        } else {
          this.reportError(`Unexpected character "${currentChar}" at index ${start}`);
          this.tokens.push(Token(TokenType.InvalidToken, currentChar, start));
        }
      }
      this.next();
    }
    for (const bracket of this.bracketStack.reverse()) {
      this.reportError(`Missing closing "${bracket[0]}" at index ${bracket[1]}`);
    }
    return this.tokens;
  }
}

// ../star/metaRegister.ts
function Collection(record) {
  const collection = record;
  collection.$ = "Collection";
  return collection;
}
function Key(group) {
  return {
    group,
    $: "Group"
  };
}
function CollectionKey(group, name) {
  return {
    group,
    name,
    $: "GroupWithName"
  };
}

class MetaRegister {
  parent;
  id = crypto.randomUUID();
  registry = {};
  constructor(parent) {
    this.parent = parent;
  }
  readElement(key) {
    const groupRegistry = this.registry[key.group];
    if (groupRegistry == undefined) {
      return this.parent?.readElement(key) || null;
    } else if (groupRegistry == null) {
      return null;
    }
    if (key.$ == "GroupWithName") {
      const collectionRegistry = groupRegistry;
      if (!collectionRegistry) {
        return this.parent?.readElement(key) || null;
      }
      return collectionRegistry[key.name] || null;
    } else {
      const excudingCollections = groupRegistry;
      return excudingCollections || null;
    }
  }
  readCollection(group) {
    const groupRegistry = this.registry[group];
    if (groupRegistry == undefined) {
      return this.parent?.readCollection(group) || null;
    } else if (groupRegistry == null) {
      return null;
    }
    return this.registry[group];
  }
  writeElement(key, element) {
    if (key.$ == "GroupWithName") {
      if (this.registry[key.group] == undefined)
        this.registry[key.group] = Collection({ [key.name]: element });
      else
        this.registry[key.group][key.name] = element;
    } else {
      this.registry[key.group] = element;
    }
  }
  __toString() {
    return `Scope#${this.id}`;
  }
  toJSON() {
    return this.__toString();
  }
}
var metaRegister = new MetaRegister;
var someType = metaRegister.readElement(CollectionKey("infixOperator", "!"));
metaRegister.writeElement(Key("defaultConstructorArchetype"));

// ../star/utils.ts
function expect(name, value) {
  if (value.$ != name) {
    throw new Error(`Expected ${name} got ${value.$}`);
  }
  return value;
}

// ../star/staticDirectives.ts
function staticDirectives(parser) {
  return {
    InfixOperator: (register) => {
      const scope = parser.parseScope(register);
      const collection = scope.readCollection("shape");
      if (!collection)
        throw new Error("Cannot get shape");
      const bindingPower = collection.binding_power.value;
      const isRightBinded = collection.is_right_binded.value;
      const creator = collection.creator;
      return {
        $: "InfixOperator",
        bindingPower,
        expression: creator,
        isRightBinded
      };
    },
    "=": (register) => {
      const identifier = expect("IdentifierExpression", parser.parseElement(register));
      const expression = parser.parseElement(register);
      register.writeElement(CollectionKey("shape", identifier.name), expression);
      return null;
    },
    MAX_BINDING_POWER: (register) => ({
      $: ["BindingPower", "MaxBindingPower"],
      bindingPower: maxBindingPower
    }),
    BindingPower: (register) => {
      const value = expect("LiteralExpression", parser.parseElement(register));
      return {
        $: ["BindingPower", "Numeric"],
        bindingPower: value.value
      };
    },
    TRUE: () => ({
      $: ["LiteralExpression", "Boolean", "True"],
      contentType: "Boolean",
      value: true
    }),
    FALSE: () => ({
      $: ["LiteralExpression", "Boolean", "False"],
      contentType: "Boolean",
      value: true
    })
  };
}

// ../star/parser.ts
var defaultConstructorSymbol = Symbol("defaultConstructor");
var defaultIntegerArchetypeSymbol = Symbol("defaultIntegerArchetype");
function IndexExpression(context, expressions) {
  return {
    $: "IndexExpression",
    context,
    expressions
  };
}
var maxBindingPower = Symbol();
function isGreaterThan(a, b) {
  if (a === b && b === maxBindingPower)
    return false;
  if (a === maxBindingPower)
    return true;
  if (b === maxBindingPower)
    return false;
  return a > b;
}
function ExtendedToken(token, isSkipped) {
  return {
    ...token,
    skipped: isSkipped
  };
}

class Parser {
  tokens = [];
  index = 0;
  decorations = [];
  throwTokenError(token, message) {
    const tokens = [];
    for (let i = this.index - 1;i >= 0; i--) {
      const token2 = this.tokens[i];
      if (!token2) {
        break;
      }
      if (token2.type == TokenType.EndOfLine)
        break;
      tokens.unshift(token2);
    }
    const location = tokens.reduce((acc, token2) => acc + token2.text.length, 0);
    tokens.push(token);
    for (let i = this.index + 1;i < this.tokens.length; i++) {
      const token2 = this.tokens[i];
      if (!token2)
        break;
      if (token2.type == TokenType.EndOfLine)
        break;
      if (token2.type == TokenType.IrrelevantToken && token2.content == `
`)
        continue;
      tokens.push(token2);
    }
    console.log(tokens);
    console.error(tokens.map((t) => t.text).join(""));
    console.error(" ".repeat(location) + "^".repeat(token.text.length));
    console.error("");
    console.error(message);
    process.exit(-1);
  }
  loadTokens(tokens) {
    let isSkipped = false;
    for (const token of tokens) {
      if (token.type == "IrrelevantToken") {
        this.tokens.push(ExtendedToken(token, isSkipped));
        isSkipped = true;
        continue;
      }
      this.tokens.push(ExtendedToken(token, isSkipped));
      isSkipped = false;
    }
  }
  getCurrentToken(forTest = false) {
    let token = this.tokens[this.index];
    if (token?.type == TokenType.IrrelevantToken) {
      this.index++;
      return this.getCurrentToken(forTest);
    }
    if (forTest) {
      return token ?? null;
    }
    if (!token) {
      throw new Error("Unexpected end of input");
    }
    return token;
  }
  hasToken() {
    return this.index < this.tokens.length;
  }
  parseDirective = {
    define: (register) => {
      this.index++;
      const name = this.parseElement(register);
      if (name.$ != "IdentifierExpression")
        throw new Error(`Unexpected token ${name.$}, expected IdentifierExpression`);
      const nameIdentifier = name.name;
      const value = this.parseElement(register);
      return {
        type: "Directive",
        name: "declare",
        arguments: [name]
      };
    },
    ...staticDirectives(this)
  };
  parseBlock(register, isTransparent = false) {
    const innerRegister = isTransparent ? register : new MetaRegister(register);
    this.index++;
    const expressions = this.parseInner(innerRegister, TokenType.RightBrace);
    this.index++;
    return {
      $: "BlockExpression",
      expressions
    };
  }
  parseScope(register) {
    const innerRegister = new MetaRegister(register);
    this.parseBlock(innerRegister, true);
    return innerRegister;
  }
  parseCallBlock(register, isTransparent = false) {
    this.index++;
    const expressions = this.parseInner(register, TokenType.RightParenthesis);
    this.index++;
    return {
      $: "BlockExpression",
      expressions
    };
  }
  parseIndexBlock(register, isTransparent = false) {
    this.index++;
    console.log(this.tokens[this.index]);
    const expressions = this.parseInner(register, TokenType.RightBracket);
    this.index++;
    return {
      $: "BlockExpression",
      expressions
    };
  }
  parseIdentifier() {
    const token = this.getCurrentToken();
    this.index++;
    return {
      $: "IdentifierExpression",
      name: token.text
    };
  }
  parseMaybePrefixOperator(register) {
    const token = this.getCurrentToken();
    const name = token.text;
    const prefixOperator = register.readElement(CollectionKey("prefixOperator", name));
    if (prefixOperator) {
      const bindingPower = prefixOperator.bindingPower;
      const argument = this.parseExpression(register, bindingPower);
      return prefixOperator.expression.creator(argument);
    }
    return null;
  }
  parseElement(register) {
    let currentToken = this.getCurrentToken();
    if (["Number", "String"].includes(currentToken.type)) {
      this.index++;
      return {
        $: "LiteralExpression",
        contentType: currentToken.type,
        value: currentToken.content || currentToken.text
      };
    } else if (currentToken.type == TokenType.LeftBrace) {
      return this.parseBlock(register);
    } else if (currentToken.type == TokenType.LeftParenthesis) {
      const defaultConstructor = register.readElement(Key("defaultConstructorArchetype"));
      if (!defaultConstructor) {
        throw new Error("Cannot get default constructor");
      }
      return {
        $: "Call",
        callee: defaultConstructor,
        argumentBlock: this.parseCallBlock(register)
      };
    } else if (currentToken.type == TokenType.LeftBracket) {
      const defaultConstructor = register.readElement(Key("defaultIndexerArchetype"));
      if (!defaultConstructor) {
        throw new Error("Cannot get default indexer");
      }
      const block = this.parseIndexBlock(register);
      return IndexExpression(defaultConstructor, block.expressions);
    } else if (currentToken.type == "Identifier") {
      return this.parseMaybePrefixOperator(register) ?? this.parseIdentifier();
    } else if (currentToken.type == TokenType.Directive) {
      const parseFunction = this.parseDirective[currentToken.content];
      if (parseFunction) {
        this.index++;
        return parseFunction(register);
      }
      throw new Error("Undefined directive " + currentToken.content);
    }
    throw new Error("Unexpected token " + currentToken.type);
  }
  parseExpression(register, rightBindingPower = 0) {
    let left = this.parseElement(register);
    while (this.shouldParseInfixOrPostfix(register)) {
      const token = this.getCurrentToken(true);
      if (!token)
        break;
      if (token.type == TokenType.Comma) {
        const expressions = [left];
        this.index++;
        const right = this.parseExpression(register);
        if (right.$ == "GroupExpression") {
          expressions.push(...right.expressions);
        } else {
          expressions.push(right);
        }
        left = {
          $: "GroupExpression",
          expressions
        };
        continue;
      } else if (!token.skipped && token.type == TokenType.LeftBrace && isGreaterThan(maxBindingPower, rightBindingPower)) {
        const right = this.parseBlock(register);
        left = {
          $: "BuildExpression",
          context: left,
          expressions: right.expressions
        };
        continue;
      } else if (!token.skipped && token.type == TokenType.LeftBracket && isGreaterThan(maxBindingPower, rightBindingPower)) {
        const right = this.parseBlock(register);
        left = IndexExpression(left, right.expressions);
        continue;
      } else if (!token.skipped && token.type == TokenType.LeftParenthesis && isGreaterThan(maxBindingPower, rightBindingPower)) {
        const right = this.parseCallBlock(register);
        left = {
          $: "Call",
          callee: left,
          argumentBlock: right
        };
        continue;
      }
      if (token.type != TokenType.Identifier)
        break;
      const postfixOperator = register.readElement(CollectionKey("prefixOperator", token.text));
      if (postfixOperator != null) {
        const bindingPower = postfixOperator.bindingPower;
        if (isGreaterThan(bindingPower, rightBindingPower)) {
          left = postfixOperator.expression.creator(left);
          this.index++;
          continue;
        }
      }
      const infixOperator = register.readElement(CollectionKey("infixOperator", token.text));
      if (infixOperator != null) {
        const bindingPower = infixOperator.bindingPower;
        if (isGreaterThan(bindingPower, rightBindingPower) || bindingPower == rightBindingPower && infixOperator.isRightBinded) {
          this.index++;
          const right = this.parseExpression(register, bindingPower);
          left = infixOperator.expression.creator(left, right);
          continue;
        }
      }
      break;
    }
    return left;
  }
  shouldParseInfixOrPostfix(register) {
    const token = this.getCurrentToken(true);
    if (!token)
      return false;
    if (token.type.in(TokenType.Comma, TokenType.LeftBrace, TokenType.LeftParenthesis))
      return true;
    if (token.type != TokenType.Identifier)
      return false;
    const infixOperator = register.readElement(CollectionKey("infixOperator", token.text));
    if (infixOperator != null)
      return true;
    const postfixOperator = register.readElement(CollectionKey("postfixOperator", token.text));
    return postfixOperator != null;
  }
  parseInner(register, endType) {
    const expressions = [];
    for (let token = this.getCurrentToken(true);token != null && (!endType || token.type != endType); token = this.getCurrentToken(true)) {
      const expression = this.parseExpression(register);
      expressions.push(expression);
      if (!endType) {
        if (!this.hasToken())
          break;
      }
      console.log(token);
      token = this.getCurrentToken();
      if (token.type.in(TokenType.Semicolon, TokenType.EndOfLine)) {
        this.index++;
      } else if (!endType || endType && token.type != endType) {
        this.throwTokenError(token, `Unexpected token ${token}`);
      }
    }
    return expressions;
  }
  parse(tokens, register = new MetaRegister) {
    this.loadTokens(tokens);
    this.index = 0;
    return {
      $: "BlockExpression",
      expressions: this.parseInner(register)
    };
  }
}

// src/app.ts
var specialConstructors = ["Function", "Array", "Map"];
function renderToken(token) {
  if (token.type == "EndOfLine") {
    const rest = token.text.slice(1);
    const text = "⏎<br>" + rest.replaceAll(`
`, '<span class="-irrelevantPart">↧<br></span>');
    return `<span data-index="${token.index}" class="_Token _EndOfLine">${text}</span>`;
  }
  const type = specialConstructors.includes(token.text) ? "Hint" : token.type;
  return `<span data-index="${token.index}" class="_Token _${type}">${token.text.replaceAll(`
`, () => type == "IrrelevantToken" ? "␤<br>" : "⏎<br>")}</span>`;
}
document.addEventListener("DOMContentLoaded", () => {
  const tokenizer = new Tokenizer;
  const liner = new Parser;
  const terminal = document.getElementById("terminal");
  const textarea = terminal?.querySelector("textarea");
  const output = terminal?.querySelector("#tokens");
  const tokenize = () => {
    const content = textarea.value;
    console.log(content);
    const tokens = tokenizer.tokenize(content);
    console.log(tokens);
    output.innerHTML = tokens.map(renderToken).join("") + "<br><hr>" + tokenizer.errors.map((e) => e.message).join("<br>");
  };
  textarea.addEventListener("input", tokenize);
  textarea.addEventListener("keydown", function(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;
      this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 1;
    }
    if (e.key === "{") {
      e.preventDefault();
      this.value = this.value.substring(0, this.selectionStart) + "{}" + this.value.substring(this.selectionStart);
      this.selectionStart = this.selectionEnd = this.selectionStart - 1;
      tokenize();
    } else if (e.key === "}") {
      const nextChar = this.value[this.selectionStart];
      if (nextChar === "}") {
        e.preventDefault();
        this.selectionStart = this.selectionEnd = this.selectionStart + 1;
      }
    }
  });
  tokenize();
});
