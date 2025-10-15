# Etapy parsowania

### 1) Tokenizacja [x]

> zamieniamy wszystko na tokeny, oraz oznaczamy tokeny nieznaczące

### 2) Parsowanie [~]

> tworzymy abstrakcyjne drzewo składni - rozwiązujemy operatory oraz komendy. Dodajemy o tym informację do tokenów

### 3) Zrozumienie [ ]

> sprawdzamy typy, rozwiązyjemy niejednoznaczności - sprawdzamy, czy program ma sens, optymalizujemy

### 4) Kompilacja [ ]

> Zmieniamy program na odpowiedni język docelowy

### 5) Uruchomienie

# MetaScope

! Wszystko jest konstruktorem, chyba, że jest danymi. Programowanie objektowe jest tak na prawdę abstrakcją nad tym. Przykład:

// Tworzymy konstruktor funkcji

```
#constructor Function arguments {
    // zasięg wywołania przechowany jest w zmiennej  oznaczonej jako drugi argument ( w tym przypadku `arguments` )
    // jest to dowolny zasięg, ale możemy to zmienić, używając na nim `#set_parameters arguments`. Jednocześnie wymusi to walidację zwracanego przez arguments typów na kroktę
    // Zwracamy funkcję, która jest tylko Archetypem,
    #register #archetype Function
}
```

# Metaderektywy

## `##define_operator`

> symbol: `#Identifier`, pierwszeństwo: `#UInt`, type: `LEFT | RIGHT | BEFORE | AFTER`

### Domyślne flagi

> `is_line_continuation`: `#FALSE`

### `##operator_flag_set`

> flag_name: `is_line_continuation`, value: `#Boolean`

## `##define_default_constructor`

> identifier: `##Expression`

### `#archetype`

Tworzy nowy archetyp. Przyjmuje dwie wartości - nazwę bazową i argumenty generyczne

# Fazy:

1. Tokenizacja [tekst -> tablica tokenów]
2. Parsowanie [tablica tokenów -> abstrakcyjne drzewo składni] {Meta stos}
3. Sprawdzanie

# Symbole

> Oznaczamy je wiekimi literami

-   `#PARAMS` - oznacza miejsce w pamięci, w którym przechowywane są parametry obecnego wyrażenia

-   `#INFIX_OPERATOR {name}` - symbol operatora dwuargumentowego o nazwie `name`

-   `#PREFIX_OPERATOR {name}`

-   `#POSTFIX_OPERATOR {name}`

-   `#TRUE` - substytut wartości prawdziwej
-   `#FALSE`

# Dyrektywy parsowania

> Wpływają na działanie podczas kompilacji  
> Oznaczamy je przedroskiem `#@`

## `#@define`

> `symbol` `code`

## `#@use`

> `symbol` `scope`

Wstawia w miejsce zdefiniowane wcześniej przy użyciu `#@define` fragment drzewa i przeprowadza jego przeparsowanie

## `#@param`

## `#$`

> `index`  
> Odczytuje z obecnego zasięgu `#PARAMS` argument o danym indeksie a następnie przeparsowuje wynik

## `#@param_pop`

Zwraca najwyższy paraemtr iteratora `#PARAMS` w obecnym zasięgu, a następnie inkrementuje jego index

## `#@define_archetype_operator`

Jest skrótem dla

```
#@define_operator #@1 #@2 #@3 #call #
```

# Przykłady

## Definiowanie makro

```
#@define #MACRO archetype_operator #call #member_of #%archetype_of #$ left #$ operator {
    #@define #SELF #$ left
    #@define #PARAM 0 right
}
```

## Defitiowanie operatora

```
#define + #INFIX_OPERATOR {
    #define precedence 10
    #define is_right_associative #TRUE
} #defer #use #MACRO {
    #define #PARAM left $0
    #define #PARAM operator +
    #define #PARAM right $1
}
```

```
#def :: #INFIX_OPERATOR {
    #def precedence 10
    #def is_right_associative #TRUE
} #argumented #set_const #auto_memory #@left #@right
```
