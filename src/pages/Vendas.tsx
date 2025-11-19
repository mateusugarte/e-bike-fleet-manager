import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Vendas() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Vendas</h1>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Construction className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Funcionalidade em desenvolvimento</h3>
            <p className="text-muted-foreground">
              Aguardando configurações adicionais para implementar o módulo de vendas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
