import * as vscode from "vscode";
import { format } from "./formatter";

export function activate(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerDocumentFormattingEditProvider(
    { language: "tree" },
    {
      provideDocumentFormattingEdits(
        document: vscode.TextDocument
      ): vscode.TextEdit[] {
        const original = document.getText();
        const formatted = format(original);

        if (formatted === original) {
          return [];
        }

        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(original.length)
        );

        return [vscode.TextEdit.replace(fullRange, formatted)];
      },
    }
  );

  context.subscriptions.push(provider);
}

export function deactivate(): void {}
