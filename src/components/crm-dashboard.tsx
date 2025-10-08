// components/crm-dashboard.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// DnD Imports
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ShadCN UI Imports
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---
type Lead = {
  id: number; name: string; email: string | null; company: string | null;
  phone: string | null; status: string; notes: string | null; source: string | null;
};
type Interaction = {
  id: number; created_at: string; type: string; content: string | null;
};
type Column = { id: string; title: string; };

const KANBAN_COLUMNS: Column[] = [
    { id: 'Prospect', title: 'Prospect' }, { id: 'Contato', title: 'Em Contato' },
    { id: 'Proposta', title: 'Proposta Enviada' }, { id: 'Ganho', title: 'Ganho' }, { id: 'Perdido', title: 'Perdido' },
];

// --- SUB-COMPONENTS ---

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id, data: { type: 'Lead', lead } });
    const style = { transition, transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.5 : 1 };
    
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div onClick={onClick} className="cursor-pointer">
                <Card className="shadow-sm hover:shadow-md hover:bg-slate-50 transition-all cursor-grab active:cursor-grabbing">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{lead.name}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate">{lead.company || 'Empresa não informada'}</p>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {lead.source && <Badge variant="secondary">{lead.source}</Badge>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KanbanColumn({ column, leads, onCardClick }: { column: Column, leads: Lead[], onCardClick: (leadId: number) => void }) {
    const ids = useMemo(() => leads.map(l => l.id), [leads]);
    const { setNodeRef } = useDroppable({ id: column.id });
    return (
        <div ref={setNodeRef} className="min-w-[300px] flex-shrink-0">
            <div className="flex items-center justify-between p-3 border-b bg-slate-200 rounded-t-lg">
                <h3 className="font-semibold text-slate-700">{column.title}</h3>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-1">{leads.length}</span>
            </div>
            <div className="space-y-3 p-3 h-full bg-slate-100 rounded-b-lg">
                <SortableContext items={ids}>{leads.map(lead => <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead.id)} />)}</SortableContext>
                {leads.length === 0 && (<div className="text-center text-sm text-slate-400 py-4">Nenhum lead aqui.</div>)}
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---

