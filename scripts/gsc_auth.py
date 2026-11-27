"""
gsc_auth.py — Autoriza acesso ao Google Search Console e salva o refresh_token.

Uso:
  cd <raiz do repo>
  python3 scripts/gsc_auth.py

O script abre o browser para autenticação OAuth2 e imprime:
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - GOOGLE_REFRESH_TOKEN_GSC

Copie esses valores para as variáveis de ambiente do Vercel.
"""

import json
import os
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
CLIENT_SECRET_FILE = Path(__file__).parent.parent / "oauth2-client-secret.json"

# Fallback: procura na pasta atual
if not CLIENT_SECRET_FILE.exists():
    CLIENT_SECRET_FILE = Path("oauth2-client-secret.json")

def main():
    if not CLIENT_SECRET_FILE.exists():
        print(f"Arquivo não encontrado: {CLIENT_SECRET_FILE}")
        print("Coloque oauth2-client-secret.json na raiz do repo.")
        return

    flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET_FILE), SCOPES)
    creds = flow.run_local_server(port=0)

    # Lê client_id e client_secret do arquivo original
    with open(CLIENT_SECRET_FILE) as f:
        client_data = json.load(f)
    key = list(client_data.keys())[0]
    client_id = client_data[key]["client_id"]
    client_secret = client_data[key]["client_secret"]

    print("\n✅ Autenticação concluída!\n")
    print("Adicione estas variáveis no Vercel (Settings → Environment Variables):\n")
    print(f"GOOGLE_CLIENT_ID={client_id}")
    print(f"GOOGLE_CLIENT_SECRET={client_secret}")
    print(f"GOOGLE_REFRESH_TOKEN_GSC={creds.refresh_token}")

    # Testa o acesso
    print("\n🔍 Testando acesso ao Search Console...")
    service = build("searchconsole", "v1", credentials=creds)
    sites = service.sites().list().execute()
    print("Sites verificados:")
    for site in sites.get("siteEntry", []):
        print(f"  - {site['siteUrl']} ({site['permissionLevel']})")

if __name__ == "__main__":
    main()
