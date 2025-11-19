import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Bike } from 'lucide-react';

interface BikeData {
  id: string;
  modelo: string;
  valor: string | null;
  autonomia: string | null;
  aguenta: string | null;
  precisa_CNH: string | null;
  obs: string | null;
  foto_1: string | null;
}

export default function Catalogo() {
  const [bikes, setBikes] = useState<BikeData[]>([]);
  const [selectedBike, setSelectedBike] = useState<BikeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBikes();
  }, []);

  const fetchBikes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('Catálogo_bikes')
      .select('*')
      .eq('status', 'Disponível')
      .order('modelo', { ascending: true });

    setBikes(data || []);
    setLoading(false);
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return 'Consultar';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <img 
              src="https://xnujltaointazdntjasj.supabase.co/storage/v1/object/public/IMAGENS/ChatGPT%20Image%2019%20de%20nov.%20de%202025,%2016_15_04.png"
              alt="Ramon Bikes Elétricas"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Ramon Bikes Elétricas
              </h1>
              <p className="text-sm text-muted-foreground">
                Catálogo de Bikes Disponíveis
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Catalog */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : bikes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Bike className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Nenhuma bike disponível</h3>
                <p className="text-muted-foreground">
                  No momento não temos bikes disponíveis em nosso catálogo.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bikes.map((bike) => (
              <Card
                key={bike.id}
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                onClick={() => setSelectedBike(bike)}
              >
                {bike.foto_1 && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={bike.foto_1}
                      alt={bike.modelo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg">{bike.modelo}</h3>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(bike.valor)}
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Autonomia: {bike.autonomia || 'N/A'}</p>
                    <p>Capacidade: {bike.aguenta || 'N/A'}</p>
                  </div>
                  <Badge variant="default" className="mt-2">
                    Disponível
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Bike Details Dialog */}
      <Dialog open={!!selectedBike} onOpenChange={() => setSelectedBike(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Bike</DialogTitle>
          </DialogHeader>

          {selectedBike && (
            <div className="space-y-4">
              {selectedBike.foto_1 && (
                <img
                  src={selectedBike.foto_1}
                  alt={selectedBike.modelo}
                  className="w-full rounded-lg"
                />
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedBike.modelo}</h3>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {formatCurrency(selectedBike.valor)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Autonomia</p>
                    <p className="text-lg font-medium">{selectedBike.autonomia}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacidade</p>
                    <p className="text-lg font-medium">{selectedBike.aguenta}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Precisa CNH</p>
                    <p className="text-lg font-medium">{selectedBike.precisa_CNH}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="default" className="mt-1">
                      Disponível
                    </Badge>
                  </div>
                </div>

                {selectedBike.obs && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Observações</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedBike.obs}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