export function CrmDashboard({ initialLeads }: { initialLeads: Lead[] }) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLead, setModalLead] = useState<Lead | null>(null);
    const [modalInteractions, setModalInteractions] = useState<Interaction[]>([]);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const router = useRouter();
    const supabase = createClient();
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const searchMatch = searchTerm.toLowerCase() === '' || 
                                lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
            const statusMatch = statusFilter === 'Todos' || lead.status === statusFilter;
            return searchMatch && statusMatch;
        });
    }, [leads, searchTerm, statusFilter]);

    const handleCardClick = (leadId: number) => { setSelectedLeadId(leadId); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedLeadId(null); };

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) return;
        const activeLead = active.data.current?.lead as Lead;
        const newStatus = over.id as string;
        if (KANBAN_COLUMNS.some(col => col.id === newStatus) && activeLead.status !== newStatus) {
            const oldStatus = activeLead.status;
            setLeads((currentLeads) => currentLeads.map((lead) => (lead.id === activeLead.id ? { ...lead, status: newStatus } : lead)));
            const { error: updateError } = await supabase.from('leads').update({ status: newStatus }).eq('id', activeLead.id);
            if (updateError) {
                toast.error("Erro ao mover o lead.", { description: updateError.message });
                router.refresh();
                return;
            }
            const { error: interactionError } = await supabase.from('interactions').insert({
                type: 'Mudança de Status',
                content: `Status alterado de "${oldStatus}" para "${newStatus}".`,
                lead_id: activeLead.id,
            });
            if (interactionError) { toast.warning("Lead movido, mas falha ao registrar interação."); }
            else { toast.success(`Lead "${activeLead.name}" movido para "${newStatus}".`); }
        }
    }

    useEffect(() => {
        async function fetchLeadDetails() {
            if (!selectedLeadId) return;
            setIsModalLoading(true);
            const { data: leadData, error: leadError } = await supabase.from("leads").select("*").eq("id", selectedLeadId).single();
            const { data: interactionsData, error: interactionsError } = await supabase.from("interactions").select("*").eq("lead_id", selectedLeadId).order("created_at", { ascending: false });
            if (leadError || interactionsError) {
                toast.error("Erro ao buscar detalhes.");
                handleCloseModal();
            } else {
                setModalLead(leadData as Lead);
                setModalInteractions(interactionsData || []);
            }
            setIsModalLoading(false);
        }
        if (isModalOpen) { fetchLeadDetails(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLeadId, isModalOpen]);
    
    return (
        <>
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white rounded-lg shadow">
                <div className="flex-1"><Input placeholder="Buscar por nome ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <div className="w-full md:w-[200px]"><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Filtrar por status..." /></SelectTrigger><SelectContent>
                    <SelectItem value="Todos">Todos os Status</SelectItem>
                    {KANBAN_COLUMNS.map(col => (<SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>))}
                </SelectContent></Select></div>
            </div>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto p-1 pb-4">
                    {KANBAN_COLUMNS.map((column) => {
                        const columnLeads = filteredLeads.filter(lead => lead.status === column.id);
                        return <KanbanColumn key={column.id} column={column} leads={columnLeads} onCardClick={handleCardClick} />
                    })}
                </div>
            </DndContext>
            
<Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
    <DialogContent className="w-[95vw] sm:max-w-none sm:w-[900px] h-full md:h-[90vh] flex flex-col p-0">
        
        {/* --- CORREÇÃO APLICADA AQUI --- */}
        {/* O DialogHeader foi movido para fora do bloco condicional */}
        <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-2xl">
                {isModalLoading ? 'Carregando...' : (modalLead?.name || 'Detalhes do Lead')}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 pt-1">
                <Building2 className="h-4 w-4 text-slate-500" />
                {isModalLoading ? '...' : (modalLead?.company || 'Empresa não informada')}
            </DialogDescription>
        </DialogHeader>

        {isModalLoading ? (
            // O Skeleton agora só preenche a área de conteúdo
            <div className="flex-1 grid md:grid-cols-5 gap-8 overflow-y-auto p-6">
                <div className="md:col-span-2 space-y-4"><Skeleton className="h-64 w-full" /></div>
                <div className="md:col-span-3 space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
            </div>
        ) : modalLead && (
            // O conteúdo principal
            <div className="flex-1 grid md:grid-cols-5 gap-8 overflow-y-auto p-6">
                {/* Coluna de Informações */}
                <div className="md:col-span-2 flex flex-col gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Detalhes do Lead</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                            <div className="font-semibold text-slate-600">Status</div>
                            <div><Badge>{modalLead.status}</Badge></div>
                            <div className="font-semibold text-slate-600">Origem</div>
                            <p className="text-slate-900">{modalLead.source || "Não informada"}</p>
                            <div className="font-semibold text-slate-600">Email</div>
                            <p className="text-slate-900 truncate">{modalLead.email || "Não informado"}</p>
                            <div className="font-semibold text-slate-600">Telefone</div>
                            <p className="text-slate-900">{modalLead.phone || "Não informado"}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Observações</h3>
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap bg-slate-50 p-3 rounded-md border">
                            {modalLead.notes || "Nenhuma observação."}
                        </p>
                    </div>
                </div>
                
                {/* Coluna de Histórico */}
                <div className="md:col-span-3">
                    <h2 className="text-xl font-bold mb-4">Histórico de Interações</h2>
                    <div className="space-y-4">
                        {modalInteractions.length > 0 ? (
                            modalInteractions.map((interaction) => (
                                <Card key={interaction.id} className="bg-white">
                                  <CardHeader className="py-3 px-4">
                                    <div className="flex justify-between items-center">
                                      <CardTitle className="text-sm font-semibold">{interaction.type}</CardTitle>
                                      <span className="text-xs text-muted-foreground">{new Date(interaction.created_at).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}</span>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="py-3 px-4"><p className="text-sm whitespace-pre-wrap">{interaction.content}</p></CardContent>
                                </Card>
                            ))
                        ) : ( <p className="text-sm text-muted-foreground mt-4">Nenhuma interação registrada.</p> )}
                    </div>
                </div>
            </div>
        )}
    </DialogContent>
</Dialog>
        </>
    );
}