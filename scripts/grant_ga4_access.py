"""
Adiciona o service account como Leitor na propriedade GA4.
Executa uma vez só — abre o browser para autenticar com sua conta Google pessoal.

Uso:
  python3 grant_ga4_access.py caminho/para/client_secret.json
"""

import sys
import os
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
from google_auth_oauthlib.flow import InstalledAppFlow
from google.analytics.admin import AnalyticsAdminServiceClient
from google.analytics.admin_v1alpha.types import AccessBinding

PROPERTY_ID = "<GA4_PROPERTY_ID>"
SERVICE_ACCOUNT_EMAIL = "<service-account>@<gcp-project>.iam.gserviceaccount.com"
SCOPES = [
    "https://www.googleapis.com/auth/analytics.manage.users",
    "https://www.googleapis.com/auth/userinfo.email",
]


def main():
    if len(sys.argv) < 2:
        print("Uso: python3 grant_ga4_access.py caminho/para/client_secret.json")
        sys.exit(1)

    client_secret_file = sys.argv[1]

    print("Abrindo browser para autenticação...")
    flow = InstalledAppFlow.from_client_secrets_file(client_secret_file, SCOPES)
    creds = flow.run_local_server(port=0)

    import google.auth.transport.requests
    req = google.auth.transport.requests.Request()
    import requests as req_lib
    token_info = req_lib.get(f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={creds.token}")
    print(f"Autenticado como: {token_info.json().get('email')}")

    client = AnalyticsAdminServiceClient(credentials=creds)
    property_name = f"properties/{PROPERTY_ID}"

    binding = AccessBinding(
        user=SERVICE_ACCOUNT_EMAIL,
        roles=["predefinedRoles/viewer"],
    )

    result = client.create_access_binding(parent=property_name, access_binding=binding)
    print(f"\nAcesso concedido com sucesso!")
    print(f"  E-mail: {result.user}")
    print(f"  Funções: {result.roles}")


if __name__ == "__main__":
    main()
