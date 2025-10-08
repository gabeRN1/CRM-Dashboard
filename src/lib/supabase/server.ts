import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// MUDANÇA 1: A função agora é 'async' para permitir o uso de 'await'
export async function createClient() {
  // Pega o armazém de cookies da requisição atual
  // MUDANÇA 2: Usamos 'await' para esperar a Promise dos cookies resolver
  const cookieStore = await cookies();

  // O resto do código permanece o mesmo
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Acontece em Server Actions, pode ser ignorado
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Acontece em Server Actions, pode ser ignorado
          }
        },
      },
    }
  );
}