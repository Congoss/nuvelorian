import fs from 'node:fs';
import path from 'node:path';

export function cleanupLegacyPatchFiles(root) {
  const directory = fs.realpathSync(root);
  const removed = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !/^(?:INSTALL-\d+\.\d+\.txt|PATCH-\d+\.\d+-MANIFEST\.json|PATCH-\d{8}-\d+\.\d+\.md)$/.test(entry.name)) continue;
    const file = path.resolve(directory, entry.name);
    if (path.dirname(file) !== directory) throw new Error('Invalid cleanup path');
    fs.unlinkSync(file);
    removed.push(entry.name);
  }
  return removed;
}
