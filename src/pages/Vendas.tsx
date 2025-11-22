import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Plus, Calendar, TrendingUp, Filter, CheckCircle2, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Bike {
  id: string;
  modelo: string;
  valor: string | null;
  foto_1: string | null;
  autonomia: string | null;
  aguenta: string | null;
}

interface Venda {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  bike_id: string;
  bike_modelo: string;
  financiado: boolean;
  valor_entrada: string | null;
  valor_final: string;
  data_venda: string;
  created_at: string;
}

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBikeSelectOpen, setIsBikeSelectOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    cliente_nome: '',
    cliente_telefone: '',
    financiado: false,
    valor_entrada: '',
    valor_final: '',
  });

  useEffect(() => {
    fetchVendas();
    fetchBikes();
  }, []);

  const fetchVendas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendas(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as vendas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBikes = async () => {
    try {
      const { data, error } = await supabase
        .from('Catálogo_bikes')
        .select('id, modelo, valor, foto_1, autonomia, aguenta')
        .eq('status', 'Disponível')
        .order('modelo');

      if (error) throw error;
      setBikes(data || []);
    } catch (error) {
      console.error('Erro ao carregar bikes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBike) {
      toast({
        title: 'Erro',
        description: 'Selecione uma bike',
        variant: 'destructive',
      });
      return;
    }

    if (formData.financiado && !formData.valor_entrada) {
      toast({
        title: 'Erro',
        description: 'Informe o valor de entrada para vendas financiadas',
        variant: 'destructive',
      });
      return;
    }

    try {
      const today = new Date();
      const dataVenda = format(today, 'dd-MM-yyyy');

      // Limpar valores removendo pontos e substituindo vírgula por ponto
      const valorFinalLimpo = formData.valor_final.replace(/\./g, '').replace(',', '.');
      const valorEntradaLimpo = formData.valor_entrada ? formData.valor_entrada.replace(/\./g, '').replace(',', '.') : null;

      const { error } = await supabase.from('vendas').insert({
        cliente_nome: formData.cliente_nome,
        cliente_telefone: formData.cliente_telefone,
        bike_id: selectedBike.id,
        bike_modelo: selectedBike.modelo,
        financiado: formData.financiado,
        valor_entrada: valorEntradaLimpo,
        valor_final: valorFinalLimpo,
        data_venda: dataVenda,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Venda registrada com sucesso',
      });

      setIsDialogOpen(false);
      resetForm();
      fetchVendas();
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a venda',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_nome: '',
      cliente_telefone: '',
      financiado: false,
      valor_entrada: '',
      valor_final: '',
    });
    setSelectedBike(null);
  };

  const parseDate = (dateString: string): Date | null => {
    try {
      if (dateString.includes('-') && dateString.length === 10) {
        const [day, month, year] = dateString.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      return new Date(dateString);
    } catch {
      return null;
    }
  };

  const filterVendas = () => {
    if (!startDate || !endDate) return vendas;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);

    return vendas.filter((venda) => {
      const vendaDate = parseDate(venda.data_venda);
      if (!vendaDate) return false;
      return vendaDate >= start && vendaDate <= end;
    });
  };

  const calculateStats = () => {
    const filtered = filterVendas();
    const total = filtered.length;
    
    const totalRevenue = filtered.reduce((acc, venda) => {
      const valor = parseFloat(venda.valor_final) || 0;
      return acc + valor;
    }, 0);
    
    const ticketMedio = total > 0 ? totalRevenue / total : 0;
    const financiadas = filtered.filter(v => v.financiado).length;
    const percentualFinanciado = total > 0 ? (financiadas / total) * 100 : 0;

    return { total, totalRevenue, ticketMedio, percentualFinanciado };
  };

  const stats = calculateStats();
  const filteredVendas = filterVendas();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Gestão de Vendas</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nova Venda</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cliente_nome">Nome do Cliente</Label>
                  <Input
                    id="cliente_nome"
                    value={formData.cliente_nome}
                    onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cliente_telefone">Telefone</Label>
                  <Input
                    id="cliente_telefone"
                    value={formData.cliente_telefone}
                    onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                <div>
                  <Label>Modelo da Bike</Label>
                  {selectedBike ? (
                    <Card className="mt-2 border-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {selectedBike.foto_1 && (
                            <img 
                              src={selectedBike.foto_1} 
                              alt={selectedBike.modelo}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold">{selectedBike.modelo}</h3>
                            <p className="text-sm text-muted-foreground">
                              {selectedBike.valor && `R$ ${selectedBike.valor}`}
                            </p>
                            {selectedBike.autonomia && (
                              <p className="text-xs text-muted-foreground">
                                Autonomia: {selectedBike.autonomia}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBike(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => setIsBikeSelectOpen(true)}
                    >
                      Selecionar Bike
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <Label htmlFor="financiado">Venda Financiada?</Label>
                  <Switch
                    id="financiado"
                    checked={formData.financiado}
                    onCheckedChange={(checked) => setFormData({ ...formData, financiado: checked })}
                  />
                </div>

                {formData.financiado && (
                  <div>
                    <Label htmlFor="valor_entrada">Valor de Entrada</Label>
                    <Input
                      id="valor_entrada"
                      value={formData.valor_entrada}
                      onChange={(e) => setFormData({ ...formData, valor_entrada: e.target.value })}
                      placeholder="Ex: 2000,00"
                      required={formData.financiado}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="valor_final">Valor Final da Venda</Label>
                  <Input
                    id="valor_final"
                    value={formData.valor_final}
                    onChange={(e) => setFormData({ ...formData, valor_final: e.target.value })}
                    placeholder="Ex: 8500,00"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Registrar Venda
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isBikeSelectOpen} onOpenChange={setIsBikeSelectOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Selecionar Bike</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 overflow-y-auto max-h-[70vh] p-2">
              {bikes.map((bike) => (
                <Card 
                  key={bike.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    setSelectedBike(bike);
                    setIsBikeSelectOpen(false);
                    if (bike.valor) {
                      setFormData({ ...formData, valor_final: bike.valor });
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {bike.foto_1 && (
                        <img 
                          src={bike.foto_1} 
                          alt={bike.modelo}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{bike.modelo}</h3>
                        {bike.valor && (
                          <p className="text-primary font-medium">R$ {bike.valor}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          {bike.autonomia && <span>Autonomia: {bike.autonomia}</span>}
                          {bike.aguenta && <span>Carga: {bike.aguenta}</span>}
                        </div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-chart-1/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-1">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        <Card className="border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma das vendas
            </p>
          </CardContent>
        </Card>

        <Card className="border-chart-3/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Calendar className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-3">
              R$ {stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por venda
            </p>
          </CardContent>
        </Card>

        <Card className="border-chart-4/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financiadas</CardTitle>
            <Filter className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-4">
              {stats.percentualFinanciado.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Do total de vendas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Vendas</span>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredVendas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma venda registrada no período selecionado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendas.map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell>{venda.data_venda}</TableCell>
                      <TableCell className="font-medium">{venda.cliente_nome}</TableCell>
                      <TableCell>{venda.cliente_telefone}</TableCell>
                      <TableCell>{venda.bike_modelo}</TableCell>
                      <TableCell>
                        {venda.financiado ? (
                          <span className="text-chart-4">Financiado</span>
                        ) : (
                          <span className="text-success">À vista</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {parseFloat(venda.valor_final).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
