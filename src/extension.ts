import * as vscode from 'vscode';
const axios = require('axios').default;

type Sense = {
  raw_glosses: string[];
};
type WordDefinition = {
  lang_code: string;
  head_templates: any
  senses: Sense[]
};
const MAX_CACHE_SIZE = 50;
let DEFINITIONS_CACHE: {[word: string]: WordDefinition[]} = {};


export function formatDefinition(definitions: WordDefinition[]): Array<vscode.MarkdownString> {
  let retVal: vscode.MarkdownString[] = [];
  definitions.forEach((def) => {
    retVal = retVal.concat(def.senses.map((sense) => {
      return new vscode.MarkdownString(`[${def.lang_code}] ` + (sense.raw_glosses).join('\n*'));
    }));
  });
  return retVal;
}

export async function getDefinition(word: string): Promise<null | WordDefinition[]>{
  if (DEFINITIONS_CACHE.hasOwnProperty(word)){
    return DEFINITIONS_CACHE[word];
  }

  const baseURL = vscode.workspace.getConfiguration().get('wiktionaryhelp.wiktionaryserverURL');
  try {
    const response = await axios.get(baseURL + '/w/' + encodeURIComponent(word));
    const definitions = response.data as WordDefinition[];
    if (Object.keys(DEFINITIONS_CACHE).length > MAX_CACHE_SIZE){
      DEFINITIONS_CACHE = {};
    }
    DEFINITIONS_CACHE[word] = definitions;
    return definitions;
  } catch(error: any){
    if (error.code === 'ECONNREFUSED'){
      throw new Error(`Cannot connect to server at '${baseURL}'`);
    }

    if (error.response.status === 404){
      return null;
    }
    console.error(error);
    throw new Error('error fetching data:' + error);
  }
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
        try {
          const definition = await getDefinition(word);
          if (definition === null){
            return new vscode.Hover(`Unknown word '${word}'`);
          }
          return new vscode.Hover(formatDefinition(definition));
        }
        catch(error: any){
          vscode.window.showInformationMessage(error);
        }
      }
    });
  context.subscriptions.push(hoverDisposable);
}

export function deactivate() {}
