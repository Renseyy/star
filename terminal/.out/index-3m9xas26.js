// ../star/token.ts
var TokenType = {
  InvalidToken: "InvalidToken",
  IrrelevantToken: "IrrelevantToken",
  EndOfLine: "EndOfLine",
  Identifier: "Identifier",
  String: "String",
  Number: "Number",
  Directive: "Directive",
  Resource: "Resource",
  LeftParenthes: "LeftParenthes",
  RightParenthes: "RightParenthes",
  LeftBracket: "LeftBracket",
  RightBracket: "RightBracket",
  LeftBrace: "LeftBrace",
  RightBrace: "RightBrace",
  Dot: "Dot",
  Comma: "Comma",
  Semicolon: "Semicolon"
};

class Token {
  type;
  text;
  index;
  content;
  constructor(type, text, index, content) {
    this.type = type;
    this.text = text;
    this.index = index;
    this.content = content;
  }
  toString() {
    return `[ ${this.type} '${this.text.replace(`
`, "⏎")}' ]`;
  }
}

// ../star/ArrayUtil.ts
Array.prototype.last = function() {
  if (this.length === 0)
    return;
  return this[this.length - 1];
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
  if (code == 42 || code == 43 || code == 45 || code == 47)
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
        this.pushToken(new Token(TokenType.Comma, currentChar, start));
      } else if (currentChar == "(") {
        this.pushToken(new Token(TokenType.LeftParenthes, currentChar, start), true);
      } else if (currentChar == ")") {
        this.trimBefore();
        this.expect(TokenType.LeftParenthes, TokenType.RightParenthes);
        this.pushToken(new Token(TokenType.RightParenthes, currentChar, start));
      } else if (currentChar == "{") {
        this.pushToken(new Token(TokenType.LeftBrace, currentChar, start), true);
      } else if (currentChar == "}") {
        this.trimBefore();
        this.expect(TokenType.LeftBrace, TokenType.RightBrace);
        this.pushToken(new Token(TokenType.RightBrace, currentChar, start));
      } else if (currentChar == "[") {
        this.pushToken(new Token(TokenType.LeftBracket, currentChar, start), true);
      } else if (currentChar == "]") {
        this.trimBefore();
        this.expect(TokenType.LeftBracket, TokenType.RightBracket);
        this.tokens.push(new Token(TokenType.RightBracket, currentChar, start));
      } else if (currentChar == ".") {
        this.trimBefore();
        this.tokens.push(new Token(TokenType.Dot, currentChar, start));
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
        this.tokens.push(new Token(TokenType.String, content, start));
        continue;
      } else if (currentChar == "#") {
        let directive = "";
        while (true) {
          if (!this.next()) {
            break;
          }
          currentChar = this.getChar();
          if (isSpace(currentChar)) {
            break;
          }
          directive += currentChar;
        }
        this.tokens.push(new Token(TokenType.Directive, "#" + directive, start, directive));
        continue;
      } else {
        if (isSpace(currentChar)) {
          if (currentChar == `
`) {
            const lastToken = this.tokens.last();
            const canAppend = lastToken ? lastToken.text.startsWith(`
`) : false;
            const nextChar = this.nextChar();
            const isLastToken = nextChar === undefined;
            const isFirstToken = lastToken === undefined || canAppend && this.tokens.length <= 1;
            const lastType = lastToken?.type;
            const shouldEmitEol = !isLastToken && !isFirstToken && lastType !== TokenType.Comma && lastType !== TokenType.EndOfLine && lastType !== TokenType.LeftBrace && lastType !== TokenType.LeftBracket && lastType !== TokenType.LeftParenthes;
            let type = shouldEmitEol || isFirstToken ? TokenType.EndOfLine : TokenType.IrrelevantToken;
            console.log(shouldEmitEol, type, canAppend);
            if (canAppend) {
              const token = lastToken;
              token.text += `
`;
              token.type = type;
              this.tokens[this.tokens.length - 1] = token;
            } else {
              const token = new Token(type, `
`, start);
              this.tokens.push(token);
            }
          } else {
            this.tokens.push(new Token(TokenType.IrrelevantToken, currentChar, start));
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
          this.tokens.push(new Token(TokenType.Number, number, start));
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
          this.tokens.push(new Token(TokenType.Identifier, text, start));
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
          this.tokens.push(new Token(TokenType.Identifier, text, start));
          continue;
        } else {
          this.reportError(`Unexpected character "${currentChar}" at index ${start}`);
          this.tokens.push(new Token(TokenType.InvalidToken, currentChar, start));
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

// ../star/parser.ts
class Scope {
  parent;
  registry = {};
  constructor(parent) {
    this.parent = parent;
  }
  readElement(name) {
    if (this.registry[name])
      return this.registry[name];
    if (this.parent)
      return this.parent.readElement(name);
    return null;
  }
  writeElement(name, element2) {
    this.registry[name] = element2;
  }
}
class Parser {
  tokens = [];
  index = 0;
  decorations = [];
  scopes = [];
  getCurrentToken(forTest = false) {
    const token = this.tokens[this.index];
    if (forTest) {
      return token ?? null;
    }
    if (!token) {
      throw new Error("Unexpected end of input");
    }
    return token;
  }
  parse(tokens, scope = new Scope) {
    this.tokens = tokens;
    this.index = 0;
    this.scopes.push(scope);
    return this.parseBlockInsides(scope);
  }
  parseLiteral(scope) {
    const currentToken = this.get;
    return {
      type: "LiteralExpression",
      contentType: element.contentType,
      value: element.value
    };
  }
  parseBlock(scope, isTransparent = false) {
    const innerScope = isTransparent ? scope : new Scope(scope);
    const expressions = [];
    for (let i = 0;i < element.expressions.length; i++) {
      const getNextElement = i < element.expressions.length - 1 ? () => {
        i++;
        return element.expressions[i];
      } : undefined;
      const expression = this.parseElement([element.expressions[i]], innerScope, getNextElement);
      expressions.push(expression);
    }
    return {
      type: "BlockExpression",
      expressions
    };
  }
  parseIdentifier(element2, scope, autoResolve = false) {
    const scopeElement = scope.readElement(element2.value);
    const resolve = () => {
      if (!scopeElement)
        throw new Error(`Cannot resolve ${element2.value}`);
      return {
        type: "ReadMemory",
        address: element2.value
      };
    };
    return autoResolve ? resolve() : { type: "ReadOperation", address: resolve };
  }
  parseGroup(element2, scope) {
    throw new Error("Group is not implemented");
  }
  parseMaybePrefixOperator(identifier, elements, scope) {
    const name = identifier.value;
    const operatorGroup = scope.readElement(name);
    if (!operatorGroup || operatorGroup.type != "OperatorGroup")
      return null;
    if (operatorGroup.prefix == null)
      return null;
    const bindingPower = operatorGroup.prefix.bindingPower;
    const argument = this.parseSubline(elements, scope, bindingPower);
    return operatorGroup.prefix.expression.creator(argument);
  }
  parseElement(elements, scope, getNextElement) {
    const element2 = elements.shift();
    if (!element2) {
      throw new Error("PANIC NO ELEMENT");
    }
    if (element2.type == "Literal") {
      return this.parseLiteral(element2, scope);
    } else if (element2.type == "Block") {
      return this.parseBlock(element2, scope);
    } else if (element2.type == "Identifier") {
      return this.parseMaybePrefixOperator(element2, elements, scope) ?? this.parseIdentifier(element2, scope);
    } else if (element2.type == "Group") {
      return this.parseGroup(element2, scope);
    } else if (element2.type == "Line") {
      return this.parseLine(element2, scope, getNextElement);
    }
  }
  isFirstGetCommand(elements, scope) {
    if (elements.length < 1)
      return null;
    const element2 = elements[0];
    if (element2.type != "Identifier")
      return null;
    const scopeElement = scope.readElement(element2.value);
    if (!scopeElement || scopeElement.type != "Command")
      return null;
    elements.shift();
    return scopeElement;
  }
  parseSubline(elements, scope, rightBindingPower = 0) {
    let element2 = elements[0];
    if (!element2) {
      throw new Error("PANIC: Subline is empty - this should never happend at this stage of evaluating");
    }
    let left = this.parseElement(elements, scope);
    while (this.shouldParseInfixOrPostfix(elements[0], scope)) {
      element2 = elements[0];
      if (!element2 || element2.type != "Identifier")
        break;
      const operatorGroup = scope.readElement(element2.value);
      if (!operatorGroup || operatorGroup.type != "OperatorGroup") {
        throw new Error("PANIC: OperatorGroup not found - add error message in future");
      }
      if (operatorGroup.postfix != null) {
        const bindingPower = operatorGroup.postfix.bindingPower;
        if (bindingPower > rightBindingPower) {
          left = operatorGroup.postfix.expression.creator(left);
          element2 = elements.shift();
          continue;
        }
      }
      if (operatorGroup.infix != null) {
        const bindingPower = operatorGroup.infix.bindingPower;
        if (bindingPower > rightBindingPower || bindingPower == rightBindingPower && operatorGroup.infix.isRightBinded) {
          const oldElement = element2;
          element2 = elements.shift();
          const right = this.parseSubline(elements, scope, bindingPower);
          left = operatorGroup.infix.expression.creator(left, right);
          continue;
        }
      }
      break;
    }
    return left;
  }
  parseLine(line, scope, getNextElement, firstCanBeCommand = true) {
    const elements = line.elements;
    const command = this.isFirstGetCommand(elements, scope);
    let last = elements.last();
    while (last && last.type == "Identifier" && line.isJoinable) {
      const scopeElement = scope.readElement(last.value);
      if (scopeElement && "isLineJoiner" in scopeElement && getNextElement) {
        const next = getNextElement();
        if (next.type != "Line")
          break;
        elements.push(...next.elements);
        last = elements.last();
      } else {
        break;
      }
    }
    const sublines = [];
    while (elements.length > 0) {
      const subline = this.parseSubline(elements, scope, 0);
      sublines.push(subline);
    }
    if (command) {
      return {
        type: "CallCommandExpression",
        command,
        arguments: sublines
      };
    } else {
      if (sublines.length == 1)
        return sublines[0];
      console.dir(sublines, { depth: null });
      console.error("Line have more than one expression");
    }
  }
  shouldParseInfixOrPostfix(token, scope) {
    if (!token)
      return false;
    if (token.type != "Identifier")
      return false;
    const scopeElement = scope.readElement(token.text);
    if (!scopeElement || scopeElement.type != "OperatorGroup")
      return false;
    return scopeElement.postfix != null || scopeElement.infix != null;
  }
  parse(element2, scope = new Scope) {
    return this.parseElement([element2], scope);
  }
}

// src/app.ts
function renderToken(token) {
  const type = token.text != "Array" && token.text != "Map" ? token.type : "Hint";
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
