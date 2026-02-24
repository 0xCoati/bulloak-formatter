import { describe, it, expect } from "vitest";
import { format } from "./formatter";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Join lines with \n for readable multiline expectations. */
const lines = (...ls: string[]) => ls.join("\n");

// ─── trivial / empty ──────────────────────────────────────────────────────────

describe("empty and trivial inputs", () => {
  it("returns an empty string unchanged", () => {
    expect(format("")).toBe("");
  });

  it("returns whitespace-only input unchanged (no blocks to format)", () => {
    expect(format("   \n  \n\n")).toBe("   \n  \n\n");
  });

  it("formats a root-only block with no children", () => {
    expect(format("FooTest")).toBe("FooTest");
  });

  it("formats a root-only block preserving its trailing newline", () => {
    expect(format("FooTest\n")).toBe("FooTest\n");
  });
});

// ─── connector assignment ─────────────────────────────────────────────────────

describe("connector assignment (├── vs └──)", () => {
  it("uses └── for a single child", () => {
    expect(format("FooTest\nWhen A")).toBe("FooTest\n└── When A");
  });

  it("uses └── for the last of two siblings", () => {
    expect(format(lines("FooTest", "When A", "When B"))).toBe(
      lines("FooTest", "├── When A", "└── When B")
    );
  });

  it("uses ├── for every non-last sibling and └── for the last", () => {
    expect(format(lines("FooTest", "When A", "When B", "When C", "When D"))).toBe(
      lines("FooTest", "├── When A", "├── When B", "├── When C", "└── When D")
    );
  });

  it("corrects an incorrect ├── on the last child to └──", () => {
    expect(format("FooTest\n├── When A")).toBe("FooTest\n└── When A");
  });

  it("corrects all-├── siblings where the last should be └──", () => {
    expect(format("FooTest\n├── When A\n├── When B")).toBe(
      "FooTest\n├── When A\n└── When B"
    );
  });

  it("corrects an incorrect └── on a non-last child to ├──", () => {
    expect(format("FooTest\n└── When A\n└── When B")).toBe(
      "FooTest\n├── When A\n└── When B"
    );
  });
});

// ─── indentation / depth ──────────────────────────────────────────────────────

describe("indentation and depth (2-space per level)", () => {
  it("nests a single child at depth 2 (2-space indent)", () => {
    expect(format(lines("FooTest", "When A", "  It works"))).toBe(
      lines("FooTest", "└── When A", "    └── It works")
    );
  });

  it("nests three levels deep", () => {
    expect(
      format(lines("FooTest", "When A", "  When B", "    It works"))
    ).toBe(lines("FooTest", "└── When A", "    └── When B", "        └── It works"));
  });

  it("nests four levels deep", () => {
    expect(
      format(lines("FooTest", "When A", "  When B", "    When C", "      It works"))
    ).toBe(
      lines(
        "FooTest",
        "└── When A",
        "    └── When B",
        "        └── When C",
        "            └── It works"
      )
    );
  });

  it("handles sibling nodes at depth 2 under the same parent", () => {
    expect(
      format(lines("FooTest", "When A", "  It does X", "  It does Y"))
    ).toBe(
      lines("FooTest", "└── When A", "    ├── It does X", "    └── It does Y")
    );
  });

  it("handles multiple depth-1 nodes each with their own depth-2 children", () => {
    expect(
      format(lines("FooTest", "When A", "  It does X", "When B", "  It does Y"))
    ).toBe(
      lines(
        "FooTest",
        "├── When A",
        "│   └── It does X",
        "└── When B",
        "    └── It does Y"
      )
    );
  });
});

// ─── pipe prefix rules ────────────────────────────────────────────────────────

