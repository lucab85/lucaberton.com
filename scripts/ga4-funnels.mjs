#!/usr/bin/env node
/**
 * ga4-funnels.mjs: weekly funnel report for the group's GA4 properties.
 *
 * For each property in scripts/ga4-funnels.config.json it runs:
 *   - every configured funnel (GA4 Data API runFunnelReport, open funnels,
 *     active users per step), for the last 7 complete days and the 7 before;
 *   - paid clicks (affiliate_click) by programme and offer, and by page,
 *     from the custom dimensions company / offer_id.
 * and prints one Markdown report (stdout, or --out <file>).
 *
 * Credentials: the same service account as ga4-ensure.mjs (GA4_ADMIN_KEY,
 * see scripts/ga4-auth.mjs); it only reads here. Needs the Google Analytics
 * Data API enabled in the service account's project.
 *
 * Usage: node scripts/ga4-funnels.mjs [--out report.md] [--end YYYY-MM-DD]
 * Exits 1 only on a credential error; a property that fails is reported.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { accessToken, readKey } from "./ga4-auth.mjs";

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const here = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(await readFile(path.join(here, "ga4-funnels.config.json"), "utf8"));
const DATA = "https://analyticsdata.googleapis.com";

// ---------- dates: last 7 complete days (UTC) and the 7 before ----------

const day = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const end = option("--end") ? Date.parse(`${option("--end")}T00:00:00Z`) : Date.parse(`${iso(Date.now() - day)}T00:00:00Z`);
const current = { startDate: iso(end - 6 * day), endDate: iso(end) };
const previous = { startDate: iso(end - 13 * day), endDate: iso(end - 7 * day) };

// ---------- API ----------

const token = await accessToken(readKey(), "https://www.googleapis.com/auth/analytics.readonly");

async function post(url, body) {
  const res = await fetch(`${DATA}/${url}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.error?.message ?? res.statusText;
    if (/has not been used|is disabled/i.test(msg)) {
      throw new Error(`${msg} Run: gcloud services enable analyticsdata.googleapis.com --project <project-id>`);
    }
    throw new Error(`${res.status} ${msg}`);
  }
  return json;
}

function stepFilter(step) {
  const filter = { eventName: step.event };
  if (step.param) {
    const { name, contains, equals } = step.param;
    filter.funnelParameterFilterExpression = {
      funnelParameterFilter: {
        eventParameterName: name,
        stringFilter: contains !== undefined ? { matchType: "CONTAINS", value: contains } : { matchType: "EXACT", value: equals },
      },
    };
  }
  return { funnelEventFilter: filter };
}

/** Active users per step, in step order. */
async function funnelUsers(propertyId, funnel, range) {
  const res = await post(`v1alpha/properties/${propertyId}:runFunnelReport`, {
    dateRanges: [range],
    funnel: {
      isOpenFunnel: true,
      steps: funnel.steps.map((s) => ({ name: s.name, filterExpression: stepFilter(s) })),
    },
  });
  const table = res.funnelTable ?? {};
  const metric = (table.metricHeaders ?? []).findIndex((m) => m.name === "activeUsers");
  const users = new Array(funnel.steps.length).fill(0);
  for (const row of table.rows ?? []) {
    const label = row.dimensionValues?.[0]?.value ?? "";
    const n = Number.parseInt(label, 10); // "1. Article view"
    if (n >= 1 && n <= users.length && metric >= 0) users[n - 1] = Number(row.metricValues[metric].value);
  }
  return users;
}

/** affiliate_click counts by the given dimensions, for one date range. */
async function paidClicks(propertyId, dimensions, range, limit = 10) {
  const res = await post(`v1beta/properties/${propertyId}:runReport`, {
    dateRanges: [range],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: [{ name: "eventCount" }],
    dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "affiliate_click" } } },
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit,
  });
  return (res.rows ?? []).map((r) => ({
    keys: r.dimensionValues.map((d) => d.value),
    count: Number(r.metricValues[0].value),
  }));
}

// ---------- report ----------

const fmt = (n) => n.toLocaleString("en-US");
const delta = (now, before) => {
  if (!before) return now ? "new" : "–";
  const pct = Math.round(((now - before) / before) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
};
const rate = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : "–");

const out = [];
out.push(`## GA4 funnels: ${current.startDate} to ${current.endDate}`);
out.push(`Compared with ${previous.startDate} to ${previous.endDate}. Open funnels, active users per step.`);

for (const prop of config.properties) {
  out.push("", `### ${prop.name}`);
  try {
    for (const funnel of prop.funnels ?? []) {
      const [now, before] = await Promise.all([
        funnelUsers(prop.id, funnel, current),
        funnelUsers(prop.id, funnel, previous),
      ]);
      out.push("", `**${funnel.name}**`, "", "| Step | Users | Previous week | Change | From step 1 |", "|---|--:|--:|--:|--:|");
      funnel.steps.forEach((s, i) => {
        out.push(`| ${i + 1}. ${s.name} | ${fmt(now[i])} | ${fmt(before[i])} | ${delta(now[i], before[i])} | ${i ? rate(now[i], now[0]) : ""} |`);
      });
    }

    if (prop.paidClicks !== false) {
      const [byOffer, byOfferPrev, byPage] = await Promise.all([
        paidClicks(prop.id, ["customEvent:company", "customEvent:offer_id"], current),
        paidClicks(prop.id, ["customEvent:company", "customEvent:offer_id"], previous, 50),
        paidClicks(prop.id, ["pagePath"], current),
      ]);
      const prevMap = new Map(byOfferPrev.map((r) => [r.keys.join("|"), r.count]));
      if (byOffer.length) {
        out.push("", "**Paid clicks by programme and offer**", "", "| Programme | Offer | Clicks | Previous week |", "|---|---|--:|--:|");
        for (const r of byOffer) out.push(`| ${r.keys[0]} | ${r.keys[1]} | ${fmt(r.count)} | ${fmt(prevMap.get(r.keys.join("|")) ?? 0)} |`);
        out.push("", "**Pages with the most paid clicks**", "", "| Page | Clicks |", "|---|--:|");
        for (const r of byPage) out.push(`| ${r.keys[0]} | ${fmt(r.count)} |`);
      } else {
        out.push("", "_No paid clicks recorded this week._");
      }
    }
  } catch (err) {
    out.push("", `✗ ${err.message}`);
  }
}

out.push(
  "",
  "_GA4 sees the click, not the commission: compare with the programmes' own dashboards (Awin, Amazon Associates, Hostinger, RackNerd, Gumroad)._",
);

const report = out.join("\n") + "\n";
const file = option("--out");
if (file) await writeFile(file, report);
process.stdout.write(report);
