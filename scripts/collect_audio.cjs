const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
const values = new Map();
function key(text) {
  let hash = 2166136261;
  const s = text.replace(/\s+/g, "");
  for (let i = 0; i < s.length; i++)
    hash = Math.imul(hash ^ s.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
function add(text, force = false) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (
    (clean.replace(/\s/g, "").length >= 45 || force) &&
    /[\u3400-\u9fff]/.test(clean) &&
    !clean.startsWith("https:")
  ) {
    const id = key(clean);
    if (
      values.has(id) &&
      values.get(id).text.replace(/\s/g, "") !== clean.replace(/\s/g, "")
    )
      throw Error("Audio hash collision");
    values.set(id, { id, text: clean });
  }
}
function jsxText(n) {
  if (ts.isJsxText(n)) return n.text.replace(/\s+/g, "");
  if (ts.isJsxElement(n) || ts.isJsxFragment(n))
    return n.children.map(jsxText).join("");
  if (ts.isJsxExpression(n) && n.expression && ts.isStringLiteral(n.expression))
    return n.expression.text;
  return "";
}
for (const file of [
  "data.ts",
  "mapData.ts",
  "mapHighlights.ts",
  "App.tsx",
  "EastBuildingMap.tsx",
]) {
  const name = path.join(root, "src", file);
  const source = ts.createSourceFile(
    name,
    fs.readFileSync(name, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  function visit(n) {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n))
      add(n.text);
    if (
      ts.isJsxElement(n) &&
      ["NarratedText", "p"].includes(n.openingElement.tagName.getText(source))
    ) {
      // Only static markup; dynamic content is collected from its structured data.
      if (
        !n.children.some(
          (c) =>
            ts.isJsxExpression(c) &&
            c.expression &&
            !ts.isStringLiteral(c.expression),
        )
      )
        add(jsxText(n));
    }
    ts.forEachChild(n, visit);
  }
  visit(source);
}
function loadData(name = "data") {
  const input = fs
    .readFileSync(path.join(root, "src", name + ".ts"), "utf8")
    .replace("import.meta.env.BASE_URL", '"/"');
  const output = ts.transpileModule(input, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    require: (id) => {
      if (id === "./media") return loadData("media");
      throw new Error("Unexpected content dependency: " + id);
    },
  });
  return exports;
}
const data = loadData();
for (const a of data.artifacts) {
  add(a.story.join(" "), true);
  add(a.observe, true);
  add(a.explanation, true);
  add(a.fact, true);
}
for (const topic of data.topics) {
  if (topic.sections) {
    values.delete(key(topic.body));
    for (const section of topic.sections) values.delete(key(section.text));
    add(data.topicNarration(topic), true);
  }
}
fs.mkdirSync(path.join(root, "work/audio"), { recursive: true });
fs.writeFileSync(
  path.join(root, "work/audio/corpus.json"),
  JSON.stringify([...values.values()], null, 2),
);
console.log(`${values.size} public text audio tracks collected`);
