#!/usr/bin/env python3
"""
Serveur statique pour l'application Mes Ingrédients Frais.

Lancer avec :  python3 server.py
Puis ouvrir :  http://localhost:8000

Pour accéder depuis un iPhone sur le même Wi-Fi :
  http://<IP-du-Mac>:8000
"""

import http.server
import os
from pathlib import Path

PORT = 8000
APP_DIR = Path(__file__).parent / "docs"

os.chdir(APP_DIR)
print(f"\n  Mes Ingrédients Frais")
print(f"  http://localhost:{PORT}\n")

http.server.HTTPServer(("", PORT), http.server.SimpleHTTPRequestHandler).serve_forever()
