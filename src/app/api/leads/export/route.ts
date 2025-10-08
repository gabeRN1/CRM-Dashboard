// app/api/leads/export/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Nosso cliente de servidor
import Papa from 'papaparse';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Verifique se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
    }

    // 2. Busque todos os leads do usuário logado
    const { data: leads, error } = await supabase
      .from('leads')
      .select('name, email, phone, company, status, source, notes, created_at');
      // A RLS já garante que ele só pegue os leads do user_id correto

    if (error) {
      throw error;
    }

    // 3. Converta os dados de JSON para formato CSV usando Papaparse
    const csv = Papa.unparse(leads || []);

    // 4. Crie a resposta com os headers corretos para forçar o download
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="leads_${new Date().toISOString().split('T')[0]}.csv"`);

    return new NextResponse(csv, { status: 200, headers });

  } catch (e: any) {
    return new NextResponse(JSON.stringify({ error: e.message }), { status: 500 });
  }
}