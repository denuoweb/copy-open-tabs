"use strict";
// src/extension.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
function activate(context) {
    // Create and show a status-bar button
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(clippy) Copy Open Tabs';
    statusBar.command = 'copyOpenTabs.execute';
    statusBar.tooltip = 'Copy all open tabs with relative path headers';
    statusBar.show();
    context.subscriptions.push(statusBar);
    // Register the command
    const disposable = vscode.commands.registerCommand('copyOpenTabs.execute', async () => {
        var _a;
        // Gather every open tab across all tab groups
        const allTabs = vscode.window.tabGroups.all
            .reduce((tabs, group) => tabs.concat(group.tabs), []);
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
            let uri;
            if (tab.input instanceof vscode.TabInputText) {
                uri = tab.input.uri;
            }
            else if (tab.input instanceof vscode.TabInputTextDiff) {
                // If you want to include diff targets, choose one side:
                uri = (_a = tab.input.modified) !== null && _a !== void 0 ? _a : tab.input.original;
            }
            else {
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
            }
            catch (err) {
                // If a document fails to load, note it and continue
                combined += `// === Could not read ${uri.toString()} ===\n\n`;
            }
        }
        // Copy result to clipboard
        try {
            await vscode.env.clipboard.writeText(combined);
            vscode.window.showInformationMessage('📋 Copied all open tabs to clipboard.');
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to write to clipboard: ${err}`);
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() {
    // nothing to clean up
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map