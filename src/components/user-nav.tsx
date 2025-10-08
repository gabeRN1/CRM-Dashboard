// components/user-nav.tsx
'use client'; // Componente de cliente para interatividade (abrir menu, logout)

import { createClient } from '@/lib/supabase/client'; // Cliente do navegador
import { useRouter } from 'next/navigation';

// Componentes UI
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tipagem das propriedades que o componente recebe
interface UserNavProps {
  userEmail: string | undefined;
}

export function UserNav({ userEmail }: UserNavProps) {
  const router = useRouter();
  const supabase = createClient();

  // Função para fazer logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); // Atualiza a página. O middleware cuidará do redirecionamento.
  };

  // Função simples para pegar as iniciais do e-mail
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{userEmail ? getInitials(userEmail) : '?'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Logado como</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* Futuramente, pode adicionar um link para a página de perfil aqui */}
          <DropdownMenuItem disabled> 
            Perfil
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}