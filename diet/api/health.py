from http.server import BaseHTTPRequestHandler

from api.lib.response import json_bytes, success_response


class handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        body = json_bytes(success_response({"status": "ok"}))

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
