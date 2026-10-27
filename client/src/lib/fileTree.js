const FILE_EXTS = [
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".html", ".css", ".scss", ".sass", ".less",
  ".json", ".jsonc", ".json5",
  ".md", ".mdx", ".txt", ".rst",
  ".py", ".rb", ".go", ".rs", ".java", ".kt",
  ".c", ".cpp", ".h", ".hpp", ".cs",
  ".php", ".sh", ".bash", ".zsh", ".fish",
  ".yaml", ".yml", ".toml", ".ini", ".env",
  ".lock", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico",
  ".wasm", ".sql", ".prisma", ".graphql",
];

export const NOISE_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  ".git",
  "vendor",
  ".next",
  "coverage",
  ".cache",
  "__pycache__",
  ".venv",
  "venv",
  ".turbo",
  ".output",
]);

const stripEmoji = (s) =>
  s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu, "").trim();

const isFilePath = (rawLabel, fullLine) => {
  const clean = stripEmoji(rawLabel).toLowerCase();
  return (
    fullLine.includes(":::file") ||
    rawLabel.includes("\uD83D\uDCC4") ||
    FILE_EXTS.some((ext) => clean.endsWith(ext))
  );
};

function assignPaths(node, parentPath = "") {
  if (!node) return;
  node.path = parentPath ? `${parentPath}/${node.name}` : node.name;
  for (const child of node.children || []) {
    assignPaths(child, node.path);
  }
}

function sortChildren(node) {
  if (!node?.children?.length) return;
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  node.children.forEach(sortChildren);
}

export function isNoiseDir(name = "") {
  return NOISE_DIR_NAMES.has(String(name).toLowerCase());
}

