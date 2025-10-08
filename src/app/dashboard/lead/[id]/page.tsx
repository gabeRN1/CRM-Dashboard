// app/dashboard/lead/[id]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// A página recebe 'params' que contém o ID da URL
export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Busca os dados do lead específico
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .single(); // .single() garante que esperamos apenas um resultado

  // Busca o histórico de interações para este lead
  const { data: interactions, error: interactionsError } = await supabase
    .from("interactions")
    .select("*")
    .eq("lead_id", params.id)
    .order("created_at", { ascending: false });

  // Se o lead não for encontrado, redireciona para o dashboard
  if (!lead) {
    return redirect("/dashboard");
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Coluna de Informações do Lead */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{lead.name}</CardTitle>
                <Button variant="outline" size="sm">Editar</Button>
              </div>
              <CardDescription>{lead.company || "Sem empresa"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm">Status</h4>
                <Badge>{lead.status}</Badge>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Email</h4>
                <p className="text-sm text-muted-foreground">{lead.email || "Não informado"}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Telefone</h4>
                <p className="text-sm text-muted-foreground">{lead.phone || "Não informado"}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Observações</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes || "Nenhuma"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna do Histórico de Interações */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-4">Histórico de Interações</h2>
          <div className="space-y-4">
            {/* Aqui vamos adicionar um formulário para novas interações */}
            
            {interactions && interactions.length > 0 ? (
              interactions.map((interaction) => (
                <Card key={interaction.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{interaction.type}</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {new Date(interaction.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{interaction.content}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma interação registrada ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}