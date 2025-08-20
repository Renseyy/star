<?php

namespace Star\Php;

require 'vendor/autoload.php';



$code = file_get_contents(__DIR__ . '/../test.sr');

$tokenizer = new Tokenizer($code);
$tokens = $tokenizer->tokenize();

// $parser = new Parser($tokens);
// $ast = $parser->parse();

print_r($code);
print_r($tokens);
// print_r($ast);
