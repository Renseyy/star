<?php

declare(strict_types=1);

namespace Star\Php\Util;

class ArrayUtil
{
    public static function get(array $array, string $key, $default = null)
    {
        return $array[$key] ?? $default;
    }
}
