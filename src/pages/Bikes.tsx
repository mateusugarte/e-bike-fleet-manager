import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Filter, Edit, Trash2, Link as LinkIcon } from 'lucide-react';

interface Bike {
  id: string;
  modelo: string;
  valor: string | null;
  autonomia: string | null;
  aguenta: string | null;
  precisa_CNH: string | null;
  obs: string | null;
  foto_1: string | null;
  foto_2: string | null;
  foto_3: string | null;
  vídeo: string | null;
  status: string | null;
}

export default function Bikes() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [filteredBikes, setFilteredBikes] = useState<Bike[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    modelo: '',
    valor: '',
    autonomia: '',
    aguenta: '',
    precisa_CNH: 'não',
    obs: '',
    foto_1: '',
    status: 'Disponível',
  });

  useEffect(() => {
    fetchBikes();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredBikes(bikes);
    } else if (statusFilter === 'disponivel') {
      // Aceita variações de "Disponível"
      setFilteredBikes(bikes.filter(b => 
        b.status?.toLowerCase().includes('dispon') || 
        b.status?.toLowerCase() === 'disponível' ||
        b.status?.toLowerCase() === 'dísponivel'
      ));
    } else {
      setFilteredBikes(bikes.filter(b => b.status === statusFilter));
    }
  }, [bikes, statusFilter]);

  const fetchBikes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Catálogo_bikes')
      .select('*')
      .order('modelo', { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar bikes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setBikes(data || []);
    }
    setLoading(false);
  };

  const handleAddBike = async () => {
    if (!formData.modelo || !formData.valor || !formData.autonomia || !formData.aguenta) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('Catálogo_bikes')
      .insert([formData]);

    if (error) {
      toast({
        title: "Erro ao adicionar bike",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bike adicionada",
        description: "A bike foi adicionada com sucesso.",
      });
      setIsAddMode(false);
      setFormData({
        modelo: '',
        valor: '',
        autonomia: '',
        aguenta: '',
        precisa_CNH: 'não',
        obs: '',
        foto_1: '',
        status: 'Disponível',
      });
      fetchBikes();
    }
  };

  const handleUpdateBike = async () => {
    if (!selectedBike) return;

    const { error } = await supabase
      .from('Catálogo_bikes')
      .update(formData)
      .eq('id', selectedBike.id);

    if (error) {
      toast({
        title: "Erro ao atualizar bike",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bike atualizada",
        description: "As informações foram atualizadas com sucesso.",
      });
      setIsEditMode(false);
      setSelectedBike(null);
      fetchBikes();
    }
  };

  const handleDeleteBike = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta bike?')) return;

    const { error } = await supabase
      .from('Catálogo_bikes')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao excluir bike",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bike excluída",
        description: "A bike foi removida com sucesso.",
      });
      setSelectedBike(null);
      fetchBikes();
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return 'Consultar';
    
    // Se já está formatado (contém vírgula ou ponto como separador decimal), retorna como está
    if (value.includes(',') || value.includes('R$')) {
      return value.includes('R$') ? value : `R$ ${value}`;
    }
    
    // Caso contrário, tenta converter
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const copyPublicUrl = () => {
    const url = `${window.location.origin}/catalogo`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado",
      description: "O link do catálogo público foi copiado.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Gestão de Bikes</h1>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyPublicUrl}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Gerar Catálogo
          </Button>
          <Button onClick={() => setIsAddMode(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Bike
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="Vendida">Vendida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bikes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBikes.map((bike) => (
          <Card
            key={bike.id}
            className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
            onClick={() => {
              setSelectedBike(bike);
              setIsEditMode(false);
            }}
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
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-lg line-clamp-2">{bike.modelo}</h3>
                <Badge 
                  variant={
                    bike.status?.toLowerCase().includes('dispon') || 
                    bike.status?.toLowerCase() === 'disponível' 
                      ? 'default' 
                      : 'secondary'
                  }
                  className="shrink-0"
                >
                  {bike.status?.toLowerCase().includes('dispon') ? 'Disponível' : bike.status}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(bike.valor)}
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>🔋 Autonomia: {bike.autonomia || 'N/A'}</p>
                <p>⚖️ Capacidade: {bike.aguenta || 'N/A'}</p>
                <p>🪪 CNH: {bike.precisa_CNH || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddMode || isEditMode} onOpenChange={(open) => {
        if (!open) {
          setIsAddMode(false);
          setIsEditMode(false);
          setFormData({
            modelo: '',
            valor: '',
            autonomia: '',
            aguenta: '',
            precisa_CNH: 'não',
            obs: '',
            foto_1: '',
            status: 'Disponível',
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddMode ? 'Adicionar Nova Bike' : 'Editar Bike'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Input
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  placeholder="Ex: E-Bike City 2000W"
                />
              </div>

              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="Ex: 5000"
                />
              </div>

              <div className="space-y-2">
                <Label>Autonomia *</Label>
                <Input
                  value={formData.autonomia}
                  onChange={(e) => setFormData({ ...formData, autonomia: e.target.value })}
                  placeholder="Ex: 80km"
                />
              </div>

              <div className="space-y-2">
                <Label>Capacidade *</Label>
                <Input
                  value={formData.aguenta}
                  onChange={(e) => setFormData({ ...formData, aguenta: e.target.value })}
                  placeholder="Ex: 150kg"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Vendida">Vendida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="precisa_CNH"
                  checked={formData.precisa_CNH === 'sim'}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, precisa_CNH: checked ? 'sim' : 'não' })
                  }
                />
                <Label htmlFor="precisa_CNH">Precisa CNH</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL da Foto</Label>
              <Input
                value={formData.foto_1}
                onChange={(e) => setFormData({ ...formData, foto_1: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.obs}
                onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddMode(false);
                  setIsEditMode(false);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={isAddMode ? handleAddBike : handleUpdateBike}>
                {isAddMode ? 'Adicionar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!selectedBike && !isEditMode} onOpenChange={() => setSelectedBike(null)}>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Modelo</Label>
                  <p className="text-sm mt-1">{selectedBike.modelo}</p>
                </div>
                <div>
                  <Label>Valor</Label>
                  <p className="text-sm mt-1">{formatCurrency(selectedBike.valor)}</p>
                </div>
                <div>
                  <Label>Autonomia</Label>
                  <p className="text-sm mt-1">{selectedBike.autonomia}</p>
                </div>
                <div>
                  <Label>Capacidade</Label>
                  <p className="text-sm mt-1">{selectedBike.aguenta}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className="mt-1" variant={selectedBike.status === 'Disponível' ? 'default' : 'secondary'}>
                    {selectedBike.status}
                  </Badge>
                </div>
                <div>
                  <Label>Precisa CNH</Label>
                  <p className="text-sm mt-1">{selectedBike.precisa_CNH}</p>
                </div>
              </div>

              {selectedBike.obs && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedBike.obs}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDeleteBike(selectedBike.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
                <Button onClick={() => {
                  setFormData({
                    modelo: selectedBike.modelo,
                    valor: selectedBike.valor || '',
                    autonomia: selectedBike.autonomia || '',
                    aguenta: selectedBike.aguenta || '',
                    precisa_CNH: selectedBike.precisa_CNH || 'não',
                    obs: selectedBike.obs || '',
                    foto_1: selectedBike.foto_1 || '',
                    status: selectedBike.status || 'Disponível',
                  });
                  setIsEditMode(true);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
