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

# ---- the real server and relay, on a spare port on this computer only
import http.client
import json
import threading

srv.ADDRESS = "http://127.0.0.1:0"
server = srv.http.server.ThreadingHTTPServer(("127.0.0.1", 0), srv.GameOnlyHandler)
server.daemon_threads = True
port = server.server_address[1]
threading.Thread(target=server.serve_forever, daemon=True).start()
threading.Thread(target=srv.janitor, daemon=True).start()


def call(method, path, body=None, host=None, header=True, raw=None):
    c = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
    headers = {"Host": host or f"127.0.0.1:{port}", "Content-Type": "application/json"}
    if header:
        headers["X-Mayhem"] = "1"
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    c.request(method, path, body=data, headers=headers)
    r = c.getresponse()
    text = r.read()
    c.close()
    try:
        return r.status, json.loads(text or b"{}")
    except ValueError:
        return r.status, {}


st, _ = call("GET", "/")
check(st == 200, "the game page is served")
st, _ = call("GET", "/.git/config")
check(st == 404, "the backup history is not served")
st, _ = call("GET", "/", host="evil.example.com")
check(st == 403, "a page reached by a website's name is refused (DNS rebinding)")
st, _ = call("POST", "/net/host", {}, header=False)
check(st == 403, "Wi-Fi messages without the game's header are refused")
st, h = call("POST", "/net/host", {})
check(st == 200 and len(h.get("code", "")) == 4 and h["code"].isdigit() and h.get("token"), "this computer can host: 4-digit code " + h.get("code", "?"))
code, host_token = h["code"], h["token"]
wrong = "0000" if code != "0000" else "1111"
st, _ = call("POST", "/net/join", {"code": wrong})
check(st == 403, "a wrong code is refused")
for _ in range(10):
    st, _ = call("POST", "/net/join", {"code": wrong})
check(st == 429, "too many wrong codes: locked out for a minute")
st, _ = call("POST", "/net/join", {"code": code})
check(st == 429, "...even with the right code while locked out")
srv.FAILS.clear()
st, g = call("POST", "/net/join", {"code": code})
check(st == 200 and g.get("id") == 1 and g.get("token"), "the right code joins as player 2")
st, _ = call("POST", "/net/send?token=" + g["token"], {"to": "all", "m": {"t": "in", "n": 1, "p": ["attackP"]}})
queued = [json.loads(x) for x in srv.ROOM.host.queue]
check(st == 204 and any(q.get("from") == 1 and q["m"]["t"] == "in" for q in queued), "a friend's button press reaches the host")
st, _ = call("POST", "/net/send?token=not-a-token", {"to": "all", "m": {"t": "in"}})
check(st == 403, "messages need a real player token")
st, _ = call("POST", "/net/send?token=" + g["token"], raw=b"x" * (srv.MAX_BODY + 10))
check(st == 413, "oversized messages are refused")
srv.ROOM.host.queue.clear()
st, back = call("POST", "/net/join", {"code": code, "token": g["token"]})
check(st == 200 and back.get("id") == 1 and back.get("token") != g["token"] and back.get("rejoined"),
      "a dropped player rejoins with their old token and keeps player number 2")
check(not any(json.loads(x)["m"].get("t") == "joined" for x in srv.ROOM.host.queue), "...without the host seeing a new player")
st, _ = call("POST", "/net/send?token=" + g["token"], {"to": "all", "m": {"t": "in"}})
check(st == 403, "the old token stops working")
st, other = call("POST", "/net/join", {"code": code, "token": host_token})
check(st == 200 and other.get("id") == 2, "the host's token can't be used to take over the host")
st, r = call("POST", "/net/host", {"code": "9999" if code != "9999" else "8888", "rehost": True})
check(st == 409 and r.get("taken"), "a second window reconnecting by itself can't take over the game")
st, again = call("POST", "/net/host", {"code": code, "rehost": True})
check(st == 200 and again.get("code") == code, "the host window gets its own code back after a lost connection")
for i in range(3):
    srv.FAILS.clear()
    call("POST", "/net/join", {"code": code})
srv.FAILS.clear()
st, full = call("POST", "/net/join", {"code": code})
check(st == 409, "the game is full at 4 players")
server.shutdown()

print(f"share server: {passed} passed, {failed} failed")
