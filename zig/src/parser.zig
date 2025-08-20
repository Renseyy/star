const std = @import("std");
const Token = @import("tokenizer.zig").Token;
const TokenType = @import("tokenizer.zig").TokenType;
const ASTNode = @import("ast.zig").ASTNode;
const NodeType = @import("ast.zig").NodeType;

pub const ParseError = error{ UnexpectedToken, UnexpectedEOF };

fn peek(tokens: []Token, i: usize) Token {
    return tokens[i];
}

fn consume(i: *usize) void {
    i.* += 1;
}

fn parsePrimary(allocator: *std.mem.Allocator, tokens: []Token, i: *usize) !*ASTNode {
    const tok = peek(tokens, i.*);
    switch (tok.typ) {
        .Number => {
            consume(i);
            const node = try allocator.create(ASTNode);
            node.* = .{
                .node_type = .NumberLiteral,
                .start = tok.start,
                .end = tok.end,
                .data = .{ .NumberLiteral = tok.value },
            };
            return node;
        },
        .String => {
            consume(i);
            const node = try allocator.create(ASTNode);
            node.* = .{
                .node_type = .StringLiteral,
                .start = tok.start,
                .end = tok.end,
                .data = .{ .StringLiteral = tok.value },
            };
            return node;
        },
        .Identifier => {
            consume(i);
            const node = try allocator.create(ASTNode);
            node.* = .{
                .node_type = .Identifier,
                .start = tok.start,
                .end = tok.end,
                .data = .{ .Identifier = tok.value },
            };
            return node;
        },
        .LParen => {
            consume(i);
            const expr = try parseExpression(allocator, tokens, i);
            if (peek(tokens, i.*).typ != .RParen) return ParseError.UnexpectedToken;
            consume(i);
            return expr;
        },
        else => return ParseError.UnexpectedToken,
    }
}

fn parseExpression(allocator: *std.mem.Allocator, tokens: []Token, i: *usize) !*ASTNode {
    const left = try parsePrimary(allocator, tokens, i);

    // Assignment
    if (peek(tokens, i.*).typ == .Equal) {
        consume(i);
        const right = try parseExpression(allocator, tokens, i);
        const node = try allocator.create(ASTNode);
        node.* = .{
            .node_type = .Assignment,
            .start = left.start,
            .end = right.end,
            .data = .{ .Assignment = .{ .left = left, .right = right } },
        };
        return node;
    }

    // Binary ops (+, -)
    if (peek(tokens, i.*).typ == .Plus or peek(tokens, i.*).typ == .Minus) {
        const opTok = peek(tokens, i.*);
        consume(i);
        const right = try parseExpression(allocator, tokens, i);
        const node = try allocator.create(ASTNode);
        node.* = .{
            .node_type = .Binary,
            .start = left.start,
            .end = right.end,
            .data = .{ .Binary = .{ .op = opTok.value, .left = left, .right = right } },
        };
        return node;
    }

    return left;
}

pub fn parse(allocator: *std.mem.Allocator, tokens: []Token) ![]*ASTNode {
    var nodes = std.ArrayList(*ASTNode).init(allocator);
    var i: usize = 0;

    while (tokens[i].typ != .Eof) {
        const expr = try parseExpression(allocator, tokens, &i);
        try nodes.append(expr);
        if (tokens[i].typ == .Semicolon) consume(&i);
    }

    return nodes.toOwnedSlice();
}
