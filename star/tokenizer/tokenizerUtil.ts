export function isValidIdentifier(
	character: string,
	notStartingCharacter: boolean = true
) {
	const code = character.charCodeAt(0);
	if (code == 33) return true;
	if (code > 32 && code < 39) return true;
	if (code == 42 || code == 43 || (code > 44 && code < 48)) return true;
	if (code == 58) return true;
	if (code > 59 && code < 65) return true;
	if (code == 92) return true;
	if (code == 94) return true;
	if (code == 95) return notStartingCharacter;
	if (code == 124 || code == 126) return true;
	return false;
}

export function isValidAlphaNumericIdentifier(
	character: string,
	notStartingCharacter: boolean = true
) {
	const code = character.charCodeAt(0);
	if (code > 47 && code < 58) return notStartingCharacter;
	if (code > 64 && code < 91) return true;
	if (code == 95) return true;
	if (code > 96 && code < 123) return true;
	return false;
}

export function isSpace(character: string) {
	return [' ', '\t', '\f', '\v'].includes(character);
}

export function isLineSeparator(character: string) {
	return character == '\r' || character == '\n';
}

export function isDigit(character: string) {
	return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(
		character
	);
}

export function isNewline(charater: string) {
	return charater == '\n';
}
