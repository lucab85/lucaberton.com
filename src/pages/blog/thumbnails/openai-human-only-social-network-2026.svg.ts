export const prerender = true;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">OpenAI's reported human-only, proof-of-personhood social network</title>
  <desc id="desc">A clean editorial thumbnail summarizing reports of an OpenAI social network requiring biometric proof-of-personhood via Face ID or World's iris-scanning Orb.</desc>
  <rect width="1200" height="630" fill="#f7f8fb"/>
  <rect x="48" y="48" width="1104" height="534" rx="18" fill="#ffffff" stroke="#d8dee9" stroke-width="2"/>
  <text x="86" y="122" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#111827">A Human-Only Social Network?</text>
  <text x="88" y="160" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#4b5563">OpenAI is reportedly exploring proof-of-personhood</text>

  <g transform="translate(86 210)">
    <rect width="300" height="180" rx="14" fill="#eef2fb" stroke="#c7d3ea" stroke-width="1.5"/>
    <circle cx="150" cy="58" r="30" fill="#8bb7df"/>
    <text x="150" y="67" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#ffffff">ID</text>
    <text x="150" y="118" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#111827">Face ID</text>
    <text x="150" y="146" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">Device-based</text>
    <text x="150" y="166" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">verification</text>
  </g>

  <g transform="translate(410 210)">
    <rect width="300" height="180" rx="14" fill="#f6efe3" stroke="#e6d6b8" stroke-width="1.5"/>
    <circle cx="150" cy="58" r="30" fill="#caa13c"/>
    <text x="150" y="67" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#ffffff">Orb</text>
    <text x="150" y="118" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#111827">World ID</text>
    <text x="150" y="146" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">Iris-scan</text>
    <text x="150" y="166" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">biometric ID</text>
  </g>

  <g transform="translate(734 210)">
    <rect width="300" height="180" rx="14" fill="#e9f3ec" stroke="#c3ddc9" stroke-width="1.5"/>
    <circle cx="150" cy="58" r="30" fill="#5fa876"/>
    <text x="150" y="67" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#ffffff">✕</text>
    <text x="150" y="118" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#111827">No Bots</text>
    <text x="150" y="146" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">Reduce spam and</text>
    <text x="150" y="166" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">fake engagement</text>
  </g>

  <text x="88" y="450" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#4b5563">Status: reported and experimental. No launch date, product, or verification</text>
  <text x="88" y="478" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#4b5563">system has been publicly confirmed by OpenAI.</text>

  <text x="88" y="552" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#6b7280">Source: press reporting on OpenAI and World, 2025-2026</text>
</svg>`;

export function GET() {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
