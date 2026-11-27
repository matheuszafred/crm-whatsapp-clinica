import { CrmProvider } from "@/lib/crm-store";

// A casca (sidebar + área principal) vive no layout raiz, valendo para o sistema
// inteiro. Aqui fica só o provider de dados, porque buscar leads exige a senha e
// as telas de métrica não podem nem tentar.
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <CrmProvider>{children}</CrmProvider>;
}
