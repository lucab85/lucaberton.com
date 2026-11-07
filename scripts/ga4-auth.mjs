/**
 * Shared Google service-account authentication for the GA4 scripts
 * (ga4-ensure.mjs, ga4-funnels.mjs). No dependencies: the key signs a JWT
 * with node:crypto, which Google exchanges for an access token.
 *
 * The key is a service-account JSON key in the GA4_ADMIN_KEY environment
 * variable (GitHub secret). Never printed.
 */
import { createSign } from "node:crypto";

export function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

export function readKey() {
  const raw = process.env.GA4_ADMIN_KEY;
  if (!raw) fail("GA4_ADMIN_KEY is not set.");
  let key;
  try {
    key = JSON.parse(raw);
  } catch {
    fail(
      `GA4_ADMIN_KEY is not valid JSON (${raw.length} characters; a service-account key is about 2,300). ` +
        "Set it from the file: gh secret set GA4_ADMIN_KEY -R lucab85/lucaberton.com < key.json",
    );
  }
  if (key.type !== "service_account" || !key.client_email || !key.private_key) {
    fail('GA4_ADMIN_KEY is JSON but not a service-account key (needs "type": "service_account", client_email, private_key).');
  }
  return key;
}

const b64url = (data) => Buffer.from(data).toString("base64url");

export async function accessToken(key, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: key.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
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
