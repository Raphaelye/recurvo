import { Directory, File, Paths } from "expo-file-system";

import type { StatementFile } from "@/types/setup";

// Bank statements are deleted as soon as they are parsed. Only the extracted
// subscriptions are kept (AGENTS.md, Data and Privacy).

export function deleteStatementFile(file: StatementFile) {
  try {
    const copy = new File(file.uri);
    if (copy.exists) {
      copy.delete();
    }
  } catch {
    // Already gone. Nothing to delete.
  }
}

// The document picker copies picked files into the app cache, in a
// "DocumentPicker" folder on iOS and Android. Clears any copy left behind, for
// example when the app closed during a scan. Called once at app start.
export function clearStatementCache() {
  try {
    const folder = new Directory(Paths.cache, "DocumentPicker");
    if (folder.exists) {
      folder.delete();
    }
  } catch {
    // Nothing cached.
  }
}
