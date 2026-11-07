#!/usr/bin/env node
/**
 * ga4-ensure.mjs: makes every GA4 property of the group carry the key events
 * and custom dimensions listed in scripts/ga4-ensure.config.json, through the
 * Google Analytics Admin API. Idempotent: it only creates what is missing,
 * and never edits or deletes anything.
 *
 * Credentials: a service-account JSON key in the GA4_ADMIN_KEY environment
 * variable (GitHub secret). The service account needs the Editor role on the
 * GA4 accounts (Admin > Account access management); to just read, Viewer is
 * enough for --dry-run.
 *
 * Usage:
 *   node scripts/ga4-ensure.mjs --dry-run   # report what is missing, change nothing
 *   node scripts/ga4-ensure.mjs             # create what is missing
 * Exits 1 on a credential or API error (missing items are reported, not
 * errors). Never prints the key.
 */
import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dryRun = process.argv.includes("--dry-run");
const here = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(await readFile(path.join(here, "ga4-ensure.config.json"), "utf8"));
const API = "https://analyticsadmin.googleapis.com/v1beta";
const SCOPE = dryRun
  ? "https://www.googleapis.com/auth/analytics.readonly"
  : "https://www.googleapis.com/auth/analytics.edit";

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

// ---------- credentials ----------

function readKey() {
  const raw = process.env.GA4_ADMIN_KEY;
  if (!raw) fail("GA4_ADMIN_KEY is not set.");
  let key;
  try {
    key = JSON.parse(raw);
  } catch {
    fail(
      `GA4_ADMIN_KEY is not valid JSON (${raw.length} characters; a service-account key is about 2,300). ` +
        "Pasting at the gh prompt keeps only the first line. Set it from the file instead: " +
        "gh secret set GA4_ADMIN_KEY -R lucab85/lucaberton.com < key.json",
    );
  }
  if (key.type !== "service_account" || !key.client_email || !key.private_key) {
    fail('GA4_ADMIN_KEY is JSON but not a service-account key (needs "type": "service_account", client_email, private_key).');
  }
  return key;
}

const b64url = (data) => Buffer.from(data).toString("base64url");

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const jwt = `${header}.${claims}.${signer.sign(key.private_key, "base64url")}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) fail(`Google refused the key (${res.status} ${body.error ?? ""}: ${body.error_description ?? ""}).`);
  return body.access_token;
}

// ---------- Admin API ----------

let token;
let email;

async function api(method, url, body) {
  const res = await fetch(`${API}/${url}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.error?.message ?? res.statusText;
    if (/has not been used|is disabled/i.test(msg)) {
      throw new Error(`${res.status} ${msg}. Enable the Google Analytics Admin API in the service account's Cloud project.`);
    }
    if (res.status === 403) {
      throw new Error(`403 ${msg}. Add ${email} to this property's GA4 account (Admin > Account access management) as ${dryRun ? "Viewer or higher" : "Editor"}.`);
    }
    throw new Error(`${res.status} ${msg}`);
  }
  return json;
}

async function listAll(url, field) {
  const items = [];
  let pageToken = "";
  do {
    const page = await api("GET", `${url}?pageSize=200${pageToken ? `&pageToken=${pageToken}` : ""}`);
    items.push(...(page[field] ?? []));
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);
  return items;
}

// ---------- run ----------

const key = readKey();
email = key.client_email;
token = await accessToken(key);
console.log(`Service account ${email}, ${dryRun ? "dry run (read only)" : "creating what is missing"}\n`);

let errors = 0;
let missing = 0;
let created = 0;

for (const prop of config.properties) {
  const id = `properties/${prop.id}`;
  const label = `${prop.name} (${prop.id})`;
  try {
    const keyEvents = new Set((await listAll(`${id}/keyEvents`, "keyEvents")).map((k) => k.eventName));
    for (const ev of config.keyEvents) {
      if (keyEvents.has(ev.eventName)) {
        console.log(`✓ ${label}  key event ${ev.eventName}`);
        continue;
      }
      missing++;
      if (dryRun) {
        console.log(`✗ ${label}  key event ${ev.eventName} is missing`);
        continue;
      }
      await api("POST", `${id}/keyEvents`, ev);
      created++;
      console.log(`+ ${label}  key event ${ev.eventName} created`);
    }

    const dims = new Map((await listAll(`${id}/customDimensions`, "customDimensions")).map((d) => [`${d.scope}:${d.parameterName}`, d]));
    for (const dim of config.customDimensions) {
      if (dims.has(`${dim.scope}:${dim.parameterName}`)) {
        console.log(`✓ ${label}  dimension ${dim.parameterName}`);
        continue;
      }
      missing++;
      if (dryRun) {
        console.log(`✗ ${label}  dimension ${dim.parameterName} (${dim.displayName}) is missing`);
        continue;
      }
      await api("POST", `${id}/customDimensions`, dim);
      created++;
      console.log(`+ ${label}  dimension ${dim.parameterName} (${dim.displayName}) created`);
    }
  } catch (err) {
    errors++;
    console.log(`✗ ${label}  ${err.message}`);
  }
}

console.log(`\n${config.properties.length} properties: ${created} created, ${dryRun ? missing : missing - created} missing, ${errors} errors`);
process.exit(errors ? 1 : 0);
