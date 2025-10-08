// components/add-lead-dialog.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';

// Componentes da UI
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea'; // Importe o Textarea

const leadFormSchema = z.object({
  name: z.string().min(2, { message: "O nome é obrigatório (mínimo 2 caracteres)." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.string().min(1, { message: "O status é obrigatório." }),
  notes: z.string().optional(),
  source: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

export function AddLeadDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "", email: "", phone: "", company: "",
      status: "Prospect", notes: "", source: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LeadFormValues) {
    const { error } = await supabase
      .from('leads')
      .insert([{
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        company: values.company || null,
        status: values.status,
        notes: values.notes || null,
        source: values.source || null,
      }]);

    if (error) {
      return toast.error("Ocorreu um erro ao adicionar o lead.", {
        description: error.message,
      });
    }

    toast.success("Lead adicionado com sucesso!");
    form.reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar Lead</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Lead</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para cadastrar um novo lead.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* --- CAMPOS ADICIONADOS E REORGANIZADOS --- */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome da Pessoa *</FormLabel><FormControl><Input placeholder="Nome do lead" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="company" render={({ field }) => (
              <FormItem><FormLabel>Empresa</FormLabel><FormControl><Input placeholder="Nome da empresa" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="source" render={({ field }) => (
                <FormItem><FormLabel>Origem</FormLabel><FormControl><Input placeholder="Site, Indicação" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                  <SelectItem value="Contato">Em Contato</SelectItem>
                  <SelectItem value="Proposta">Proposta Enviada</SelectItem>
                  <SelectItem value="Ganho">Ganho</SelectItem>
                  <SelectItem value="Perdido">Perdido</SelectItem>
                </SelectContent></Select><FormMessage /></FormItem>
              )}/>
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Adicione uma observação sobre o lead..." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Lead'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}