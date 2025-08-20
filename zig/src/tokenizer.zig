const std = @import("std");

pub const TokenType = enum {
    Identifier,
    Number,
    String,
    Equal,
    Plus,
    Minus,
    Star,
    Slash,
    LParen,
    RParen,
    LBrace,
    RBrace,
    Colon,
    Comma,
    Dot,
    Semicolon,
    Eof,
};

pub const Token = struct {
    typ: TokenType,
    value: []const u8,
    start: usize,
    end: usize,
    line: usize,
    col: usize,
};

pub fn tokenize(allocator: *std.mem.Allocator, input: []const u8) ![]Token {
    var tokens = std.ArrayList(Token).init(allocator);
    var i: usize = 0;
    var line: usize = 1;
    var col: usize = 1;

    while (i < input.len) {
        const ch = input[i];
        const start = i;
        const startCol = col;

        if (std.ascii.isWhitespace(ch)) {
            if (ch == '\n') {
                line += 1;
                col = 1;
            } else col += 1;
            i += 1;
            continue;
        }

        // Identifiers
        if (std.ascii.isAlphabetic(ch) or ch == '_') {
            const ident_start = i;
            while (i < input.len and (std.ascii.isAlphanumeric(input[i]) or input[i] == '_')) {
                i += 1;
                col += 1;
            }
            try tokens.append(.{
                .typ = .Identifier,
                .value = input[ident_start..i],
                .start = ident_start,
                .end = i,
                .line = line,
                .col = startCol,
            });
            continue;
        }

        // Numbers
        if (std.ascii.isDigit(ch)) {
            const num_start = i;
            while (i < input.len and std.ascii.isDigit(input[i])) {
                i += 1;
                col += 1;
            }
            try tokens.append(.{
                .typ = .Number,
                .value = input[num_start..i],
                .start = num_start,
                .end = i,
                .line = line,
                .col = startCol,
            });
            continue;
        }

        // Strings
        if (ch == '"') {
            i += 1;
            col += 1;
            const str_start = i;
            while (i < input.len and input[i] != '"') {
                if (input[i] == '\n') {
                    line += 1;
                    col = 1;
                } else col += 1;
                i += 1;
            }
            if (i >= input.len) return error.UnterminatedString;
            const str_end = i;
            i += 1;
            col += 1; // skip closing "
            try tokens.append(.{
                .typ = .String,
                .value = input[str_start..str_end],
                .start = str_start,
                .end = str_end,
                .line = line,
                .col = startCol,
            });
            continue;
        }

        // Single-char tokens
        const single = switch (ch) {
            '=' => .Equal,
            '+' => .Plus,
            '-' => .Minus,
            '*' => .Star,
            '/' => .Slash,
            '(' => .LParen,
            ')' => .RParen,
            '{' => .LBrace,
            '}' => .RBrace,
            ':' => .Colon,
            ',' => .Comma,
            '.' => .Dot,
            ';' => .Semicolon,
            else => null,
        };
        if (single) |typ| {
            try tokens.append(.{
                .typ = typ,
                .value = input[start .. start + 1],
                .start = start,
                .end = start + 1,
                .line = line,
                .col = startCol,
            });
            i += 1;
            col += 1;
            continue;
        }

        return error.UnexpectedCharacter;
    }

    try tokens.append(.{
        .typ = .Eof,
        .value = "",
        .start = i,
        .end = i,
        .line = line,
        .col = col,
    });

    return tokens.toOwnedSlice();
}
