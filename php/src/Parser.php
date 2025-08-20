<?php

namespace Star\Php;

use Exception;

class Parser
{

    private int $i = 0;


    /**
     * @param array<Token> $tokens
     */
    public function __construct(
        private array $tokens
    ) {}

    private function peek(): Token
    {
        return $this->tokens[$this->i] ?? new Token(TokenType::SEMICOLON, ";", $this->i, $this->i, 0, 0);
    }

    private function hasToken(): bool
    {
        return $this->i < count($this->tokens);
    }

    private function consume(): Token
    {
        return $this->tokens[$this->i++];
    }

    private function expect(TokenType $type): Token
    {
        $tok = $this->consume();
        if ($tok->type !== $type) {
            throw new Exception("Expected {$type->value}, got {$tok->type->value}");
        }
        return $tok;
    }

    private function match(TokenType ...$types): bool
    {
        foreach ($types as $type) {
            if ($this->peek()->type === $type) return true;
        }
        return false;
    }

    private function skipSeparators(): void
    {
        while ($this->hasToken() && ($this->match(TokenType::LINE_SEPARATOR) || $this->match(TokenType::SEMICOLON))) {
            $this->consume();
        }
    }

    private function getBinaryPrecedence(TokenType $type): array
    {
        // [precedence, associativityRight]
        return match ($type) {
            TokenType::SET_TO => [1, true],
            TokenType::LOGICAL_OR => [2, false],
            TokenType::LOGICAL_AND => [3, false],
            TokenType::IS, TokenType::SAME => [4, false],
            TokenType::LEFT_ANGLE, TokenType::RIGHT_ANGLE => [6, false],
            TokenType::SET_OR, TokenType::SET_AND => [7, false],
            TokenType::PLUS, TokenType::MINUS => [10, false],
            TokenType::STAR, TokenType::DIV, TokenType::FRAC, TokenType::MOD => [20, false],
            TokenType::POWER => [30, true],
            default => [0, false],
        };
    }

    private function isBinaryOperator(Token $token): bool
    {
        return in_array($token->type, [
            TokenType::SET_TO,
            TokenType::LOGICAL_OR,
            TokenType::LOGICAL_AND,
            TokenType::IS,
            TokenType::SAME,
            TokenType::LEFT_ANGLE,
            TokenType::RIGHT_ANGLE,
            TokenType::SET_OR,
            TokenType::SET_AND,
            TokenType::PLUS,
            TokenType::MINUS,
            TokenType::STAR,
            TokenType::DIV,
            TokenType::FRAC,
            TokenType::MOD,
            TokenType::POWER,
        ], true);
    }

    public function parse(): array
    {
        $nodes = [];
        $this->skipSeparators();
        while ($this->hasToken()) {
            $expr = $this->parseExpression(0);
            $nodes[] = $expr;
            $this->skipSeparators();
            if (!$this->hasToken()) break;
        }
        return $nodes;
    }

    private function parseExpression(int $minPrecedence = 0): ASTNode
    {
        $left = $this->parseUnaryOrPrimary();

        while ($this->hasToken() && $this->isBinaryOperator($this->peek())) {
            [$prec, $isRightAssoc] = $this->getBinaryPrecedence($this->peek()->type);
            if ($prec < $minPrecedence || $prec === 0) break;

            $op = $this->consume();
            $nextMinPrec = $isRightAssoc ? $prec : $prec + 1;
            $right = $this->parseExpression($nextMinPrec);

            if ($op->type === TokenType::SET_TO) {
                if ($left->type !== "Identifier") {
                    throw new Exception("Left-hand side of assignment must be an identifier");
                }
                $left = new ASTNode("Assignment", $left->start, $right->end, [
                    "left" => $left,
                    "right" => $right,
                ]);
            } else {
                $left = new ASTNode("BinaryExpression", $left->start, $right->end, [
                    "op" => $op->value,
                    "left" => $left,
                    "right" => $right,
                ]);
            }
        }

        return $left;
    }

    private function parseUnaryOrPrimary(): ASTNode
    {
        $tok = $this->peek();
        // Unary operators
        if (in_array($tok->type, [TokenType::PLUS, TokenType::MINUS, TokenType::LOGICAL_NOT], true)) {
            $op = $this->consume();
            $expr = $this->parseUnaryOrPrimary();
            return new ASTNode("UnaryExpression", $op->start, $expr->end, [
                "op" => $op->value,
                "argument" => $expr,
            ]);
        }

        switch ($tok->type) {
            case TokenType::NUMBER:
                $this->consume();
                return new ASTNode("NumberLiteral", $tok->start, $tok->end, $tok->value);
            case TokenType::STRING:
                $this->consume();
                return new ASTNode("StringLiteral", $tok->start, $tok->end, $tok->value);
            case TokenType::IDENTIFIER:
                $this->consume();
                return new ASTNode("Identifier", $tok->start, $tok->end, $tok->value);
            case TokenType::LEFT_PAREN:
                $this->consume();
                $expr = $this->parseExpression(0);
                $this->expect(TokenType::RIGHT_PAREN);
                return $expr;
            default:
                throw new Exception("Unexpected token {$tok->type->value}");
        }
    }
}
