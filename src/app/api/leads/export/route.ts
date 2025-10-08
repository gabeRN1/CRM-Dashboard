// app/api/leads/export/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
    }

    const { data: leads, error } = await supabase
      .from('leads')
      .select('name, email, phone, company, status, source, notes, created_at');

    if (error) { throw error; }

    const csv = Papa.unparse(leads || []);
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="leads_${new Date().toISOString().split('T')[0]}.csv"`);

    return new NextResponse(csv, { status: 200, headers });

  } catch (e) { // CORREÇÃO: Removemos o ': any'
    // CORREÇÃO: Verificamos o tipo do erro antes de usá-lo
    if (e instanceof Error) {
      return new NextResponse(JSON.stringify({ error: e.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ error: 'Um erro desconhecido ocorreu' }), { status: 500 });
  }
}