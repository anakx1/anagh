import http.server
import socketserver
import json
import subprocess
import os
import re

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class PortfolioHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if self.path == "/api/telemetry":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.end_headers()

            # Gather telemetry
            kernel = "Linux 6.1 (aarch64)"
            try:
                kernel = subprocess.check_output(["uname", "-sr"], stderr=subprocess.DEVNULL).decode().strip()
            except Exception:
                pass

            arch = "aarch64"
            try:
                arch = subprocess.check_output(["uname", "-m"], stderr=subprocess.DEVNULL).decode().strip()
            except Exception:
                pass

            uptime_str = "Active"
            load_str = "Normal"
            try:
                upt_out = subprocess.check_output(["uptime"], stderr=subprocess.DEVNULL).decode().strip()
                # e.g. "14:33:18 up 3:56, 0 users, load average: 1.94, 1.70, 1.52"
                match = re.search(r"up\s+([^,]+),\s+.*?load average:\s*(.*)", upt_out)
                if match:
                    uptime_str = match.group(1).strip()
                    load_str = match.group(2).strip()
                else:
                    uptime_str = upt_out
            except Exception:
                pass

            mem_str = "Available"
            try:
                free_out = subprocess.check_output(["free", "-m"], stderr=subprocess.DEVNULL).decode().splitlines()
                for line in free_out:
                    if line.startswith("Mem:"):
                        parts = line.split()
                        total = round(int(parts[1]) / 1024, 1)
                        used = round(int(parts[2]) / 1024, 1)
                        mem_str = f"{used} GB / {total} GB"
                        break
            except Exception:
                pass

            data = {
                "status": "online",
                "node": "Termux Mobile Edge",
                "kernel": kernel,
                "arch": arch,
                "uptime": uptime_str,
                "load": load_str,
                "memory": mem_str,
                "platform": "Android ARM64"
            }
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        super().do_GET()

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), PortfolioHandler) as httpd:
        print(f"Serving HTTP on 0.0.0.0 port {PORT} (http://localhost:{PORT}/) ...")
        httpd.serve_forever()
