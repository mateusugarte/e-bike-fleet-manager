import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Phone, User, Calendar } from 'lucide-react';

interface Contact {
  id: string;
  phone: string;
  criado_em: string;
  Name_Contact: string | null;
  pausar_ia: string | null;
  intenção: string | null;
  modelo_interesse: string | null;
  resumo: string | null;
}

const columns = [
  { id: 'Contato Inicial', title: 'Contato Inicial', color: 'bg-slate-500' },
  { id: 'Envio do Catálogo', title: 'Envio do Catálogo', color: 'bg-blue-500' },
  { id: 'Perguntas', title: 'Perguntas', color: 'bg-amber-500' },
  { id: 'Qualificado', title: 'Qualificado', color: 'bg-success' },
];

export default function CRM() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Gestao de contatos')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar contatos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const updateContactStage = async (contactId: string, newStage: string) => {
    const { error } = await supabase
      .from('Gestao de contatos')
      .update({ intenção: newStage })
      .eq('id', contactId);

    if (error) {
      toast({
        title: "Erro ao atualizar contato",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Contato atualizado",
        description: "O estágio do contato foi alterado com sucesso.",
      });
      fetchContacts();
    }
  };

  const handleUpdateContact = async () => {
    if (!selectedContact) return;

    const { error } = await supabase
      .from('Gestao de contatos')
      .update({
        Name_Contact: selectedContact.Name_Contact,
        phone: selectedContact.phone,
        intenção: selectedContact.intenção,
        modelo_interesse: selectedContact.modelo_interesse,
        resumo: selectedContact.resumo,
        pausar_ia: selectedContact.pausar_ia,
      })
      .eq('id', selectedContact.id);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Salvo com sucesso",
        description: "As informações do contato foram atualizadas.",
      });
      setIsEditMode(false);
      fetchContacts();
    }
  };

  const getContactsByStage = (stage: string) => {
    return contacts.filter(c => c.intenção === stage);
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle dd-mm-yyyy format
      if (dateString.includes('-') && dateString.length === 10) {
        const [day, month, year] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CRM Kanban</h1>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {columns.map((column) => {
          const count = getContactsByStage(column.id).length;
          return (
            <Card key={column.id}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">{column.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant="secondary" className="ml-auto">
                {getContactsByStage(column.id).length}
              </Badge>
            </div>

            <div className="space-y-2 min-h-[400px]">
              {getContactsByStage(column.id).map((contact) => (
                <Card
                  key={contact.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedContact(contact);
                    setIsEditMode(false);
                  }}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-mono">
                        #{contact.id.substring(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {contact.Name_Contact || 'Sem nome'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(contact.criado_em)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Details Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Contato' : 'Detalhes do Contato'}
            </DialogTitle>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  {isEditMode ? (
                    <Input
                      value={selectedContact.Name_Contact || ''}
                      onChange={(e) => setSelectedContact({
                        ...selectedContact,
                        Name_Contact: e.target.value
                      })}
                    />
                  ) : (
                    <p className="text-sm">{selectedContact.Name_Contact || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  {isEditMode ? (
                    <Input
                      value={selectedContact.phone}
                      onChange={(e) => setSelectedContact({
                        ...selectedContact,
                        phone: e.target.value
                      })}
                    />
                  ) : (
                    <p className="text-sm">{selectedContact.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Estágio</Label>
                  {isEditMode ? (
                    <Select
                      value={selectedContact.intenção || ''}
                      onValueChange={(value) => setSelectedContact({
                        ...selectedContact,
                        intenção: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{selectedContact.intenção || 'Não definido'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Data de Criação</Label>
                  <p className="text-sm">{formatDate(selectedContact.criado_em)}</p>
                </div>

                <div className="space-y-2">
                  <Label>Modelo de Interesse</Label>
                  {isEditMode ? (
                    <Input
                      value={selectedContact.modelo_interesse || ''}
                      onChange={(e) => setSelectedContact({
                        ...selectedContact,
                        modelo_interesse: e.target.value
                      })}
                    />
                  ) : (
                    <p className="text-sm">{selectedContact.modelo_interesse || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Pausar IA</Label>
                  {isEditMode ? (
                    <Select
                      value={selectedContact.pausar_ia || ''}
                      onValueChange={(value) => setSelectedContact({
                        ...selectedContact,
                        pausar_ia: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{selectedContact.pausar_ia || 'Não definido'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Resumo</Label>
                {isEditMode ? (
                  <Textarea
                    value={selectedContact.resumo || ''}
                    onChange={(e) => setSelectedContact({
                      ...selectedContact,
                      resumo: e.target.value
                    })}
                    rows={4}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedContact.resumo || 'Nenhum resumo disponível'}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                {isEditMode ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditMode(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleUpdateContact}>
                      Salvar
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditMode(true)}>
                    Editar
                  </Button>
                )}
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