describe("pipe prefix (│    vs     )", () => {
  it("uses │    prefix for children of a non-last node", () => {
    expect(
      format(lines("FooTest", "When A", "  It works", "When B"))
    ).toBe(
      lines("FooTest", "├── When A", "│   └── It works", "└── When B")
    );
  });

  it("uses four-space prefix for children of a last node", () => {
    expect(format(lines("FooTest", "When A", "  It works"))).toBe(
      lines("FooTest", "└── When A", "    └── It works")
    );
  });

  it("uses double-pipe for a grandchild under a non-last parent and non-last grandparent", () => {
    // When A (non-last) → When A1 (non-last) → It does X
    expect(
      format(
        lines("FooTest", "When A", "  When A1", "    It does X", "  When A2", "When B")
      )
    ).toBe(
      lines(
        "FooTest",
        "├── When A",
        "│   ├── When A1",
        "│   │   └── It does X",
        "│   └── When A2",
        "└── When B"
      )
    );
  });

  it("uses pipe-then-spaces for a child of a last node under a non-last node", () => {
    // When A (non-last) → When A1 (last) → It does X
    expect(
      format(lines("FooTest", "When A", "  When A1", "    It does X", "When B"))
    ).toBe(
      lines(
        "FooTest",
        "├── When A",
        "│   └── When A1",
        "│       └── It does X",
        "└── When B"
      )
    );
  });

  it("uses spaces prefix at the top of a last-branch subtree", () => {
    // When B (last) → When B1 → It does Y
    expect(
      format(lines("FooTest", "When A", "When B", "  When B1", "    It does Y"))
    ).toBe(
      lines(
        "FooTest",
        "├── When A",
        "└── When B",
        "    └── When B1",
        "        └── It does Y"
      )
    );
  });

  it("handles the full mixed pipe/space matrix correctly", () => {
    const input = lines(
      "StakingTest",
      "When user stakes",
      "  When amount is zero",
      "    It should revert",
      "  When amount is valid",
      "    It should increase balance",
      "    It should emit event",
      "When user unstakes",
      "  When not staked",
      "    It should revert",
      "  When staked",
      "    It should decrease balance"
    );

    expect(format(input)).toBe(
      lines(
        "StakingTest",
        "├── When user stakes",
        "│   ├── When amount is zero",
        "│   │   └── It should revert",
        "│   └── When amount is valid",
        "│       ├── It should increase balance",
        "│       └── It should emit event",
        "└── When user unstakes",
        "    ├── When not staked",
        "    │   └── It should revert",
        "    └── When staked",
        "        └── It should decrease balance"
      )
    );
  });
});

// ─── multiple blocks ──────────────────────────────────────────────────────────

describe("multiple blocks", () => {
  it("formats two blocks separated by one blank line", () => {
    expect(format(lines("FooTest", "When A", "", "BarTest", "When B"))).toBe(
      lines("FooTest", "└── When A", "", "BarTest", "└── When B")
    );
  });

  it("collapses multiple blank lines between blocks into one", () => {
    expect(
      format(lines("FooTest", "When A", "", "", "", "BarTest", "When B"))
    ).toBe(lines("FooTest", "└── When A", "", "BarTest", "└── When B"));
  });

  it("formats three independent blocks without cross-contamination", () => {
    expect(format("A\na1\n\nB\nb1\nb2\n\nC\nc1")).toBe(
      "A\n└── a1\n\nB\n├── b1\n└── b2\n\nC\n└── c1"
    );
  });

  it("keeps each block's connector logic independent", () => {
    // Block 1 has 2 children (├── / └──), block 2 has 1 child (└── only)
    const input = lines("A", "x", "y", "", "B", "z");
    expect(format(input)).toBe(lines("A", "├── x", "└── y", "", "B", "└── z"));
  });
});

// ─── idempotency ──────────────────────────────────────────────────────────────

describe("idempotency", () => {
  const cases = [
    "FooTest\n└── When A",
    "FooTest\n├── When A\n└── When B",
    "FooTest\n├── When A\n│   └── It works\n└── When B",
    lines(
      "HashPairTest",
      "├── When first arg is smaller than second arg",
      "│   └── It should match the result of keccak256(abi.encodePacked(a,b)).",
      "└── When first arg is bigger than second arg",
      "    └── It should match the result of keccak256(abi.encodePacked(b,a))."
    ),
    lines(
      "Deep",
      "└── A",
      "    └── B",
      "        └── C",
      "            └── D"
    ),
    lines(
      "Complex",
      "├── When A",
      "│   ├── When A1",
      "│   │   └── It does X",
      "│   └── When A2",
      "│       └── It does Y",
      "└── When B",
      "    └── It does Z"
    ),
  ];

  cases.forEach((input, i) => {
    it(`is idempotent on case ${i + 1}`, () => {
      const once = format(input);
      expect(format(once)).toBe(once);
    });
  });

  it("is idempotent on a multi-block file", () => {
    const input = "A\n└── x\n\nB\n├── y\n└── z";
    expect(format(format(input))).toBe(format(input));
  });
});

