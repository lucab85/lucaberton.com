#!/usr/bin/env bash
# claude-code-doctor: checks the usual causes of Claude Code install, auth and
# network errors in one pass. Read-only: it changes nothing. Run it from your
# project:
#   bash claude-code-doctor.sh            (or: bash claude-code-doctor.sh /path/to/project)
# Then run Claude Code's own `claude doctor` for the checks only it can do.
#
# Free from https://lucaberton.com/claude-code-doctor/ (c) 2026 Luca Berton.
# Use, copy and share it freely; it comes without warranty. The fixes behind
# each check are on the blog: https://lucaberton.com/blog/
set -uo pipefail

project=${1:-$PWD}
fails=0; warns=0
ok()   { printf '  \033[32mOK\033[0m    %s\n' "$*"; }
warn() { printf '  \033[33mWARN\033[0m  %s\n' "$*"; warns=$((warns + 1)); }
fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$*"; fails=$((fails + 1)); }
hint() { printf '        -> %s\n' "$*"; }
section() { printf '\n%s\n' "$*"; }

section "Install"
if ! command -v claude >/dev/null 2>&1; then
  fail "claude is not on PATH"
  hint "install: https://code.claude.com/docs/en/setup (or: brew install --cask claude-code)"
else
  ver=$(claude --version 2>/dev/null | head -1)
  ok "claude $ver at $(command -v claude)"
  n=$(which -a claude 2>/dev/null | sort -u | wc -l | tr -d ' ')
  if [ "$n" -gt 1 ]; then
    warn "$n different claude binaries on PATH:"; which -a claude | sort -u | sed 's/^/          /'
    hint "keep one install method. Old npm installs shadow the Homebrew cask and the native installer"
  fi
  if command -v npm >/dev/null 2>&1 && npm ls -g --depth=0 @anthropic-ai/claude-code >/dev/null 2>&1; then
    if command -v brew >/dev/null 2>&1 && brew list --cask claude-code >/dev/null 2>&1; then
      warn "installed both as an npm global package and as a Homebrew cask"
      hint "npm uninstall -g @anthropic-ai/claude-code, then: brew reinstall --cask claude-code"
    else
      ok "installed via npm (global)"
    fi
  fi
  if head -c 200 "$(command -v claude)" 2>/dev/null | grep -q 'node'; then
    major=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')
    if [ -z "$major" ]; then fail "claude runs through Node.js, but node is not on PATH"
    elif [ "$major" -lt 18 ]; then fail "Node.js v$major is too old for Claude Code"; hint "install an LTS release (node@22)"
    elif [ "$major" -ge 26 ]; then warn "Node.js v$major: crashes have been reported with very new Node versions"; hint "switch to an LTS release (node@22), or use the native installer or Homebrew cask"
    else ok "Node.js v$major"; fi
  fi
  if [ "$(uname)" = Darwin ] && xattr -p com.apple.quarantine "$(command -v claude)" >/dev/null 2>&1; then
    warn "macOS quarantine flag set on the claude binary (Gatekeeper may block it)"
    hint "System Settings > Privacy & Security > Open Anyway, or remove the flag if you trust the source"
  fi
fi

section "Authentication"
set_vars=$(env | grep -E '^(ANTHROPIC_API_KEY|ANTHROPIC_AUTH_TOKEN|CLAUDE_CODE_OAUTH_TOKEN|CLAUDE_CODE_USE_BEDROCK|CLAUDE_CODE_USE_VERTEX|CLAUDE_CODE_USE_FOUNDRY)=' | cut -d= -f1 | tr '\n' ' ')
if [ -n "$set_vars" ]; then
  warn "credential variables set in this shell: $set_vars"
  hint "these take precedence over your Claude subscription login. If you meant to use Pro/Max/Team, unset them, /logout, log in again"
  hint "check which credential is active with /status inside Claude Code"
else
  ok "no credential variables in the environment (subscription login or apiKeyHelper will be used)"
fi

