import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Se o usuário NÃO está logado e tenta acessar rotas protegidas
  if (!session && pathname.startsWith('/dashboard')) {
    // Redireciona para a página de login
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Se o usuário ESTÁ logado e tenta acessar as páginas de autenticação ou a inicial
  if (session && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    // Redireciona para o dashboard
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return res;
}

// Configuração para definir quais rotas o middleware deve "observar"
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas, exceto as de arquivos estáticos.
     * Isso garante que o middleware rode em todas as navegações de página.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};