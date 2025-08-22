<?php

namespace Star\Php;

require './vendor/autoload.php';



$code = file_get_contents(__DIR__ . '/../test.sr');

$tokenizer = new Tokenizer($code);
$tokens = $tokenizer->tokenize();

$operatorRegistry = new OperatorRegistry();
$operatorRegistry->define('+', 10, associativity: Associativity::LEFT, infix: true);
$operatorRegistry->define('=', 5, associativity: Associativity::RIGHT, infix: true);
$parser = new Parser($operatorRegistry, $tokens);
$ast = $parser->parseBlock();
if ($parser->hasErrors()) {
    print_r($parser->getErrors());
}
print_r($ast);
