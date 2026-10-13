"""Serve one local file to the Google Play Console page so it can be uploaded.

Usage: python3 -I tools/aab-serve.py <path-to-file> [port]

- Listens on 127.0.0.1 only (not reachable from other machines).
- Serves just this one file at /file, and only to pages on
  https://play.google.com (CORS); every other path returns 404.
- Exits by itself after the file has been sent once, or after 10 minutes.
"""
import http.server
import os
import sys
import threading

if len(sys.argv) < 2 or not os.path.isfile(sys.argv[1]):
    sys.exit("usage: aab-serve.py <existing-file> [port]")

PATH = os.path.abspath(sys.argv[1])
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8418
ORIGIN = "https://play.google.com"
TIMEOUT_S = 600


class Handler(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", ORIGIN)
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path != "/file":
            self.send_response(404)
            self.end_headers()
            return
        with open(PATH, "rb") as f:
            data = f.read()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
        print(f"sent {os.path.basename(PATH)} ({len(data)} bytes)", flush=True)
        threading.Thread(target=self.server.shutdown, daemon=True).start()


server = http.server.HTTPServer(("127.0.0.1", PORT), Handler)
timer = threading.Timer(TIMEOUT_S, server.shutdown)
timer.daemon = True
timer.start()
print(f"serving {PATH} on http://127.0.0.1:{PORT}/file for {ORIGIN}", flush=True)
server.serve_forever()
