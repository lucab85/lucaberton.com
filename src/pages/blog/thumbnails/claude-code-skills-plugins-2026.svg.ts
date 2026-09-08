export const prerender = true;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">Inside Claude Code Skills and Plugins: How to Extend Your AI Coding Agent</title>
  <desc id="desc">A clean editorial thumbnail showing the Claude Code skills and plugins ecosystem: marketplace, plugins, skills, and example tools like Hyperframes, Ponytail, and Claude Ads.</desc>
  <rect width="1200" height="630" fill="#f7f8fb"/>
  <rect x="48" y="48" width="1104" height="534" rx="18" fill="#ffffff" stroke="#d8dee9" stroke-width="2"/>
  <text x="86" y="122" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#111827">Claude Code Skills</text>
  <text x="88" y="160" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#4b5563">&amp; Plugins: The Extensibility Layer</text>

  <g transform="translate(86 210)">
    <rect width="340" height="150" rx="14" fill="#eef2fb" stroke="#c7d3ea" stroke-width="1.5"/>
    <circle cx="50" cy="40" r="26" fill="#8bb7df"/>
    <text x="50" y="48" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#ffffff">S</text>
    <text x="155" y="40" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#111827">Skills and SKILL.md</text>
    <text x="155" y="66" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#4b5563">Reusable AI instructions</text>
    <text x="155" y="88" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">Auto-invoked or manual</text>
    <text x="155" y="110" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">Dynamic context injection</text>
  </g>

  <g transform="translate(466 210)">
    <rect width="340" height="150" rx="14" fill="#f6efe3" stroke="#e6d6b8" stroke-width="1.5"/>
    <circle cx="50" cy="40" r="26" fill="#caa13c"/>
    <text x="50" y="48" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#ffffff">P</text>
    <text x="155" y="40" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#111827">Plugins and marketplaces</text>
    <text x="155" y="66" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#4b5563">Packaged extensions</text>
    <text x="155" y="88" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">Distribute to teams</text>
    <text x="155" y="110" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">Auto-update support</text>
  </g>

  <g transform="translate(846 210)">
    <rect width="340" height="150" rx="14" fill="#e9f3ec" stroke="#c3ddc9" stroke-width="1.5"/>
    <circle cx="50" cy="40" r="26" fill="#5fa876"/>
    <text x="50" y="48" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#ffffff">H</text>
    <text x="155" y="40" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#111827">Hyperframes</text>
    <text x="155" y="66" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#4b5563">HTML to video rendering</text>
    <text x="155" y="88" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">47.5k stars, HeyGen</text>
    <text x="155" y="110" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">npx skills add</text>
  </g>

  <g transform="translate(86 390)">
    <rect width="340" height="150" rx="14" fill="#f3e9ef" stroke="#ddc3d3" stroke-width="1.5"/>
    <circle cx="50" cy="40" r="26" fill="#b06a91"/>
    <text x="50" y="48" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#ffffff">V</text>
    <text x="155" y="40" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#111827">Vibe Trading</text>
    <text x="155" y="66" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#4b5563">AI trading agents</text>
    <text x="155" y="88" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">64 finance skills</text>
    <text x="155" y="110" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">Multi-agent swarms</text>
  </g>

  <g transform="translate(466 390)">
    <rect width="340" height="150" rx="14" fill="#e0f0fe" stroke="#a3c6f0" stroke-width="1.5"/>
    <circle cx="50" cy="40" r="26" fill="#2563eb"/>
    <text x="50" y="48" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#ffffff">P</text>
    <text x="155" y="40" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#111827">Ponytail (132k stars)</text>
    <text x="155" y="66" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#4b5563">Minimal code enforcement</text>
    <text x="155" y="88" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">Cross-agent standard</text>
    <text x="155" y="110" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">YAGNI for AI agents</text>
  </g>

  <g transform="translate(846 390)">
    <rect width="340" height="150" rx="14" fill="#fef3e6" stroke="#fed5a3" stroke-width="1.5"/>
    <circle cx="50" cy="40" r="26" fill="#f59e0b"/>
    <text x="50" y="48" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#ffffff">C</text>
    <text x="155" y="40" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#111827">Claude Ads</text>
    <text x="155" y="66" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#4b5563">Marketing agency in code</text>
    <text x="155" y="88" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">250+ audit checks</text>
    <text x="155" y="110" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7280">12 ad platforms</text>
  </g>

  <text x="86" y="560" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#6b7280">Skills, plugins, and marketplaces are how Claude Code grows from a coding assistant to a platform</text>
</svg>`;

export function GET() {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