export function parseFileTree(rawGraph, projectName = "Repository") {
  if (!rawGraph) return null;

  const lines = rawGraph.split("\n");
  const pathMap = new Map();
  const childIds = new Set();
  const parentIds = new Set();

  for (const line of lines) {
    if (/^\s*(graph|flowchart|classDef|style|linkStyle|%%)/i.test(line.trim())) continue;
    const idEnd = line.indexOf('["');
    if (idEnd === -1) continue;

    const rawId = line.slice(0, idEnd).trim();
    if (!/^[A-Za-z0-9_]+$/.test(rawId)) continue;

    const labelStart = idEnd + 2;
    const labelEnd = line.indexOf('"]', labelStart);
    if (labelEnd === -1) continue;

    const rawLabel = line.slice(labelStart, labelEnd);
    const cleanLabel = stripEmoji(rawLabel).replace(/\s+/g, " ").trim() || rawLabel.trim();
    const type = line.includes(":::root")
      ? "folder"
      : isFilePath(rawLabel, line)
        ? "file"
        : "folder";

    pathMap.set(rawId, { id: rawId, name: cleanLabel, type, children: [] });
  }

  const edgeRe = /^\s*([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/;
  for (const line of lines) {
    const m = line.match(edgeRe);
    if (!m) continue;
    const [, parentId, childId] = m;
    childIds.add(childId);
    parentIds.add(parentId);

    const parent = pathMap.get(parentId);
    const child = pathMap.get(childId);
    if (!parent || !child || parent === child) continue;
    if (!parent.children.some((c) => c.id === childId)) {
      parent.children.push(child);
    }
  }

  let rootNode = null;
  for (const [id, node] of pathMap.entries()) {
    if (id === "root_dir" || id === "root_0" || id.startsWith("root")) {
      rootNode = node;
      break;
    }
  }

  if (!rootNode) {
    for (const [id, node] of pathMap.entries()) {
      if (!childIds.has(id) && parentIds.has(id)) {
        rootNode = node;
        break;
      }
    }
  }

  if (!rootNode) {
    rootNode = {
      id: "root_dir",
      name: projectName,
      type: "folder",
      children: Array.from(pathMap.values()).filter((n) => !childIds.has(n.id)),
    };
  } else {
    for (const [id, node] of pathMap.entries()) {
      if (node !== rootNode && !childIds.has(id)) {
        if (!rootNode.children.some((c) => c.id === id)) {
          rootNode.children.push(node);
        }
      }
    }
  }

  sortChildren(rootNode);
  assignPaths(rootNode);
  return rootNode;
}

export function filterNoise(node, hideNoise) {
  if (!node) return null;
  if (!hideNoise) return node;
  return {
    ...node,
    children: (node.children || [])
      .filter((child) => child.type !== "folder" || !isNoiseDir(child.name))
      .map((child) => filterNoise(child, hideNoise)),
  };
}

export function countStats(node) {
  if (!node) return { files: 0, folders: 0 };
  let files = 0;
  let folders = 0;
  const walk = (n) => {
    if (n.type === "file") {
      files += 1;
      return;
    }
    folders += 1;
    for (const child of n.children || []) walk(child);
  };
  walk(node);
  return { files, folders };
}

export function findNodeById(node, id) {
  if (!node || !id) return null;
  if (node.id === id) return node;
  for (const child of node.children || []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

export function getPathToNode(node, id, trail = []) {
  if (!node) return null;
  const next = [...trail, node];
  if (node.id === id) return next;
  for (const child of node.children || []) {
    const found = getPathToNode(child, id, next);
    if (found) return found;
  }
  return null;
}

export function collectMatchingIds(node, search) {
  const q = search.trim().toLowerCase();
  const matchIds = new Set();
  const expandIds = new Set();

  const walk = (n) => {
    const selfMatch = !q || n.name.toLowerCase().includes(q);
    let childMatch = false;
    for (const child of n.children || []) {
      if (walk(child)) childMatch = true;
    }
    const hit = selfMatch || childMatch;
    if (q && hit) {
      if (selfMatch) matchIds.add(n.id);
      if (childMatch) expandIds.add(n.id);
    }
    return hit;
  };

  if (node) walk(node);
  return { matchIds, expandIds };
}

export function collectIdsToDepth(node, maxDepth, currentDepth = 0, ids = new Set()) {
  if (!node) return ids;
  if (node.type === "folder") ids.add(node.id);
  if (currentDepth >= maxDepth) return ids;
  for (const child of node.children || []) {
    collectIdsToDepth(child, maxDepth, currentDepth + 1, ids);
  }
  return ids;
}

function sanitizeLabel(name) {
  return String(name || "").replace(/["`]/g, "").replace(/\s+/g, " ").trim() || "untitled";
}

export function buildMermaidFromTree(node, options = {}) {
  const {
    maxDepth = 2,
    includeFiles = false,
    orientation = "TD",
    classDefs = "",
    nodeCap = 80,
  } = options;

  if (!node) return "";

  const lines = [];
  let nodeCount = 0;

  const walk = (n, depth) => {
    if (nodeCount >= nodeCap) return;
    nodeCount += 1;
    const style = depth === 0 ? "root" : n.type === "file" ? "file" : "folder";
    lines.push(`  ${n.id}["${sanitizeLabel(n.name)}"]:::${style}`);

    if (depth >= maxDepth) return;

    const children = (n.children || []).filter(
      (child) => includeFiles || child.type === "folder"
    );
    const remainingSlots = Math.max(0, nodeCap - nodeCount);
    const shown = children.slice(0, remainingSlots);
    const hidden = children.length - shown.length;

    for (const child of shown) {
      if (nodeCount >= nodeCap) break;
      lines.push(`  ${n.id} --> ${child.id}`);
      walk(child, depth + 1);
    }

    if (hidden > 0 && nodeCount < nodeCap) {
      const moreId = `${n.id}_more`;
      lines.push(`  ${moreId}["...and ${hidden} more"]:::file`);
      lines.push(`  ${n.id} --> ${moreId}`);
      nodeCount += 1;
    }
  };

  walk(node, 0);
  return `graph ${orientation};\n${classDefs}${lines.join("\n")}\n`;
}
