import * as vscode from 'vscode';
const axios = require('axios').default;


export function formatDefinition(definitions: any): Array<vscode.MarkdownString> {
  let retVal: vscode.MarkdownString[] = [];
  definitions.forEach((def: any) => {
    retVal = retVal.concat(def.senses.map((sense: any) => {
      return new vscode.MarkdownString((sense.raw_glosses as Array<string>).join('\n*'));
    }));
  });
  return retVal;
}


export function activate(context: vscode.ExtensionContext) {

  let hoverDisposable = vscode.languages.registerHoverProvider('markdown',
    {
      provideHover: async (document, position, token) => {
        const hoverRange = document.getWordRangeAtPosition(position);
        let word: string = document.getText(hoverRange);
        const selection = vscode.window.activeTextEditor?.selection;
        // is there something selected?
        if (selection && !selection.isEmpty){
          // selection may use multiple words and in that case overrides hovering
          // but only if they overlap, because the user may select text
          // somewhere else as part of the normal editing
          if(hoverRange) {
            if(!selection.intersection(hoverRange)?.isEmpty){
              word = document.getText(selection);
            }
          }
        }
        const baseURL = vscode.workspace.getConfiguration().get('wiktionaryhelp.wiktionaryserverURL');

        try {
          const response = await axios.get(baseURL + '/w/' + word);
          return new vscode.Hover(formatDefinition(response.data));
        } catch(error: any){
          if (error.code === 'ECONNREFUSED'){
            vscode.window.showInformationMessage(`Cannot connect to server at '${baseURL}'`);
            return null;
          }

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

export function deactivate() {}
