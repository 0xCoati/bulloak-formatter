# bulloak-formatter

A VS Code extension that formats `.tree` files into valid [bulloak](https://www.bulloak.dev/) syntax on save.

Instead of typing `├──`, `└──`, and `│` by hand, write plain indented text and let the formatter handle the rest.

---

## What is bulloak?

[Bulloak](https://www.bulloak.dev/) is a Solidity test generator. It reads `.tree` files that describe test scenarios in a branching structure, and scaffolds the corresponding Solidity test contracts. A valid `.tree` file looks like this:

```
ERC20TransferTest
├── When the sender has insufficient balance
│   └── It should revert with InsufficientBalance.
└── When all conditions are met
    ├── It should decrease the sender balance.
    └── It should emit a Transfer event.
```

Writing those box-drawing characters by hand is tedious. This extension lets you write the same spec as plain indented text and converts it automatically when you save.

---

## Usage

Open or create any `.tree` file and write your spec using plain indentation — **2 spaces per level**. The first line of each block is the contract name (root). Every following line is a branch, indented relative to its parent.

```
ERC20TransferTest
When the sender has insufficient balance
  It should revert with InsufficientBalance.
When all conditions are met
  It should decrease the sender balance.
  It should emit a Transfer event.
```

Press **⌘S** (or **Ctrl+S**) to save. The file is rewritten instantly to valid bulloak syntax:

```
ERC20TransferTest
├── When the sender has insufficient balance
│   └── It should revert with InsufficientBalance.
└── When all conditions are met
    ├── It should decrease the sender balance.
    └── It should emit a Transfer event.
```

---

## Formatting rules

| Rule | Behaviour |
|---|---|
| **First line of a block** | Becomes the root node (contract name). No connector is added. |
| **0 spaces** (after root) | Depth-1 branch — direct child of the root. |
| **2 spaces** | Depth-2 branch — child of the preceding depth-1 node. |
| **4 spaces** | Depth-3 branch, and so on — add 2 spaces per additional level. |
| **Empty line** | Separates two independent blocks (two contracts). |
| **Tabs** | Normalised to 2 spaces before processing. |
| **Odd indentation** | Rounded down to the nearest 2-space level (e.g. 3 spaces → depth 2). |
| **Trailing spaces** | Stripped from every node's text. |
| **`├──` vs `└──`** | Assigned automatically — `└──` for the last sibling at a level, `├──` for all others. |
| **`│` vs spaces prefix** | Assigned automatically based on whether an ancestor was the last sibling at its level. |

### Multiple contracts in one file

Separate blocks with a blank line. Each block is formatted independently:

```
HashPairTest
When first arg is smaller
  It should match keccak256(a,b).

FooTest
When stuff is called
  When a condition is met
    It should revert.
```

### Partially converted files

The formatter is **idempotent** — running it on an already-formatted file produces the same output. It also handles files where some lines have already been converted and others have not: existing `├──` / `└──` connectors are stripped and re-derived, so you can freely mix whitespace-indented and tree-formatted lines in the same file while editing.

---

## Settings

The extension sets `editor.formatOnSave` to `true` for `.tree` files by default — no configuration needed.

If you want to disable auto-format on save for `.tree` files, add this to your VS Code `settings.json`:

```json
"[tree]": {
  "editor.formatOnSave": false
}
```

You can still format manually at any time via **Format Document** (`⇧⌥F` / `Shift+Alt+F`) or the Command Palette (`⌘⇧P` → `Format Document`).

---

## Running locally (development)

```bash
git clone <repo>
cd bulloak-formatter
pnpm install
```

Open the folder in VS Code, then press **F5**. A second **Extension Development Host** window opens with the extension loaded. Create or open any `.tree` file there and save it to see the formatter in action.

To run the unit tests:

```bash
pnpm test
```
