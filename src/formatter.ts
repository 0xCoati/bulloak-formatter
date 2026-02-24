interface FlatNode {
  depth: number;
  text: string;
}

interface TreeNode {
  depth: number;
  text: string;
  children: TreeNode[];
}

// Strip tree connector characters and return plain text.
// e.g. "│   ├── When something" → "When something"
function stripTreeConnector(line: string): string {
  return line.replace(/^((?:│   |    )*)(?:├── |└── )?/, "").trim();
}

// Parse a single non-empty line into a {depth, text} pair.
//
// Two input formats are handled:
//   tree format:       "(│   |    )*(├── |└── )text"
//   whitespace format: "  text" (2 spaces per depth level, relative to depth 1)
//
// isRoot=true means this is the first line of a block and always returns depth 0.
function parseLine(raw: string, isRoot: boolean): FlatNode {
  const line = raw.replace(/\t/g, "  ");

  if (isRoot) {
    return { depth: 0, text: stripTreeConnector(line) };
  }

  // Already in tree format?
  const treeMatch = line.match(/^((?:│   |    )*)(?:├── |└── )(.+)$/);
  if (treeMatch) {
    // Each prefix group is exactly 4 chars: "│   " or "    "
    const depth = treeMatch[1].length / 4 + 1;
    return { depth, text: treeMatch[2].trimEnd() };
  }

  // Whitespace format: leading spaces determine depth.
  // 0 spaces → depth 1, 2 spaces → depth 2, 4 spaces → depth 3, …
  const wsMatch = line.match(/^( *)(\S.*)$/);
  if (wsMatch) {
    const depth = Math.floor(wsMatch[1].length / 2) + 1;
    return { depth, text: wsMatch[2].trimEnd() };
  }

  return { depth: 1, text: line.trim() };
}

// Build a TreeNode hierarchy from an array of raw lines.
function buildTree(lines: string[]): TreeNode {
  const root: TreeNode = { depth: 0, text: "", children: [] };

  // Find the first non-empty line — it becomes the root.
  let start = 0;
  while (start < lines.length && lines[start].trim() === "") {
    start++;
  }
  if (start >= lines.length) return root;

  root.text = stripTreeConnector(lines[start].replace(/\t/g, "  "));

  const stack: TreeNode[] = [root];

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;

    const flat = parseLine(line, false);
    const node: TreeNode = { depth: flat.depth, text: flat.text, children: [] };

    // Walk up the stack until we find a node shallower than this one.
    while (stack.length > 1 && stack[stack.length - 1].depth >= node.depth) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  return root;
}

// Render a TreeNode hierarchy back to a bulloak .tree string.
function renderTree(root: TreeNode): string {
  const output: string[] = [root.text];

  function renderChildren(children: TreeNode[], prefix: string): void {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const isLast = i === children.length - 1;
      output.push(prefix + (isLast ? "└── " : "├── ") + child.text);
      renderChildren(child.children, prefix + (isLast ? "    " : "│   "));
    }
  }

  renderChildren(root.children, "");
  return output.join("\n");
}

// Main entry point. Accepts the full document text and returns the formatted text.
// Blocks are separated by one or more empty lines; each block is formatted independently.
// The function is idempotent: already-formatted lines are stripped and re-rendered.
export function format(content: string): string {
  const lines = content.split("\n");

  // Group consecutive non-empty lines into blocks.
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    blocks.push(current);
  }

  if (blocks.length === 0) return content;

  const formatted = blocks.map((b) => renderTree(buildTree(b))).join("\n\n");

  // Preserve a trailing newline if the original had one.
  return content.endsWith("\n") ? formatted + "\n" : formatted;
}
