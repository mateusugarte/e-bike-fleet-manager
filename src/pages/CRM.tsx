import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, PauseCircle, PlayCircle, Phone, User, FileText, Calendar, Briefcase, DollarSign, Heart, CreditCard } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, DragStartEvent } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface Contact {
  id: string;
  Name_Contact: string | null;
  phone: string;
  intenção: string | null;
  resumo: string | null;
  ultima_mensagem: string | null;
  criado_em: string;
  pausar_ia: string | null;
  modelo_interesse: string | null;
  nome_completo: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  estado_civil: string | null;
  profissão: string | null;
  renda_mensal: string | null;
}

const STAGES = [
  { id: 'Contato Inicial', label: 'Contato Inicial', color: 'bg-chart-1' },
  { id: 'Envio do Catálogo', label: 'Envio do Catálogo', color: 'bg-chart-2' },
  { id: 'Perguntas', label: 'Perguntas', color: 'bg-chart-3' },
  { id: 'Qualificado', label: 'Qualificado', color: 'bg-success' },
];

export default function CRM() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [formData, setFormData] = useState({
    Name_Contact: '',
    phone: '',
    intenção: 'Contato Inicial',
    resumo: '',
    nome_completo: '',
    cpf: '',
    data_nascimento: '',
    estado_civil: '',
    profissão: '',
    renda_mensal: '',
    modelo_interesse: '',
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Gestao de contatos')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os contatos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const today = new Date();
      const criado_em = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

      const { error } = await supabase.from('Gestao de contatos').insert({
        Name_Contact: formData.Name_Contact,
        phone: formData.phone,
        intenção: formData.intenção,
        resumo: formData.resumo,
        criado_em,
        nome_completo: formData.nome_completo || null,
        cpf: formData.cpf || null,
        data_nascimento: formData.data_nascimento || null,
        estado_civil: formData.estado_civil || null,
        profissão: formData.profissão || null,
        renda_mensal: formData.renda_mensal || null,
        modelo_interesse: formData.modelo_interesse || null,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Contato adicionado com sucesso',
      });

      setIsDialogOpen(false);
      resetForm();
      fetchContacts();
    } catch (error) {
      console.error('Erro ao adicionar contato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o contato',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!editingContact) return;

    try {
      const { error } = await supabase
        .from('Gestao de contatos')
        .update({
          Name_Contact: editingContact.Name_Contact,
          phone: editingContact.phone,
          intenção: editingContact.intenção,
          resumo: editingContact.resumo,
          nome_completo: editingContact.nome_completo,
          cpf: editingContact.cpf,
          data_nascimento: editingContact.data_nascimento,
          estado_civil: editingContact.estado_civil,
          profissão: editingContact.profissão,
          renda_mensal: editingContact.renda_mensal,
          modelo_interesse: editingContact.modelo_interesse,
          ultima_mensagem: editingContact.ultima_mensagem,
        })
        .eq('id', editingContact.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Contato atualizado com sucesso',
      });

      setIsEditDialogOpen(false);
      setEditingContact(null);
      fetchContacts();
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o contato',
        variant: 'destructive',
      });
    }
  };

  const togglePausarIA = async (contact: Contact) => {
    try {
      const newValue = contact.pausar_ia === 'Sim' ? null : 'Sim';
      
      const { error } = await supabase
        .from('Gestao de contatos')
        .update({ pausar_ia: newValue })
        .eq('id', contact.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: newValue === 'Sim' ? 'IA pausada para este contato' : 'IA reativada para este contato',
      });

      fetchContacts();
    } catch (error) {
      console.error('Erro ao pausar/retomar IA:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da IA',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      Name_Contact: '',
      phone: '',
      intenção: 'Contato Inicial',
      resumo: '',
      nome_completo: '',
      cpf: '',
      data_nascimento: '',
      estado_civil: '',
      profissão: '',
      renda_mensal: '',
      modelo_interesse: '',
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const contactId = active.id as string;
    const newStage = over.id as string;

    const contact = contacts.find(c => c.id === contactId);
    if (!contact || contact.intenção === newStage) return;

    try {
      const { error } = await supabase
        .from('Gestao de contatos')
        .update({ intenção: newStage })
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Estágio atualizado com sucesso',
      });

      fetchContacts();
    } catch (error) {
      console.error('Erro ao atualizar estágio:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o estágio',
        variant: 'destructive',
      });
    }
  };

  const getContactsByStage = (stage: string) => {
    return contacts.filter(c => c.intenção === stage);
  };

  const activeContact = contacts.find(c => c.id === activeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">CRM - Gestão de Contatos</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Contato</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="Name_Contact">Nome do Contato</Label>
                  <Input
                    id="Name_Contact"
                    value={formData.Name_Contact}
                    onChange={(e) => setFormData({ ...formData, Name_Contact: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="nome_completo">Nome Completo</Label>
                  <Input
                    id="nome_completo"
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    placeholder="DD/MM/AAAA"
                  />
                </div>

                <div>
                  <Label htmlFor="estado_civil">Estado Civil</Label>
                  <Input
                    id="estado_civil"
                    value={formData.estado_civil}
                    onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="profissão">Profissão</Label>
                  <Input
                    id="profissão"
                    value={formData.profissão}
                    onChange={(e) => setFormData({ ...formData, profissão: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="renda_mensal">Renda Mensal</Label>
                  <Input
                    id="renda_mensal"
                    value={formData.renda_mensal}
                    onChange={(e) => setFormData({ ...formData, renda_mensal: e.target.value })}
                    placeholder="R$ 0.000,00"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="modelo_interesse">Modelo de Interesse</Label>
                  <Input
                    id="modelo_interesse"
                    value={formData.modelo_interesse}
                    onChange={(e) => setFormData({ ...formData, modelo_interesse: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="resumo">Resumo</Label>
                  <Textarea
                    id="resumo"
                    value={formData.resumo}
                    onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Adicionar Contato
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-6 md:grid-cols-4">
            {STAGES.map((stage) => (
              <DroppableColumn
                key={stage.id}
                stage={stage}
                contacts={getContactsByStage(stage.id)}
                onEdit={handleEdit}
                onTogglePausar={togglePausarIA}
              />
            ))}
          </div>

          <DragOverlay>
            {activeContact && (
              <ContactCard
                contact={activeContact}
                onEdit={handleEdit}
                onTogglePausar={togglePausarIA}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Nome do Contato</Label>
                  <Input
                    value={editingContact.Name_Contact || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, Name_Contact: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={editingContact.phone}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Nome Completo</Label>
                  <Input
                    value={editingContact.nome_completo || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, nome_completo: e.target.value })}
                  />
                </div>

                <div>
                  <Label>CPF</Label>
                  <Input
                    value={editingContact.cpf || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, cpf: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Data de Nascimento</Label>
                  <Input
                    value={editingContact.data_nascimento || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, data_nascimento: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Estado Civil</Label>
                  <Input
                    value={editingContact.estado_civil || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, estado_civil: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Profissão</Label>
                  <Input
                    value={editingContact.profissão || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, profissão: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Renda Mensal</Label>
                  <Input
                    value={editingContact.renda_mensal || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, renda_mensal: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Modelo de Interesse</Label>
                  <Input
                    value={editingContact.modelo_interesse || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, modelo_interesse: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Resumo</Label>
                  <Textarea
                    value={editingContact.resumo || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, resumo: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Última Mensagem</Label>
                  <Textarea
                    value={editingContact.ultima_mensagem || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, ultima_mensagem: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <Button onClick={handleUpdateContact} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DroppableColumnProps {
  stage: { id: string; label: string; color: string };
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onTogglePausar: (contact: Contact) => void;
}

function DroppableColumn({ stage, contacts, onEdit, onTogglePausar }: DroppableColumnProps) {
  return (
    <div id={stage.id} className="space-y-4">
      <div className={`${stage.color} text-white p-4 rounded-lg`}>
        <h2 className="text-lg font-semibold">{stage.label}</h2>
        <p className="text-sm opacity-90">{contacts.length} contatos</p>
      </div>

      <div className="space-y-3 min-h-[200px]">
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onEdit={onEdit}
            onTogglePausar={onTogglePausar}
          />
        ))}
      </div>
    </div>
  );
}

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onTogglePausar: (contact: Contact) => void;
  isDragging?: boolean;
}

function ContactCard({ contact, onEdit, onTogglePausar, isDragging }: ContactCardProps) {
  const isPaused = contact.pausar_ia === 'Sim';

  return (
    <Card 
      id={contact.id}
      className={`cursor-move hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 rotate-3' : ''}`}
      style={{ touchAction: 'none' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">
              {contact.Name_Contact || contact.nome_completo || 'Sem nome'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span className="truncate">{contact.phone}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(contact);
              }}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePausar(contact);
              }}
              className="h-8 w-8 p-0"
            >
              {isPaused ? (
                <PlayCircle className="h-3 w-3 text-success" />
              ) : (
                <PauseCircle className="h-3 w-3 text-warning" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {contact.modelo_interesse && (
          <div className="flex items-start gap-2">
            <Briefcase className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground break-words">{contact.modelo_interesse}</span>
          </div>
        )}
        
        {contact.nome_completo && (
          <div className="flex items-start gap-2">
            <User className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground break-words">{contact.nome_completo}</span>
          </div>
        )}

        {contact.cpf && (
          <div className="flex items-start gap-2">
            <CreditCard className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{contact.cpf}</span>
          </div>
        )}

        {contact.data_nascimento && (
          <div className="flex items-start gap-2">
            <Calendar className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{contact.data_nascimento}</span>
          </div>
        )}

        {contact.estado_civil && (
          <div className="flex items-start gap-2">
            <Heart className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{contact.estado_civil}</span>
          </div>
        )}

        {contact.profissão && (
          <div className="flex items-start gap-2">
            <Briefcase className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground break-words">{contact.profissão}</span>
          </div>
        )}

        {contact.renda_mensal && (
          <div className="flex items-start gap-2">
            <DollarSign className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{contact.renda_mensal}</span>
          </div>
        )}

        {contact.resumo && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2">
              <FileText className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p className="text-muted-foreground line-clamp-2 break-words">{contact.resumo}</p>
            </div>
          </div>
        )}

        {isPaused && (
          <Badge variant="secondary" className="mt-2">
            IA Pausada
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
