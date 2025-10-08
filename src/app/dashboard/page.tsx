// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link'; // Importação adicionada

// Import dos nossos componentes
import { CrmDashboard } from '@/components/crm-dashboard'; 
import { AddLeadDialog } from '@/components/add-lead-dialog';
import { UserNav } from '@/components/user-nav';
import { ImportLeadsDialog } from '@/components/import-leads-dialog';
import { Button } from '@/components/ui/button'; // Importação adicionada

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return redirect('/login'); }

    const { data: leads } = await supabase.from('leads').select('*').order('created_at', { ascending: false });

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <header className="sticky top-0 z-10 w-full border-b bg-white shadow-sm">
                <div className="container mx-auto flex h-16 items-center">
                    <h1 className="text-xl font-bold text-slate-800">Meu Pipeline</h1>
                    
                    {/* Botões de ação no cabeçalho */}
                    <div className="ml-auto flex items-center space-x-2 md:space-x-4">
                        
                        {/* Botão de Importar Adicionado */}
                        <ImportLeadsDialog />

                        {/* Botão de Exportar Adicionado */}
                        <Link href="/api/leads/export" passHref legacyBehavior>
                          <Button variant="outline">Exportar</Button>
                        </Link>
                        
                        {/* Botões existentes */}
                        <AddLeadDialog />
                        <UserNav userEmail={user.email} />
                    </div>

                </div>
            </header>
            
            <main className="flex-1 overflow-auto">
                <div className="container mx-auto p-4 md:p-8">
                    <CrmDashboard initialLeads={leads || []} />
                </div>
            </main>
        </div>
    );
}