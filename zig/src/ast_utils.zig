const ASTNode = @import("ast.zig").ASTNode;

pub fn findSmallestNode(ast: []*ASTNode, changeStart: usize, changeEnd: usize) ?*ASTNode {
    var smallest: ?*ASTNode = null;

    fn visit(node: *ASTNode, changeStart: usize, changeEnd: usize, smallest: *?*ASTNode) void {
        if (node.start <= changeStart and node.end >= changeEnd) {
            if (smallest.* == null or (node.end - node.start) < ((*smallest.*).end - (*smallest.*).start)) {
                smallest.* = node;
            }
            switch (node.node_type) {
                .Assignment => {
                    visit(node.data.Assignment.left, changeStart, changeEnd, smallest);
                    visit(node.data.Assignment.right, changeStart, changeEnd, smallest);
                },
                .Binary => {
                    visit(node.data.Binary.left, changeStart, changeEnd, smallest);
                    visit(node.data.Binary.right, changeStart, changeEnd, smallest);
                },
                .Block => {
                    for (node.data.Block) |child| {
                        visit(child, changeStart, changeEnd, smallest);
                    }
                },
                .Call => {
                    visit(node.data.Call.callee, changeStart, changeEnd, smallest);
                    for (node.data.Call.args) |arg| {
                        visit(arg, changeStart, changeEnd, smallest);
                    }
                },
                .Member => {
                    visit(node.data.Member.object, changeStart, changeEnd, smallest);
                    visit(node.data.Member.property, changeStart, changeEnd, smallest);
                },
                else => {},
            }
        }
    }

    for (ast) |node| {
        visit(node, changeStart, changeEnd, &smallest);
    }

    return smallest;
}