#!/usr/bin/env python3
"""Builds artifact.html: the web version of the game for claude.ai (a private artifact the owner can share).

It's index.html with the stylesheet built in and Wi-Fi play switched off (an artifact has no home relay
server). The game's js/ files are published next to it, unchanged. Run it after every change, then
publish artifact.html with the Artifact tool, passing every js/ path in `files` (the script prints them).
artifact.html is generated, so git ignores it.

    python3 tools/make-artifact.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
index = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "css" / "style.css").read_text(encoding="utf-8")

title = re.search(r"<title>(.*?)</title>", index).group(1)
scripts = re.findall(r'<script src="(js/[^"]+)"></script>', index)
if not scripts or scripts[-1] != "js/main.js":
    raise SystemExit("index.html's script list looks wrong (main.js should be last)")

# One dark look in every theme (the game draws everything on its canvas): colours as tokens.
css = css.replace("background: #1b1430;", "background: var(--bg);").replace("rgba(0, 0, 0, 0.6)", "var(--shadow)")

page = f"""<title>{title}</title>
<!--
  Web version of Marsupial Mayhem for claude.ai, made by tools/make-artifact.py from index.html.
  Same game, minus Wi-Fi play (an artifact has no home relay server). Don't edit: rebuild it.
-->
<style>
  /* Layout: one full-screen game canvas, letterboxed 16:9; the game draws its own touch buttons on top. */
  /* The game keeps its one dark look in every theme. */
  :root {{
    color-scheme: dark;
    --bg: #1b1430;
    --shadow: rgba(0, 0, 0, 0.6);
  }}
{css}
</style>
<canvas id="game" aria-label="Marsupial Mayhem"></canvas>
<script>window.MG_WEB_ONLY = true; // no Wi-Fi menu here</script>
""" + "\n".join(f'<script src="{s}"></script>' for s in scripts) + "\n"

(ROOT / "artifact.html").write_text(page, encoding="utf-8")
print(f"Made artifact.html ({len(page)} bytes, {len(scripts)} scripts).")
print("files for the Artifact tool:")
print(json.dumps({s: s for s in scripts}))
