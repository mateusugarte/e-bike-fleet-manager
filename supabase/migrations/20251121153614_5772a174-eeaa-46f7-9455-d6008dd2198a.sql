-- Criar tabela de vendas
CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  bike_id UUID NOT NULL REFERENCES public."Catálogo_bikes"(id),
  bike_modelo TEXT NOT NULL,
  financiado BOOLEAN NOT NULL DEFAULT false,
  valor_entrada TEXT,
  valor_final TEXT NOT NULL,
  data_venda TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Habilitar RLS
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem visualizar vendas"
  ON public.vendas
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem inserir vendas"
  ON public.vendas
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar vendas"
  ON public.vendas
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar vendas"
  ON public.vendas
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_vendas_updated_at
  BEFORE UPDATE ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();