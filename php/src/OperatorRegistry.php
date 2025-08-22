<?php

namespace Star\Php;

enum OperatorType
{
    case PREFIX;
    case INFIX;
    case POSTFIX;
}

enum Associativity
{
    case LEFT;
    case RIGHT;
}
class OperatorDefinition
{
    public function __construct(
        public string $symbol,
        public ?int $precedence = null,
        public ?Associativity $associativity = null,
        public bool $isPrefix = false,
        public bool $isInfix = false,
        public bool $isPostfix = false,
    ) {}
}

class OperatorRegistry
{
    private array $prefixOperators = [];
    private array $infixOperators = [];
    private array $postfixOperators = [];

    public function define(
        string $symbol,
        ?int $precedence = null,
        ?Associativity $associativity = null,
        bool $prefix = false,
        bool $infix = false,
        bool $postfix = false
    ): void {
        $definition = new OperatorDefinition($symbol, $precedence, $associativity, $prefix, $infix, $postfix);

        if ($prefix) {
            $this->prefixOperators[$symbol]  = $definition;
        }
        if ($infix) {
            $this->infixOperators[$symbol]   = $definition;
        }
        if ($postfix) {
            $this->postfixOperators[$symbol] = $definition;
        }
    }

    public function getPrefixOperator(string $symbol): ?OperatorDefinition
    {
        return $this->prefixOperators[$symbol] ?? null;
    }

    public function getInfixOperator(string $symbol): ?OperatorDefinition
    {
        return $this->infixOperators[$symbol] ?? null;
    }

    public function getPostfixOperator(string $symbol): ?OperatorDefinition
    {
        return $this->postfixOperators[$symbol] ?? null;
    }

    public function allSymbols(): array
    {
        $set = array_unique(array_merge(
            array_keys($this->prefixOperators),
            array_keys($this->infixOperators),
            array_keys($this->postfixOperators),
        ));
        usort($set, fn($a, $b) => strlen($b) <=> strlen($a)); // longest first
        return $set;
    }
}
