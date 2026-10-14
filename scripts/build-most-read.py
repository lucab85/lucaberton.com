"""Refresh src/data/most-read.json: the blog's most-read posts of the last 7 days.

Reads GA4 organic-search page views through the self-hosted OpenSEO MCP server
(organic only, so bot "Direct" traffic doesn't skew the ranking). Run on the VPS:

    python3 scripts/build-most-read.py            # default: container on the docker network
    OPENSEO_MCP=http://<ip>:3001/mcp python3 scripts/build-most-read.py

Commit the JSON; the site build only reads the file.
"""
import datetime as dt
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG = os.path.join(ROOT, "src/content/blog")
OUT = os.path.join(ROOT, "src/data/most-read.json")
MCP = os.environ.get("OPENSEO_MCP", "http://172.18.0.19:3001/mcp")
PROJECT = os.environ.get("OPENSEO_PROJECT", "d1fee98c-665c-49ae-a25f-1a2cbb1f8e8a")  # lucaberton.com
TOP = 8


def call(name, arguments):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                       "params": {"name": name, "arguments": arguments}}).encode()
    req = urllib.request.Request(MCP, data=body, headers={
        "Host": "seo.openempower.com", "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"})
    raw = urllib.request.urlopen(req, timeout=180).read().decode()
    lines = [l[5:].strip() if l.startswith("data:") else l for l in raw.splitlines()]
    msg = json.loads([l for l in lines if l.startswith("{")][-1])
    if "error" in msg:
        sys.exit(f"OpenSEO error: {msg['error']}")
    return "\n".join(c.get("text", "") for c in msg["result"]["content"])


def title_of(slug):
    for ext in (".mdx", ".md"):
        path = os.path.join(BLOG, slug + ext)
        if os.path.exists(path):
            m = re.search(r'^title:\s*"?(.*?)"?\s*$', open(path, encoding="utf-8").read().split("---", 2)[1], re.M)
            return m.group(1) if m else None
    return None


def main():
    end = dt.date.today() - dt.timedelta(days=1)
    start = end - dt.timedelta(days=6)
    text = call("get_google_analytics_page_performance", {
        "projectId": PROJECT, "startDate": start.isoformat(), "endDate": end.isoformat(),
        "limit": 60, "channel": "organic_search"})
    posts = []
    for line in text.splitlines():
        cols = [c.strip() for c in line.split("|")]
        if len(cols) < 4 or not cols[1].startswith("/blog/"):
            continue
        slug = cols[1].strip("/").split("/", 1)[-1]
        if not slug or "/" in slug:
            continue
        title = title_of(slug)
        if title:
            posts.append({"slug": slug, "title": title, "views": int(cols[2])})
        if len(posts) == TOP:
            break
    if len(posts) < 3:
        sys.exit(f"only {len(posts)} posts found; not overwriting {OUT}")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"generated": dt.date.today().isoformat(), "range": [start.isoformat(), end.isoformat()],
                   "posts": posts}, f, indent=2, ensure_ascii=False)
        f.write("\n")
    for p in posts:
        print(f"{p['views']:>5}  {p['slug']}")


if __name__ == "__main__":
    main()
