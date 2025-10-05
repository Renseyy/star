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
1) Tokenizacja [tekst -> tablica tokenów]
2) Parsowanie [tablica tokenów -> abstrakcyjne drzewo składni] {Meta stos}
3) Sprawdzanie 