// ─── partially converted (mixed) files ────────────────────────────────────────

describe("partially converted files", () => {
  it("re-renders a file with tree-format lines mixed with whitespace lines", () => {
    const input = lines(
      "FooTest",
      "├── When A",
      "  It works",
      "When B",
      "  It also works"
    );
    expect(format(input)).toBe(
      lines(
        "FooTest",
        "├── When A",
        "│   └── It works",
        "└── When B",
        "    └── It also works"
      )
    );
  });

  it("strips └── connector from the root line", () => {
    expect(format("└── FooTest\nWhen A")).toBe("FooTest\n└── When A");
  });

  it("strips ├── connector from the root line", () => {
    expect(format("├── FooTest\nWhen A")).toBe("FooTest\n└── When A");
  });

  it("strips pipe prefix and connector from the root line", () => {
    expect(format("│   ├── FooTest\nWhen A")).toBe("FooTest\n└── When A");
  });

  it("normalises a fully tree-formatted block where connectors are wrong", () => {
    // All siblings marked ├── but last should be └──
    const input = lines(
      "FooTest",
      "├── When A",
      "│   ├── It does X",
      "├── When B",
      "│   ├── It does Y"
    );
    expect(format(input)).toBe(
      lines(
        "FooTest",
        "├── When A",
        "│   └── It does X",
        "└── When B",
        "    └── It does Y"
      )
    );
  });

  it("handles a tree where some levels are converted and others are not", () => {
    const input = lines(
      "HashPairTest",
      "├── When first arg is smaller than second arg",
      "  It should match keccak256(a,b).",
      "└── When first arg is bigger than second arg",
      "  It should match keccak256(b,a)."
    );
    expect(format(input)).toBe(
      lines(
        "HashPairTest",
        "├── When first arg is smaller than second arg",
        "│   └── It should match keccak256(a,b).",
        "└── When first arg is bigger than second arg",
        "    └── It should match keccak256(b,a)."
      )
    );
  });
});

// ─── whitespace normalisation ─────────────────────────────────────────────────

describe("whitespace normalisation", () => {
  it("normalises a single tab to 2 spaces (depth 2)", () => {
    expect(format("FooTest\nWhen A\n\tIt works")).toBe(
      "FooTest\n└── When A\n    └── It works"
    );
  });

  it("normalises double tab to 4 spaces (depth 3)", () => {
    expect(format("FooTest\nWhen A\n\tWhen B\n\t\tIt works")).toBe(
      "FooTest\n└── When A\n    └── When B\n        └── It works"
    );
  });

  it("rounds 1-space indent down to depth 2 (same as 2 spaces)", () => {
    expect(format("FooTest\n When A")).toBe("FooTest\n└── When A");
  });

  it("rounds 3-space indent down to depth 2 (same as 2 spaces)", () => {
    expect(format("FooTest\n   When A")).toBe("FooTest\n└── When A");
  });

  it("rounds 5-space indent down to depth 3 (same as 4 spaces)", () => {
    expect(format(lines("FooTest", "When A", "     It works"))).toBe(
      lines("FooTest", "└── When A", "    └── It works")
    );
  });

  it("strips trailing whitespace from node text", () => {
    expect(format("FooTest\nWhen A   \n  It works   ")).toBe(
      "FooTest\n└── When A\n    └── It works"
    );
  });

  it("handles lines that are entirely spaces as block separators", () => {
    expect(format("FooTest\nWhen A\n   \nBarTest\nWhen B")).toBe(
      "FooTest\n└── When A\n\nBarTest\n└── When B"
    );
  });
});

