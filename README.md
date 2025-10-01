# MetaScope
Holds defined structs, operators, MemoryHolders (place for data)

! Wszystko jest konstruktorem, chyba, że jest danymi. Programowanie objektowe jest tak na prawdę abstrakcją nad tym. Przykład:

// Tworzymy konstruktor funkcji

#constructor Function arguments {
    // zasięg wywołania przechowany jest w zmiennej  oznaczonej jako drugi argument ( w tym przypadku `arguments` )
    // jest to dowolny zasięg, ale możemy to zmienić, używając na nim `#set_parameters arguments`. Jednocześnie wymusi to walidację zwracanego przez arguments typów na kroktę
    // Zwracamy funkcję, która jest tylko Archetypem, 
    #register #archetype Function 
}

### `#archetype`
Tworzy nowy archetyp. Przyjmuje dwie wartości - nazwę bazową i argumenty generyczne