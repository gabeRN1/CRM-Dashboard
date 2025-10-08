// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// Defina uma função para criar o cliente
export function createClient() {
  // Crie um cliente Supabase para ser usado no navegador
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}