section "Network"
proxies=$(env | grep -iE '^(https?_proxy|all_proxy|no_proxy)=' | cut -d= -f1 | tr '\n' ' ')
[ -n "$proxies" ] && warn "proxy variables set: $proxies" && hint "a proxy or VPN is the most common cause of ECONNRESET and 'Response stalled mid-stream'"
[ -n "${NODE_EXTRA_CA_CERTS:-}" ] && ok "NODE_EXTRA_CA_CERTS=$NODE_EXTRA_CA_CERTS (custom CA bundle)"
if command -v curl >/dev/null 2>&1; then
  out=$(curl -sS -m 15 -o /dev/null -w '%{http_code} %{time_total}' https://api.anthropic.com 2>&1)
  code=${out%% *}
  if [[ $code =~ ^[1-5][0-9][0-9]$ ]]; then
    ok "api.anthropic.com reachable (HTTP $code in ${out#* }s; any HTTP status here is fine)"
    issuer=$(curl -sv -m 15 -o /dev/null https://api.anthropic.com 2>&1 | grep -i 'issuer:' | head -1 | sed 's/^[* ]*//')
    [ -n "$issuer" ] && ok "TLS $issuer"
    hint "if the issuer is your company's CA, a TLS-inspecting proxy sits in the path; ask IT to exempt api.anthropic.com:443"
  else
    fail "cannot reach api.anthropic.com: $out"
    hint "drop the VPN/proxy or try a phone hotspot; then: curl -v https://api.anthropic.com to see where TLS breaks"
  fi
else
  warn "curl not found, skipped the connectivity check"
fi

section "Settings files"
check_json() {
  local f=$1
  [ -f "$f" ] || return 0
  if python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$f" 2>/dev/null; then ok "valid JSON: $f"
  else fail "invalid JSON: $f"; hint "a malformed settings file can crash every launch; fix it or move it aside"; fi
}
for f in "$HOME/.claude/settings.json" "$HOME/.claude.json" "$project/.claude/settings.json" "$project/.claude/settings.local.json" "$project/.mcp.json"; do
  check_json "$f"
done

section "Hooks"
hook_report=$(python3 - "$project" <<'PY'
import json, os, sys
project = sys.argv[1]
files = [os.path.expanduser("~/.claude/settings.json"),
         os.path.join(project, ".claude/settings.json"),
         os.path.join(project, ".claude/settings.local.json")]
seen = 0
for f in files:
    try:
        hooks = json.load(open(f)).get("hooks", {})
    except (OSError, ValueError):
        continue
    for event, groups in hooks.items():
        for g in groups:
            for h in g.get("hooks", []):
                if h.get("type") != "command":
                    continue
                seen += 1
                cmd = h["command"].replace("${CLAUDE_PROJECT_DIR}", project).replace("$CLAUDE_PROJECT_DIR", project)
                path = os.path.expanduser(cmd.split()[0]) if "args" not in h else os.path.expanduser(cmd)
                if os.path.isabs(path) and not os.path.exists(path):
                    print(f"  \033[31mFAIL\033[0m  {event}: hook not found: {path}")
                    print("        -> a missing hook script fails open: the tool call goes ahead unchecked")
                elif os.path.isabs(path) and not os.access(path, os.X_OK):
                    print(f"  \033[31mFAIL\033[0m  {event}: hook not executable: {path}")
                    print(f"        -> chmod +x {path}")
if seen == 0:
    print("  \033[33mWARN\033[0m  no command hooks registered (no guardrails installed)")
else:
    print(f"  \033[32mOK\033[0m    {seen} command hook(s) registered; missing or broken ones are listed above")
PY
)
printf '%s\n' "$hook_report"
fails=$((fails + $(printf '%s' "$hook_report" | grep -c FAIL)))
warns=$((warns + $(printf '%s' "$hook_report" | grep -c WARN)))

printf '\n%s failure(s), %s warning(s). Next: run `claude doctor` (or /doctor) for the checks only Claude Code can do.\n' "$fails" "$warns"
[ "$fails" -eq 0 ]
