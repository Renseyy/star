const std = @import("std");
const tokenizer = @import("tokenizer.zig");
const parser = @import("parser.zig");
const ast = @import("ast.zig");

pub fn main() !void {
    var gpa = std.heap.page_allocator;
    var stdin = std.io.getStdIn().reader();
    var stdout = std.io.getStdOut().writer();
    var buf: [8192]u8 = undefined;

    while (true) {
        // Read one line of JSON input
        const line = try stdin.readUntilDelimiterOrEof(&buf, '\n');
        if (line != null and line.?.len == 0) break;

        // Parse JSON
        var parsed = try std.json.parseFromSlice(std.json.Value, gpa, line, .{});
        defer parsed.deinit();

        const cmd = parsed.value.Object.get("cmd").?.String;

        if (std.mem.eql(u8, cmd, "getTokens")) {
            const text = parsed.value.Object.get("text").?.String;
            const tokens = try tokenizer.tokenize(gpa, text);

            try stdout.writeAll("[");
            for (tokens, 0..) |tok, idx| {
                if (idx != 0) try stdout.writeAll(",");
                try stdout.print("{{\"type\":\"{s}\",\"value\":\"{s}\",\"start\":{},\"end\":{},\"line\":{},\"col\":{}}}", .{ @tagName(tok.typ), tok.value, tok.start, tok.end, tok.line, tok.col });
            }
            try stdout.writeAll("]\n");
        } else if (std.mem.eql(u8, cmd, "getAST")) {
            const text = parsed.value.Object.get("text").?.String;
            const tokens = try tokenizer.tokenize(&gpa, text);
            const nodes = try parser.parse(&gpa, tokens);

            try stdout.writeAll("[");
            for (nodes, 0..) |node, idx| {
                if (idx != 0) try stdout.writeAll(",");
                try printNode(stdout, node);
            }
            try stdout.writeAll("]\n");
        }
    }
}

fn printNode(writer: anytype, node: *ast.ASTNode) !void {
    switch (node.node_type) {
        .NumberLiteral => try writer.print("{{\"type\":\"NumberLiteral\",\"value\":\"{s}\"}}", .{node.data.NumberLiteral}),
        .StringLiteral => try writer.print("{{\"type\":\"StringLiteral\",\"value\":\"{s}\"}}", .{node.data.StringLiteral}),
        .Identifier => try writer.print("{{\"type\":\"Identifier\",\"name\":\"{s}\"}}", .{node.data.Identifier}),
        .Assignment => try writer.print("{{\"type\":\"Assignment\"}}", .{}),
        .Binary => try writer.print("{{\"type\":\"Binary\",\"op\":\"{s}\"}}", .{node.data.Binary.op}),
        else => try writer.print("{{\"type\":\"Unknown\"}}", .{}),
    }
}
