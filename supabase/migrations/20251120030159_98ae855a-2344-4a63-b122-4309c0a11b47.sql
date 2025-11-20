-- Adicionar colunas de auditoria nas tabelas existentes
ALTER TABLE "Catálogo_bikes" 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE "Gestao de contatos" 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Criar trigger para atualizar updated_at automaticamente em Catálogo_bikes
CREATE OR REPLACE TRIGGER update_catalogo_bikes_updated_at
BEFORE UPDATE ON "Catálogo_bikes"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Criar trigger para atualizar updated_at automaticamente em Gestao de contatos
CREATE OR REPLACE TRIGGER update_gestao_contatos_updated_at
BEFORE UPDATE ON "Gestao de contatos"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Melhorar políticas RLS para Catálogo_bikes
DROP POLICY IF EXISTS "Authenticated users can delete bikes" ON "Catálogo_bikes";
DROP POLICY IF EXISTS "Authenticated users can insert bikes" ON "Catálogo_bikes";
DROP POLICY IF EXISTS "Authenticated users can update bikes" ON "Catálogo_bikes";
DROP POLICY IF EXISTS "Authenticated users can view bikes" ON "Catálogo_bikes";
DROP POLICY IF EXISTS "Public can view available bikes" ON "Catálogo_bikes";

-- Políticas mais específicas para Catálogo_bikes
CREATE POLICY "Usuários autenticados podem visualizar todos os bikes"
ON "Catálogo_bikes"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem inserir bikes"
ON "Catálogo_bikes"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar bikes"
ON "Catálogo_bikes"
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar bikes"
ON "Catálogo_bikes"
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Público pode visualizar bikes disponíveis"
ON "Catálogo_bikes"
FOR SELECT
TO anon
USING (status = 'Disponível');

-- Melhorar políticas RLS para Gestao de contatos
DROP POLICY IF EXISTS "Authenticated users can delete contacts" ON "Gestao de contatos";
DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON "Gestao de contatos";
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON "Gestao de contatos";
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON "Gestao de contatos";

CREATE POLICY "Usuários autenticados podem visualizar contatos"
ON "Gestao de contatos"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem inserir contatos"
ON "Gestao de contatos"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar contatos"
ON "Gestao de contatos"
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar contatos"
ON "Gestao de contatos"
FOR DELETE
TO authenticated
USING (true);

-- Garantir que o bucket IMAGENS está configurado corretamente
UPDATE storage.buckets 
SET public = true 
WHERE id = 'IMAGENS';

-- Políticas de storage para o bucket IMAGENS
DROP POLICY IF EXISTS "Público pode visualizar imagens" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar imagens" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar imagens" ON storage.objects;

CREATE POLICY "Público pode visualizar imagens"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'IMAGENS');

CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'IMAGENS');

CREATE POLICY "Usuários autenticados podem atualizar imagens"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'IMAGENS');

CREATE POLICY "Usuários autenticados podem deletar imagens"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'IMAGENS');