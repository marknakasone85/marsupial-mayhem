"""Checks the home-network share server's safety rules without starting it.
Run by tools/run-tests.sh (python3 -I tools/tests/test_server.py)."""
import importlib.util
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("share_server", ROOT / "tools" / "share_server.py")
srv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(srv)

passed = failed = 0


def check(ok, what):
    global passed, failed
    if ok:
        passed += 1
    else:
        failed += 1
    print(("  PASS  " if ok else "  FAIL  ") + what)


# the game's own files are served
for path in ["/", "/index.html", "/js/core/engine.js", "/js/scenes/menu.js", "/css/style.css"]:
    check(srv.game_file(path)[1] is not None, f"serves {path}")

# everything else is refused: hidden files, backups, tools, notes, folders, trick addresses
for path in ["/.git/config", "/.git/HEAD", "/.nojekyll", "/.claude/launch.json", "/js/.hidden",
             "/js/../.git/config", "/js/%2e%2e/.git/config", "/js/%252e%252e/%252egit/config",
             "/css/..%2f..%2fCLAUDE.md", "/tools/share_server.py", "/README.md", "/CLAUDE.md",
             "/docs/DESIGN.md", "/data/roster.json", "/share-on-network.command",
             "/js", "/js/", "/js/core/", "/js\\core\\engine.js", "/js/core/engine.js%00"]:
    check(srv.game_file(path)[1] is None, f"refuses {path}")

# only IP addresses and home names get answers (blocks DNS rebinding)
for host in ["localhost:8020", "127.0.0.1:8020", "[::1]:8020", "192.168.1.5:8020", "my-mac.local:8020"]:
    check(srv.host_ok(host), f"answers {host}")
for host in ["evil.example.com:8020", "marknakasone85.github.io", "", None, "localhost.evil.com"]:
    check(not srv.host_ok(host), f"ignores {host!r}")

# guest messages are size-capped and need the game's header
source = (ROOT / "tools" / "share_server.py").read_text()
check(srv.MAX_BODY <= 256 * 1024 and srv.MAX_PLAYERS == 4 and srv.WRONG_CODE_LIMIT <= 8, "message cap, 4 players, wrong-code lockout")
check('self.headers.get("X-Mayhem") != "1"' in source and "'X-Mayhem': '1'" in (ROOT / "js/net/net.js").read_text(),
      "server and game agree on the X-Mayhem header")
check("default=8020" in source and "--port 8020" in (ROOT / "share-on-network.command").read_text(),
      "the share uses port 8020")

print(f"share server: {passed} passed, {failed} failed")
