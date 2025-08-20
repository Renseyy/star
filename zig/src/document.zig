const std = @import("std");
const Token = @import("tokenizer.zig").Token;
const ASTNode = @import("ast.zig").ASTNode;

pub const Document = struct {
    text: []u8,
    tokens: []Token,
    ast: []*ASTNode,
};