// ─── trailing newline ─────────────────────────────────────────────────────────

describe("trailing newline", () => {
  it("preserves a trailing newline", () => {
    const result = format("FooTest\nWhen A\n");
    expect(result).toBe("FooTest\n└── When A\n");
  });

  it("does not add a trailing newline when the input has none", () => {
    const result = format("FooTest\nWhen A");
    expect(result.endsWith("\n")).toBe(false);
  });

  it("preserves trailing newline on a multi-block file", () => {
    const result = format("A\na1\n\nB\nb1\n");
    expect(result).toBe("A\n└── a1\n\nB\n└── b1\n");
  });
});

// ─── real-world examples ──────────────────────────────────────────────────────

describe("real-world examples", () => {
  it("formats the HashPairTest example from the bulloak docs", () => {
    const input = lines(
      "HashPairTest",
      "When first arg is smaller than second arg",
      "  It should match the result of keccak256(abi.encodePacked(a,b)).",
      "When first arg is bigger than second arg",
      "  It should match the result of keccak256(abi.encodePacked(b,a))."
    );
    expect(format(input)).toBe(
      lines(
        "HashPairTest",
        "├── When first arg is smaller than second arg",
        "│   └── It should match the result of keccak256(abi.encodePacked(a,b)).",
        "└── When first arg is bigger than second arg",
        "    └── It should match the result of keccak256(abi.encodePacked(b,a))."
      )
    );
  });

  it("formats the FooTest nested example from the bulloak docs", () => {
    const input = lines(
      "FooTest",
      "When stuff is called",
      "  When a condition is met",
      "    It should revert."
    );
    expect(format(input)).toBe(
      lines(
        "FooTest",
        "└── When stuff is called",
        "    └── When a condition is met",
        "        └── It should revert."
      )
    );
  });

  it("formats a wide tree with many siblings", () => {
    expect(
      format(lines("FooTest", "When A", "When B", "When C", "When D", "When E"))
    ).toBe(
      lines(
        "FooTest",
        "├── When A",
        "├── When B",
        "├── When C",
        "├── When D",
        "└── When E"
      )
    );
  });

  it("formats a deep single-chain tree", () => {
    expect(
      format(
        lines(
          "DeepTest",
          "When A",
          "  When B",
          "    When C",
          "      When D",
          "        It should work"
        )
      )
    ).toBe(
      lines(
        "DeepTest",
        "└── When A",
        "    └── When B",
        "        └── When C",
        "            └── When D",
        "                └── It should work"
      )
    );
  });

  it("formats a realistic ERC20 transfer test spec", () => {
    const input = lines(
      "ERC20TransferTest",
      "When the sender has insufficient balance",
      "  It should revert with InsufficientBalance.",
      "When the recipient is the zero address",
      "  It should revert with InvalidRecipient.",
      "When all conditions are met",
      "  It should decrease the sender balance.",
      "  It should increase the recipient balance.",
      "  It should emit a Transfer event."
    );
    expect(format(input)).toBe(
      lines(
        "ERC20TransferTest",
        "├── When the sender has insufficient balance",
        "│   └── It should revert with InsufficientBalance.",
        "├── When the recipient is the zero address",
        "│   └── It should revert with InvalidRecipient.",
        "└── When all conditions are met",
        "    ├── It should decrease the sender balance.",
        "    ├── It should increase the recipient balance.",
        "    └── It should emit a Transfer event."
      )
    );
  });

  it("formats a multi-contract file", () => {
    const input = lines(
      "HashPairTest",
      "When first arg is smaller",
      "  It should match keccak256(a,b).",
      "",
      "FooTest",
      "When called",
      "  When condition met",
      "    It should revert."
    );
    expect(format(input)).toBe(
      lines(
        "HashPairTest",
        "└── When first arg is smaller",
        "    └── It should match keccak256(a,b).",
        "",
        "FooTest",
        "└── When called",
        "    └── When condition met",
        "        └── It should revert."
      )
    );
  });
});
