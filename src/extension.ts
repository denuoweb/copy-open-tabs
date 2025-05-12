// src/extension.ts

import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    // Create and show a status-bar button
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(clippy) Copy Open Tabs';
    statusBar.command = 'copyOpenTabs.execute';
    statusBar.tooltip = 'Copy all open tabs with relative path headers';
    statusBar.show();
    context.subscriptions.push(statusBar);

    // Register the command
    const disposable = vscode.commands.registerCommand('copyOpenTabs.execute', async () => {
        // Gather every open tab across all tab groups
        const allTabs = vscode.window.tabGroups.all
            .reduce((tabs, group) => tabs.concat(group.tabs), [] as readonly vscode.Tab[]);

        if (allTabs.length === 0) {
            vscode.window.showInformationMessage('No open tabs to copy.');
            return;
        }

        // Determine workspace root for relative paths
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const rootFsPath = workspaceFolders && workspaceFolders.length > 0
            ? workspaceFolders[0].uri.fsPath
            : undefined;

        let combined = '';

        for (const tab of allTabs) {
            // Only handle text editors (skip e.g. diff views, markdown previews)
            let uri: vscode.Uri | undefined;
            if (tab.input instanceof vscode.TabInputText) {
                uri = tab.input.uri;
            } else if (tab.input instanceof vscode.TabInputTextDiff) {
                // If you want to include diff targets, choose one side:
                uri = tab.input.modified ?? tab.input.original;
            } else {
                continue;
            }

            try {
                // Load the document contents (even if not visible)
                const doc = await vscode.workspace.openTextDocument(uri);
                const absPath = uri.fsPath;
                const relPath = rootFsPath
                    ? path.relative(rootFsPath, absPath)
                    : path.basename(absPath);

                // Build the header plus file text
                combined += `// === ${relPath} ===\n`;
                combined += doc.getText();
                combined += '\n\n';
            } catch (err) {
                // If a document fails to load, note it and continue
                combined += `// === Could not read ${uri.toString()} ===\n\n`;
            }
        }

        // Copy result to clipboard
        try {
            await vscode.env.clipboard.writeText(combined);
            vscode.window.showInformationMessage('📋 Copied all open tabs to clipboard.');
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to write to clipboard: ${err}`);
        }
    });
    context.subscriptions.push(disposable);
}

export function deactivate() {
    // nothing to clean up
}
