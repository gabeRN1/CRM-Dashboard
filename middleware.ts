// middleware.ts (na raiz do projeto)
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // A função updateSession cuida de atualizar o cookie de sessão do Supabase
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas, exceto as de arquivos estáticos,
     * para que a sessão seja sempre mantida atualizada.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}