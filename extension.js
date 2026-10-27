const vscode = require('vscode');


const SCHEME = 'scratchpad';
const LANGUAGE = 'scratchpad';

const activate = context => {
  const dir = context.storageUri ?? context.globalStorageUri;
  const file = vscode.Uri.joinPath(dir, 'SCRATCH.scratchpad');
  const uri = vscode.Uri.from({ scheme: SCHEME, path: '/Scratchpad' });
  const changes = new vscode.EventEmitter();

  const ensureFile = async () => {
    try {
      await vscode.workspace.fs.stat(file);
    }
    catch {
      await vscode.workspace.fs.createDirectory(dir);
      await vscode.workspace.fs.writeFile(file, new Uint8Array());
    }
  };

  const readOnly = () => {
    throw vscode.FileSystemError.NoPermissions();
  };

  // Every scratchpad: URI maps to the one backing file in workspace storage.
  const provider = {
    onDidChangeFile: changes.event,
    watch: () => new vscode.Disposable(() => {}),
    stat: async () => {
      await ensureFile();
      return vscode.workspace.fs.stat(file);
    },
    readFile: async () => {
      await ensureFile();
      return vscode.workspace.fs.readFile(file);
    },
    writeFile: (_uri, content) => vscode.workspace.fs.writeFile(file, content),
    readDirectory: () => [],
    createDirectory: readOnly,
    delete: readOnly,
    rename: readOnly,
  };

  // The URI has no file extension, so the language is set here, including for restored tabs.
  const setLanguage = document => {
    if (document.uri.scheme === SCHEME && document.languageId !== LANGUAGE) {
      vscode.languages.setTextDocumentLanguage(document, LANGUAGE);
    }
  };

  const open = () => vscode.window.showTextDocument(uri, { preview: false });

  vscode.workspace.textDocuments.forEach(setLanguage);

  context.subscriptions.push(
    changes,
    vscode.workspace.registerFileSystemProvider(SCHEME, provider),
    vscode.workspace.onDidOpenTextDocument(setLanguage),
    vscode.commands.registerCommand('scratchpad.open', open),
  );
};

const deactivate = () => {};

module.exports = { activate, deactivate };
