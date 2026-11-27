"""
gbp_auth.py — Autoriza acesso ao Google Business Profile e salva o refresh_token.

Uso:
  cd <raiz do repo>
  python3 scripts/gbp_auth.py

O script abre o browser para autenticação OAuth2 e imprime:
  - GOOGLE_REFRESH_TOKEN_GBP

Adicione ao .env.local e às variáveis de ambiente do Vercel.
"""

import json
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/business.manage"]
CLIENT_SECRET_FILE = Path("oauth2-client-secret.json")

def main():
    if not CLIENT_SECRET_FILE.exists():
        print(f"Arquivo não encontrado: {CLIENT_SECRET_FILE}")
        print("Coloque oauth2-client-secret.json na pasta atual.")
        return

    flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET_FILE), SCOPES)
    creds = flow.run_local_server(port=0)

    print("\n✅ Autenticação concluída!\n")
    print("Adicione ao .env.local e ao Vercel:\n")
    print(f"GOOGLE_REFRESH_TOKEN_GBP={creds.refresh_token}")

    # Testa o acesso
    import urllib.request
    token_req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=urllib.parse.urlencode({
            "client_id": json.load(open(CLIENT_SECRET_FILE))["installed"]["client_id"],
            "client_secret": json.load(open(CLIENT_SECRET_FILE))["installed"]["client_secret"],
            "refresh_token": creds.refresh_token,
            "grant_type": "refresh_token",
        }).encode(),
        method="POST"
    )
    token_resp = json.load(urllib.request.urlopen(token_req))
    access_token = token_resp.get("access_token")

    print("\n🔍 Testando acesso ao Business Profile...")
    import urllib.parse
    req = urllib.request.Request(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    try:
        resp = json.load(urllib.request.urlopen(req))
        accounts = resp.get("accounts", [])
        if accounts:
            print("Contas encontradas:")
            for a in accounts:
                print(f"  - {a.get('accountName')} ({a.get('name')})")
        else:
            print("Nenhuma conta encontrada — verifique se a conta tem perfil no Google Meu Negócio.")
    except Exception as e:
        print(f"Erro ao listar contas: {e}")

if __name__ == "__main__":
    import urllib.parse
    main()
