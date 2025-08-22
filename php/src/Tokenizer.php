<?php

declare(strict_types=1);

namespace Star\Php;

use Exception;
use IntlChar;

class Token
{
    public function __construct(
        public TokenType $type,
        public string $value,
        public int $start,
        public int $end,
        public int $line,
        public int $column,
    ) {}
}

enum TokenType: string
{
    case END_OF_TOKENS = "End of tokens";
    case END_OF_LINE = "New line";
    case IDENTIFIER = "Identifier";
    case NUMBER = "Number";
    case STRING = "String";
    case META_COMMAND = "Meta command";


    case SET_TO = "=";
    case GUARD = ":";
    case DECLARE= "::";

    case IS = "==";
    case SAME = "===";

    case LEFT_PAREN = "(";
    case RIGHT_PAREN = ")";
    case LEFT_BRACE = "{";
    case RIGHT_BRACE = "}";
    case LEFT_BRACKET = "[";
    case RIGHT_BRACKET = "]";
    case RESOURCE = "Resource";

    case COMMA = ",";
    case DOT = ".";
    case SEMICOLON = ";";

    case MAYBE = "?";
}

function times(int $n, callable $fn)
{
    for ($i = 0; $i < $n; $i++) {
        $fn();
    }
}

class Tokenizer
{
    public const ALLOWED_IDENTIFIER_EXTRA_CHARS = [
        '+',
        '-',
        '*',
        '/',
        '\\',
        '!',
        '|',
        '&',
        '^',
        '~',
        '%',
        '=',
        '<',
        '>',
        '?',
    ];

    private string $input;
    private int $index = 0;
    private int $line = 1;
    private int $column = 1;
    private int $length;

    private array $specialChars =
    [
        "::" => TokenType::DECLARE,
        "=" => TokenType::SET_TO,
        "(" => TokenType::LEFT_PAREN,
        ")" => TokenType::RIGHT_PAREN,
        "{" => TokenType::LEFT_BRACE,
        "}" => TokenType::RIGHT_BRACE,
        "[" => TokenType::LEFT_BRACKET,
        "]" => TokenType::RIGHT_BRACKET,
        ":" => TokenType::GUARD,
        "," => TokenType::COMMA,
        "." => TokenType::DOT,
        ";" => TokenType::SEMICOLON,
        "?" => TokenType::MAYBE
    ];
    public function __construct(string $input)
    {
        $this->input = $input;
        $this->length = strlen($input);
        uksort($this->specialChars, fn($a, $b) => strlen($b) - strlen($a));
    }

    public function getChar(): string
    {
        return $this->input[$this->index] ?? '\0';
    }

    public function next(bool $newLine = false): bool
    {
        $this->index++;
        if ($newLine) {
            $this->line++;
            $this->column = 1;
        } else {
            $this->column++;
        }
        return ($this->index < $this->length);
    }

    public function match(string $char): bool
    {
        return substr($this->input, $this->index, strlen($char)) === $char;
    }

    public function tokenize(): array
    {
        $char = fn() => $this->getChar();
        $isIdentifierChar = function (bool $start = false) use ($char) {
            return (IntlChar::isalpha($char()) || $char() === "_") || in_array($char(), self::ALLOWED_IDENTIFIER_EXTRA_CHARS) || (!$start && ctype_digit($char()));
        };
        $tokens = [];
        while ($this->index < $this->length) {
            $start = $this->index;
            $startColumn = $this->column;

            // Whitespace
            if (ctype_space($char())) {
                if ($char() === "\n") {
                    if (end($tokens)?->type !== TokenType::END_OF_LINE) {
                        $tokens[] = new Token(TokenType::END_OF_LINE, "\n", $this->index, $this->index + 1, $this->line, $startColumn);
                    }

                    $this->next(true);
                } else $this->next();
                continue;
            }

            // Identifiers
            if ($isIdentifierChar(true)) {
                $ident = "";
                while ($isIdentifierChar()) {
                    $ident .= $char();
                    $this->next();
                }
                $tokens[] = new Token(TokenType::IDENTIFIER, $ident, $start, $this->index, $this->line, $startColumn);
                continue;
            }

            if ($char() === "#") {
                $this->next();
                $metaCommand = "";
                while ($isIdentifierChar()) {
                    $metaCommand .= $char();
                    $this->next();
                }
                $tokens[] = new Token(TokenType::META_COMMAND, $metaCommand, $start, $this->index, $this->line, $startColumn);
                continue;
            }

            // Numbers
            if (ctype_digit($char())) {
                $num = "";
                while (ctype_digit($char())) {
                    $num .= $char();
                    $this->next();
                }
                $tokens[] = new Token(TokenType::NUMBER, $num, $start, $this->index, $this->line, $startColumn);
                continue;
            }

            // Strings
            if ($char() === '"') {
                $this->next();
                $str = "";
                $lastWasEscape = false;
                while ($this->input[$this->index] !== '"' || $lastWasEscape) {
                    $lastWasEscape = $char() === "\\";
                    $str .= $char();
                    $this->next();
                }
                $this->next();
                $tokens[] = new Token(TokenType::STRING, $str, $start, $this->index, $this->line, $startColumn);
                continue;
            }


            foreach ($this->specialChars as $key => $value) {
                if ($this->match($key)) {
                    times(strlen($key), fn() => $this->next());
                    $tokens[] = new Token($value, $key, $start, $this->index, $this->line, $startColumn);
                    continue 2;
                }
            }

            throw new Exception("Unexpected character '{$char()}' at line {$this->line}, col {$this->column}");
        }
        return $tokens;
    }
}
