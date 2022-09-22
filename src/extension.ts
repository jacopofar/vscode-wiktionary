// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const axios = require('axios').default;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "wiktionaryhelp" is now active!');

  // // The command has been defined in the package.json file
  // // Now provide the implementation of the command with registerCommand
  // // The commandId parameter must match the command field in package.json
  // let disposable = vscode.commands.registerCommand('wiktionaryhelp.helloWorld', () => {
  // 	// The code you place here will be executed every time your command is executed
  // 	// Display a message box to the user
  // 	vscode.window.showInformationMessage('Hello World from WiktionaryHelp!');
  // });

  // context.subscriptions.push(disposable);

  let hoverDisposable = vscode.languages.registerHoverProvider('markdown',
    {
      provideHover: async (document, position, token) => {
        const word = document.getText(document.getWordRangeAtPosition(position));

        try {
          const response = await axios.get('http://127.0.0.1:8000/w/' + word);

          console.log(response.data);
          return new vscode.Hover(JSON.stringify(response.data));
        } catch(error: any){
          if (error.response.status !== 200){
            return new vscode.Hover(`Unknown word '${word}'`);
          }
          console.error(error);
          vscode.window.showInformationMessage('error fetching data:' + error);
        }
      }
    });
  context.subscriptions.push(hoverDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
