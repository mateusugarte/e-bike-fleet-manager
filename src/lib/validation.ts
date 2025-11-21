import { z } from 'zod';

// Validação de CPF
export const validarCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
};

// Validação de telefone brasileiro
export const validarTelefone = (telefone: string): boolean => {
  const cleaned = telefone.replace(/[^\d]/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
};

// Schema para contatos do CRM
export const contatoSchema = z.object({
  Name_Contact: z.string().min(1, "Nome é obrigatório").max(100),
  phone: z.string().refine(validarTelefone, {
    message: "Telefone inválido. Use formato (00) 00000-0000",
  }),
  nome_completo: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres").max(200).optional().or(z.literal('')),
  cpf: z.string().refine(
    (cpf) => !cpf || cpf === '' || validarCPF(cpf),
    { message: "CPF inválido" }
  ).optional().or(z.literal('')),
  data_nascimento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data deve estar no formato DD/MM/AAAA").optional().or(z.literal('')),
  renda_mensal: z.string().optional().or(z.literal('')),
  profissão: z.string().max(100).optional().or(z.literal('')),
  estado_civil: z.enum(['Solteiro', 'Casado', 'Divorciado', 'Viúvo', '']).optional(),
});

// Schema para vendas
export const vendaSchema = z.object({
  cliente_nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(200),
  cliente_telefone: z.string().refine(validarTelefone, {
    message: "Telefone inválido",
  }),
  bike_id: z.string().uuid("Selecione uma bike válida"),
  bike_modelo: z.string().min(1, "Modelo é obrigatório"),
  financiado: z.boolean(),
  valor_entrada: z.string().optional(),
  valor_final: z.string().min(1, "Valor final é obrigatório"),
});

// Schema para bikes
export const bikeSchema = z.object({
  modelo: z.string().min(3, "Modelo deve ter pelo menos 3 caracteres").max(200),
  valor: z.string().min(1, "Valor é obrigatório"),
  autonomia: z.string().min(1, "Autonomia é obrigatória").max(50),
  aguenta: z.string().min(1, "Capacidade é obrigatória").max(50),
  Bateria: z.string().max(100).optional().or(z.literal('')),
  precisa_CNH: z.enum(['sim', 'não']),
  obs: z.string().max(1000).optional().or(z.literal('')),
  foto_1: z.string().url("URL inválida").optional().or(z.literal('')),
  foto_2: z.string().url("URL inválida").optional().or(z.literal('')),
  foto_3: z.string().url("URL inválida").optional().or(z.literal('')),
  vídeo: z.string().url("URL inválida").optional().or(z.literal('')),
  status: z.string().min(1, "Status é obrigatório"),
});

// Formatar CPF
export const formatarCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/[^\d]/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Formatar telefone
export const formatarTelefone = (telefone: string): string => {
  const cleaned = telefone.replace(/[^\d]/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return telefone;
};

// Sanitizar input (prevenir XSS)
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .trim();
};
