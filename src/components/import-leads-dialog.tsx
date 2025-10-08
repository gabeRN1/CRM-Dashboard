// components/import-leads-dialog.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from './ui/input';
import { Label } from './ui/label';

export function ImportLeadsDialog() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [open, setOpen] = useState(false);

  // Armazena o arquivo selecionado pelo usuário no estado do componente
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  // Função chamada quando o usuário clica em "Importar"
  const handleImport = async () => {
    if (!file) {
      toast.error("Por favor, selecione um arquivo CSV.");
      return;
    }
    setIsImporting(true);

    // Usa FormData para preparar o arquivo para envio
    const formData = new FormData();
    formData.append('file', file);

    // Envia o arquivo para a nossa API de importação
    const response = await fetch('/api/leads/import', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      toast.success(`${result.importedCount} leads importados com sucesso!`);
      if (result.errorCount > 0) {
        toast.warning(`${result.errorCount} linhas não puderam ser importadas.`);
        console.error("Erros de importação:", result.errors);
      }
      setOpen(false); // Fecha o modal
      router.refresh(); // Atualiza a dashboard para mostrar os novos leads
    } else {
      toast.error("Falha na importação.", { description: result.error });
    }

    setIsImporting(false);
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Importar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Leads de Planilha CSV</DialogTitle>
          <DialogDescription>
            Selecione um arquivo `.csv` com as colunas: `name`, `email`, `phone`, `company`, `status`, `source`, `notes`.
            A coluna `name` é obrigatória.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="csv-file" className="text-right">Arquivo</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}