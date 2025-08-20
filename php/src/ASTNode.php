<?php

namespace Star\Php;

class ASTNode
{
    public string $type;
    public int $start;
    public int $end;
    public $data;

    public function __construct(string $type, int $start, int $end, $data = null)
    {
        $this->type = $type;
        $this->start = $start;
        $this->end = $end;
        $this->data = $data;
    }
}
