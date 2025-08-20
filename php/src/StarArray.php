<?php declare(strict_types=1);

/**
 * @template T
 */
class StarArray {
    private $container;
    public $index;

    /**
     * @return T | null
     */
    public function __invoke(
        int $index
    )
    {
        return $this->container[$index];
    }
}

/**
 * @template T
 * @param Array<T> $container
 * @return StarArray<T>
 */
function StarArray(...$container): StarArray {
    return new StarArray($container);
}