// app/page.tsx
'use client'
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RocketIcon } from 'lucide-react';

export default function HomePage() {
  return (
    // Container principal que centraliza tudo na tela
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-4">
      
      <div className="text-center max-w-2xl">
        
        {/* Ícone e Título Principal */}
        <div className="flex justify-center items-center mb-4">
          <RocketIcon className="h-10 w-10 mr-3 text-blue-600" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Bem-vindo ao seu CRM
          </h1>
        </div>

        {/* Subtítulo Descritivo */}
        <p className="text-lg text-slate-600 mb-8">
          Gerencie seus leads, organize seu pipeline de vendas e feche mais negócios. Tudo em um só lugar, de forma simples e eficiente.
        </p>

        {/* Botões de Ação */}
        <div className="flex justify-center items-center gap-4">
          <Link href="/login" passHref>
            <Button size="lg">Entrar na minha conta</Button>
          </Link>
          <Link href="/signup" passHref>
            <Button size="lg" variant="outline">
              Criar uma nova conta
            </Button>
          </Link>
        </div>

      </div>

    </main>
  );
}