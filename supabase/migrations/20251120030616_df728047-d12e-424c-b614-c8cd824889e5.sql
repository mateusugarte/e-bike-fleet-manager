-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política para admins verem todos os roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Política para admins gerenciarem roles
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Criar função security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para automaticamente criar admin para o primeiro usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Contar usuários existentes
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Se for o primeiro usuário, torná-lo admin
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Caso contrário, role padrão é 'user'
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para auto-atribuição de role
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();

-- Adicionar colunas de auditoria na tabela Catálogo_bikes
ALTER TABLE public."Catálogo_bikes"
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Adicionar colunas de auditoria na tabela Gestao de contatos
ALTER TABLE public."Gestao de contatos"
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Remover políticas antigas do Catálogo_bikes
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar bikes" ON public."Catálogo_bikes";
DROP POLICY IF EXISTS "Usuários autenticados podem deletar bikes" ON public."Catálogo_bikes";
DROP POLICY IF EXISTS "Usuários autenticados podem inserir bikes" ON public."Catálogo_bikes";
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar todos os bikes" ON public."Catálogo_bikes";

-- Novas políticas para Catálogo_bikes
CREATE POLICY "Admins podem visualizar todas as bikes"
ON public."Catálogo_bikes"
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem inserir bikes"
ON public."Catálogo_bikes"
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar bikes"
ON public."Catálogo_bikes"
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar bikes"
ON public."Catálogo_bikes"
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Remover políticas antigas de Gestao de contatos
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar contatos" ON public."Gestao de contatos";
DROP POLICY IF EXISTS "Usuários autenticados podem deletar contatos" ON public."Gestao de contatos";
DROP POLICY IF EXISTS "Usuários autenticados podem inserir contatos" ON public."Gestao de contatos";
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar contatos" ON public."Gestao de contatos";

-- Novas políticas para Gestao de contatos
CREATE POLICY "Admins podem visualizar todos os contatos"
ON public."Gestao de contatos"
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem inserir contatos"
ON public."Gestao de contatos"
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar contatos"
ON public."Gestao de contatos"
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar contatos"
ON public."Gestao de contatos"
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Função para atribuir role admin a usuários existentes (executar manualmente se necessário)
CREATE OR REPLACE FUNCTION public.assign_admin_role(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Encontrar o usuário pelo email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  -- Inserir role admin (ou atualizar se já existir)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;