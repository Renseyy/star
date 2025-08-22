<?php

namespace Star\Php;

use Error;
use RuntimeException;
use Star\Php\Token;
use Star\Php\TokenType;
use Star\Php\Util\ArrayUtil;

/**
 * Options for parser
 * - metacomand:
 *      metacomand have very strict rules of being parsed, then have linear argument stacking, works only for one line, and can be ended with semicolon
 *      They can also affect environment in parse time like #use, #namespace, #import but also #define_value_operator and #define_meta_operator. We can also use them,
 *      to affect current memory of program, but more important to #define identifiers as some type, witch can be helpful in parsing
 */

class Parser
{

    private array $errors = [];
    private int $index = 0;
    /**
     * @param Token[] $tokens
     */
    public function __construct(private OperatorRegistry $operatorRegistry, private array $tokens) {}

    public function hasErrors(): bool
    {
        return count($this->errors) > 0;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getCurrentToken($ommitLineSeparator = false, $lazy = false): ?Token
    {
        $index = $this->index;
        $token = ArrayUtil::get($this->tokens, $index);
        while ($ommitLineSeparator && $token != null && $token->type === TokenType::END_OF_LINE) {
            $index++;
            $token = ArrayUtil::get($this->tokens, $index);
        }
        if (!$lazy) {
            $this->index = $index;
        }
        return $token;
    }

    private function advanceToken(): void
    {
        $this->index++;
    }

    public function parseAndInterpreteMetaCommand(): array
    {
        $token = $this->getCurrentToken();
        return match ($token->value) {
            'define_value_operator' => $this->parseMetaCommandDefineValueOperator(),
            default => throw new Error("Unknown metacomand #{$token->value}")
        };
    }

    private function assertExpression(array $expression, string $type, ?string $message): array
    {
        if ($expression['type'] !== $type) {
            throw new RuntimeException("Expected {$type}" . ($message ? ": {$message}" : ""));
        }
        return $expression;
    }

    public function parseMetaCommandDefineValueOperator(): array
    {
        $this->advanceToken();
        $identifier = $this->assertExpression($this->parseExpression(), 'Identifier', ' as first argument `identifier` of #define_value_operator');
        $precedence =  $this->assertExpression($this->parseExpression(), 'Number', ' as second argument `precedence` of #define_value_operator');
        $associativity = $this->parseExpression();
        return [
            'type' => 'MetaCommandDefineValueOperator',
            'identifier' => $identifier,
            'precedence' => $precedence,
            'associativity' => $associativity
        ];
    }

    public function parseBlock(bool $denoted = false): array
    {
        $expressions = [];
        while ($this->getCurrentToken() !== null) {
            $expressions[] = $this->parseLine();
            $token = $this->getCurrentToken();
            // If we have tokens to next EOL EOT, SEMICOLON or block end it means that not registered operator is used
            if ($token != null && $token->type !== TokenType::END_OF_LINE && $token->type !== TokenType::SEMICOLON) {
                $errorToken = $token;
                $to = [
                    'line' => $token->line,
                    'column' => $token->column + strlen($token->value)
                ];
                while ($token != null && $token->type !== TokenType::END_OF_LINE && $token->type !== TokenType::SEMICOLON) {
                    $this->advanceToken();
                    $token = $this->getCurrentToken();
                    if ($token != null) {
                        $to = [
                            'line' => $token->line,
                            'column' => $token->column + strlen($token->value)
                        ];
                    }
                }
                $this->errors[] = [
                    "message" => "Unexpected '{$token->value}'",
                    "from" => [
                        "line" => $errorToken->line,
                        "column" => $errorToken->column
                    ],
                    "to" => $to
                ];
            }
            $this->advanceToken();
        }
        return ['type' => 'Block', 'expressions' => $expressions];
    }

    public function parseLine(): array
    {
        return $this->parseExpression();
    }

    public function parseExpression(int $rightBindingPower = 0): array
    {
        $token = $this->getCurrentToken();
        $left = $this->parsePrefixOrLiteral($token);
        $this->advanceToken();

        while ($this->shouldParseInfixOrPostfix($rightBindingPower)) {
            $token = $this->getCurrentToken(true);

            // Postfix
            if ($token->type === TokenType::IDENTIFIER && ($def = $this->operatorRegistry->getPostfixOperator($token->value))) {
                echo 'is postfix\n';
                $bindingPower = $def->precedence ?? 0;
                if ($rightBindingPower < $bindingPower) {
                    $this->advanceToken();
                    $left = ['type' => 'PostfixUnary', 'operator' => $def->symbol, 'expression' => $left];
                    continue;
                }
            }

            // Infix
            if ($token->type === TokenType::IDENTIFIER && ($def = $this->operatorRegistry->getInfixOperator($token->value))) {
                $bindingPower = $def->precedence ?? 0;
                $condition = $def->associativity === Associativity::RIGHT ? $rightBindingPower <= $bindingPower : $rightBindingPower < $bindingPower;
                if ($condition) {
                    $this->advanceToken();
                    $right = $this->parseExpression(
                        $def->associativity === Associativity::RIGHT ? $bindingPower - 1 : $bindingPower
                    );
                    $left = ['type' => 'Binary', 'operator' => $def->symbol, 'left' => $left, 'right' => $right];
                    continue;
                }
            }
            break;
        }

        return $left;
    }



    private function parsePrefixOrLiteral(Token $token): array
    {
        return match ($token->type) {
            TokenType::NUMBER => ['type' => 'Number', 'value' => (float)$token->value],
            TokenType::IDENTIFIER => ['type' => 'Identifier', 'name' => $token->value],
            TokenType::LEFT_PAREN => $this->parseGroup(),
            TokenType::LEFT_BRACE => $this->parseBlock(true),
            TokenType::META_COMMAND => $this->parseAndInterpreteMetaCommand(),
            TokenType::STRING => ['type' => 'String', 'value' => $token->value],
            default => throw new RuntimeException("Unexpected token {$token->value}")
        };
    }

    private function parseGroup(): array
    {
        $expression = $this->parseExpression();
        if ($this->getCurrentToken()->type !== TokenType::RIGHT_PAREN) {
            throw new RuntimeException("Expected ')'");
        }
        $this->advanceToken();
        return $expression;
    }

    private function parsePrefixOperator(Token $token): array
    {
        $def = $this->operatorRegistry->getPrefixOperator($token->value);
        if (!$def) {
            throw new RuntimeException("Unexpected operator {$token->value}");
        }
        $expression = $this->parseExpression($def->precedence ?? 0);
        return ['type' => 'PrefixUnary', 'operator' => $def->symbol, 'expression' => $expression];
    }

    private function shouldParseInfixOrPostfix(int $rightBindingPower): bool
    {
        $token = $this->getCurrentToken(true, lazy: true);
        if ($token === null) return false;
        if ($token->type !== TokenType::IDENTIFIER) return false;
        $symbol = $token->value;
        return $this->operatorRegistry->getInfixOperator($symbol) !== null ||
            $this->operatorRegistry->getPostfixOperator($symbol) !== null;
    }
}
