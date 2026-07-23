export const prerender = true;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">Top 100 platform companies and AI concentration</title>
  <desc id="desc">A clean editorial thumbnail showing the concentration of platform company value by region, based on Holger Schmidt and Hamidreza Hosseini 2025 data.</desc>
  <rect width="1200" height="630" fill="#f7f8fb"/>
  <rect x="48" y="48" width="1104" height="534" rx="18" fill="#ffffff" stroke="#d8dee9" stroke-width="2"/>
  <text x="86" y="122" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700" fill="#111827">AI and the Platform Economy</text>
  <text x="88" y="162" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#4b5563">Top 100 platforms reached $22.7T in known market value and valuations</text>
  <g transform="translate(86 224)">
    <circle cx="130" cy="130" r="130" fill="#caa13c"/>
    <text x="130" y="119" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#ffffff">86%</text>
    <text x="130" y="158" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#ffffff">America</text>
  </g>
  <g transform="translate(390 275)">
    <circle cx="84" cy="84" r="84" fill="#9b7b3a"/>
    <text x="84" y="78" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="#ffffff">11%</text>
    <text x="84" y="110" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#ffffff">Asia-Pacific</text>
  </g>
  <g transform="translate(610 305)">
    <circle cx="58" cy="58" r="58" fill="#8bb7df"/>
    <text x="58" y="54" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700" fill="#ffffff">2%</text>
    <text x="58" y="82" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#ffffff">Europe</text>
  </g>
  <g transform="translate(780 325)">
    <circle cx="42" cy="42" r="42" fill="#2f6fb3"/>
    <text x="42" y="40" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff">1%</text>
    <text x="42" y="64" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#ffffff">Africa</text>
  </g>
  <g transform="translate(910 232)">
    <rect x="0" y="0" width="184" height="236" rx="12" fill="#111827"/>
    <text x="24" y="48" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#ffffff">Top concentration</text>
    <text x="24" y="101" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="#ffffff">80%</text>
    <text x="24" y="136" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#d1d5db">of total value is</text>
    <text x="24" y="162" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#d1d5db">held by the ten</text>
    <text x="24" y="188" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#d1d5db">largest platforms</text>
  </g>
  <text x="86" y="542" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#6b7280">Data and chart source: Prof. Dr. Holger Schmidt / Hamidreza Hosseini, 2025</text>
</svg>`;

export function GET() {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
