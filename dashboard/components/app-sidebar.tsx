"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  KanbanSquare,
  MessagesSquare,
  Search,
  Activity,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCrmOpcional } from "@/lib/crm-store";
import { precisaRetorno } from "@/lib/crm-labels";

// Atendimento primeiro: é onde a secretária trabalha todo dia. As telas de
// métrica ficam num grupo separado, porque são consulta e não operação.
const ATENDIMENTO = [
  { href: "/crm", label: "Conversas", icon: MessagesSquare },
  { href: "/crm/pipeline", label: "Pipeline", icon: KanbanSquare },
];

const METRICAS = [
  { href: "/operacao", label: "Operação", icon: Activity },
  { href: "/", label: "Analytics", icon: BarChart3 },
  { href: "/seo", label: "SEO", icon: Search },
];

export function AppSidebar() {
  const pathname = usePathname();
  // Fora de /crm não há provider — e nem deveria haver, porque buscar leads
  // exigiria a senha. Sem contador, a sidebar segue funcionando.
  const crm = useCrmOpcional();
  const aRetornar = crm ? crm.leads.filter(precisaRetorno).length : 0;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">
            A
          </div>
          <div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">Clínica Demo</span>
            <span className="truncate text-xs text-muted-foreground">Atendimento</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Atendimento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ATENDIMENTO.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                    {/* Contador só em Conversas: é o número que abre o dia dela. */}
                    {item.href === "/crm" && aRetornar > 0 && (
                      <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[0.7rem] font-medium tabular-nums text-primary-foreground group-data-[collapsible=icon]:hidden">
                        {aRetornar}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Métricas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {METRICAS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />} tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-3">
        <p className="text-[0.7rem] leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
          Daedalus · dados de paciente, acesso restrito
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
