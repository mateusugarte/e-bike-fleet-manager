-- ========================================
-- CORREÇÃO DE WARNINGS DE SEGURANÇA
-- ========================================

-- Corrigir funções antigas sem search_path definido
-- Todas as funções relacionadas a vector já têm search_path correto

-- Verificar e corrigir a função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public;

-- Verificar e corrigir a função update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;

-- Verificar e corrigir a função handle_new_user_role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public;

-- Verificar e corrigir a função match_documents
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector, 
  match_count integer DEFAULT NULL, 
  filter jsonb DEFAULT '{}'
)
RETURNS TABLE(
  id bigint, 
  content text, 
  metadata jsonb, 
  similarity double precision
)
LANGUAGE plpgsql
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  FROM documents
  WHERE metadata @> filter
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;