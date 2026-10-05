#!/usr/bin/env node
/**
 * Content-similarity "Related Articles" for every blog post.
 *
 * TF-IDF over title, tags, snippet, headings and body (title/tags weighted up),
 * cosine similarity, top N per post. No dependencies, no API, deterministic, so
 * the output can be committed and reviewed: src/data/related.json.
 *
 *   node scripts/build-related.cjs            # rebuild src/data/related.json
 *   node scripts/build-related.cjs --check    # exit 1 if it is out of date
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BLOG = path.join(ROOT, "src/content/blog");
const OUT = path.join(ROOT, "src/data/related.json");
const TOP_N = 6;

const STOP = new Set(
  ("a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself just like me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours "
  + "use using used get got make made new one two first also via within without yet still even much many may might must need needs way ways thing things lot really well actually going want "
  + "blog post article luca berton import components blogpromocard astro jpg png webp https http www com html")
    .split(/\s+/),
);

function frontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { fm: {}, body: src };
  const raw = m[1];
  const get = (k) => {
    const r = raw.match(new RegExp(`^${k}:\\s*(.*)$`, "m"));
    return r ? r[1].trim().replace(/^["']|["']$/g, "") : "";
  };
  let tags = [];
  const t = raw.match(/^tags:\s*(\[.*\])\s*$/m);
  if (t) {
    try { tags = JSON.parse(t[1]); } catch { tags = t[1].replace(/[[\]"]/g, "").split(","); }
  }
  return {
    fm: { title: get("title"), snippet: get("snippet"), category: get("category"), draft: get("draft") === "true", tags },
    body: src.slice(m[0].length),
  };
}

function tokens(text) {
  return (text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9][a-z0-9+#.-]*[a-z0-9+#]|[a-z0-9]/g) || [])
    .map((w) => w.replace(/\.+$/, ""))
    .filter((w) => w.length >= 2 && !STOP.has(w) && !/^\d+$/.test(w));
}

function clean(body) {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^import .*$/gm, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ");
}

const docs = [];
for (const f of fs.readdirSync(BLOG).filter((f) => f.endsWith(".mdx") || f.endsWith(".md")).sort()) {
  const slug = f.replace(/\.mdx?$/, "");
  const { fm, body } = frontmatter(fs.readFileSync(path.join(BLOG, f), "utf8"));
  if (fm.draft) continue;
  const text = clean(body);
  const headings = (text.match(/^#{2,4} .*$/gm) || []).join(" ");
  const tf = new Map();
  const add = (s, w) => { for (const t of tokens(s)) tf.set(t, (tf.get(t) || 0) + w); };
  add(fm.title, 4);
  add(fm.tags.join(" "), 3);
  for (const tag of fm.tags) tf.set(`tag:${tag.toLowerCase().trim()}`, (tf.get(`tag:${tag.toLowerCase().trim()}`) || 0) + 3);
  add(fm.snippet, 2);
  add(headings, 2);
  add(text, 1);
  docs.push({ slug, category: fm.category, tf });
}

const N = docs.length;
const df = new Map();
for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
const maxDf = Math.max(30, Math.floor(N * 0.2));

const vecs = docs.map((d) => {
  const v = new Map();
  let norm = 0;
  for (const [t, c] of d.tf) {
    const n = df.get(t);
    if (n < 2 || n > maxDf) continue;
    const w = (1 + Math.log(c)) * Math.log(N / n);
    v.set(t, w);
    norm += w * w;
  }
  norm = Math.sqrt(norm) || 1;
  for (const [t, w] of v) v.set(t, w / norm);
  return v;
});

// Inverted index for sparse cosine
const index = new Map();
vecs.forEach((v, i) => { for (const [t, w] of v) { if (!index.has(t)) index.set(t, []); index.get(t).push([i, w]); } });

const related = {};
vecs.forEach((v, i) => {
  const score = new Map();
  for (const [t, w] of v) for (const [j, w2] of index.get(t)) if (j !== i) score.set(j, (score.get(j) || 0) + w * w2);
  related[docs[i].slug] = [...score]
    .sort((a, b) => b[1] - a[1] || docs[a[0]].slug.localeCompare(docs[b[0]].slug))
    .slice(0, TOP_N)
    .map(([j]) => docs[j].slug);
});

const json = JSON.stringify(related, null, 0).replace(/\],"/g, '],\n"') + "\n";
if (process.argv.includes("--check")) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (cur !== json) { console.error("src/data/related.json is out of date: run node scripts/build-related.cjs"); process.exit(1); }
  console.log("related.json up to date");
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, json);
  console.log(`related.json: ${Object.keys(related).length} posts, top ${TOP_N}`);
}
