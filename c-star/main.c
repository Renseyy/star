#include <stdio.h>

typedef enum TokenType
{
    InvalidToken,
    Space,
    LineSeparator,
    Identifier,
    String,
    Number,
    MetaDirective,
    Directive,
    Resource,
    LeftParenthesis,
    RightParenthesis,
    LeftBracket,
    RightBracket,
    LeftBrace,
    RightBrace,
    Comma,
    Semicolon,
    SingleLineComment,
} TokenType;

typedef struct Token
{
    TokenType type;

} Token;

typedef char *text;

int main()
{
    text a = "Hello World";
    printf("Hello World\n");
    return 0;
}