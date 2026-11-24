#!/usr/bin/env python3
"""Make a 1200x630 title card JPEG (for talks with no photo yet).
Usage: python3 -I make_card.py OUT.jpg "KICKER" "Title" "Subtitle" "Speaker . Company" "Date . site" [#accent]
Needs macOS Google Chrome (headless) and sips. Keep this script OUTSIDE the output dir."""
import subprocess, sys, tempfile, os, html
out, kicker, title, sub, who, foot = sys.argv[1:7]
accent = sys.argv[7] if len(sys.argv) > 7 else "#38bdf8"
e = html.escape
page = f'''<html><body style="margin:0;width:1200px;height:630px;background:#0f172a;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box;border-left:14px solid {accent}">
<div style="font-size:24px;letter-spacing:4px;color:{accent};font-weight:700">{e(kicker)}</div>
<div style="font-size:74px;font-weight:800;line-height:1.08;margin:26px 0 20px">{e(title)}</div>
<div style="font-size:34px;color:#94a3b8">{e(sub)}</div>
<div style="font-size:28px;color:#e2e8f0;margin-top:56px">{e(who)}</div>
<div style="font-size:22px;color:#64748b;margin-top:14px">{e(foot)}</div></body></html>'''
chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
with tempfile.TemporaryDirectory() as t:
    h, png = os.path.join(t, "c.html"), os.path.join(t, "c.png")
    open(h, "w").write(page)
    subprocess.run([chrome, "--headless", "--disable-gpu", "--hide-scrollbars", "--window-size=1200,630",
                    f"--screenshot={png}", f"file://{h}"], stderr=subprocess.DEVNULL, check=True)
    subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "88", png, "--out", out],
                   stdout=subprocess.DEVNULL, check=True)
print(out)
