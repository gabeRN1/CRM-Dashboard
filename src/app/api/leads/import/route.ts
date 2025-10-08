// app/api/leads/import/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';

// CORREÇÃO: Definimos um tipo para a linha do CSV
type CsvRow = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  source?: string;
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return new NextResponse(JSON.stringify({ error: 'Nenhum arquivo enviado' }), { status: 400 });
    }

    const fileContent = await file.text();
    const parsingResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    const leadsToInsert = (parsingResult.data as CsvRow[]) // CORREÇÃO: Usamos o tipo CsvRow
      .map((row) => ({
        name: row.name,
        email: row.email || null,
        phone: row.phone || null,
        company: row.company || null,
        status: row.status || 'Prospect',
        source: row.source || null,
        notes: row.notes || null,
        user_id: user.id,
      }))
      .filter(lead => lead.name && lead.name.trim() !== '');

    if (leadsToInsert.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Nenhum lead válido encontrado no arquivo' }), { status: 400 });
    }

    const { error: insertError } = await supabase.from('leads').insert(leadsToInsert);
    if (insertError) { throw insertError; }

    return NextResponse.json({
      importedCount: leadsToInsert.length,
      errorCount: parsingResult.data.length - leadsToInsert.length,
      errors: parsingResult.errors,
    }, { status: 200 });

  } catch (e) { // CORREÇÃO: Removemos o ': any'
    if (e instanceof Error) {
      return new NextResponse(JSON.stringify({ error: e.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ error: 'Um erro desconhecido ocorreu' }), { status: 500 });
  }
}