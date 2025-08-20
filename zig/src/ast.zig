pub const NodeType = enum {
    NumberLiteral,
    StringLiteral,
    Identifier,
    Assignment,
    Binary,
    Block,
    Call,
    Member,
    TypeDecl,
};

pub const ASTNode = struct {
    node_type: NodeType,
    start: usize,
    end: usize,
    data: union(NodeType) {
        NumberLiteral: []const u8,
        StringLiteral: []const u8,
        Identifier: []const u8,
        Assignment: struct { left: *ASTNode, right: *ASTNode },
        Binary: struct { op: []const u8, left: *ASTNode, right: *ASTNode },
        Block: []*ASTNode,
        Call: struct { callee: *ASTNode, args: []*ASTNode },
        Member: struct { object: *ASTNode, property: *ASTNode },
        TypeDecl: struct { name: []const u8, typeName: []const u8 },
    },
};
