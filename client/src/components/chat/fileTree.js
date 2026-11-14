/* Turns a flat list of paths ("Frontend/src/hooks/useX.js") into a folder tree. */
export function buildFileTree(paths = []) {
  const root = { name: "", path: "", folders: new Map(), files: [], count: 0 };

  for (const full of paths) {
    const parts = String(full).split("/").filter(Boolean);
    if (!parts.length) continue;

    let node = root;
    node.count++;
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      let next = node.folders.get(seg);
      if (!next) {
        next = { name: seg, path: parts.slice(0, i + 1).join("/"), folders: new Map(), files: [], count: 0 };
        node.folders.set(seg, next);
      }
      node = next;
      node.count++;
    }
    node.files.push({ name: parts[parts.length - 1], path: full });
  }
  return root;
}

export function getNode(root, segments) {
  let node = root;
  for (const seg of segments) {
    node = node.folders.get(seg);
    if (!node) return null;
  }
  return node;
}

export function sortedFolders(node) {
  return [...node.folders.values()].sort((a, b) => a.name.localeCompare(b.name));
}