import { z } from "zod";
import {
  CreditUsageRequest,
  CreditEarnRequest,
  CreditReservationRequest,
  CreditConfirmationRequest,
  CreditRefundRequest,
  ReservationStatus,
  TransactionType
} from "../interfaces/credits.interface";

/**
 * Schemas de validação para operações de crédito
 * Garante que os dados de entrada estejam corretos e seguros
 */

// Schema base para userId
const userIdSchema = z.string().uuid("ID do usuário deve ser um UUID válido");

// Schema para modelId
const modelIdSchema = z.string().min(1, "ID do modelo é obrigatório").max(50, "ID do modelo muito longo");

// Schema para amounts (valores positivos)
const positiveAmountSchema = z.number().int().positive("Valor deve ser um número inteiro positivo");

// Schema para descrições
const descriptionSchema = z.string().min(1, "Descrição é obrigatória").max(500, "Descrição muito longa");
const optionalDescriptionSchema = z.string().max(500, "Descrição muito longa").optional();

// Schema para reservationId
const reservationIdSchema = z.string().uuid("ID da reserva deve ser um UUID válido");

// Schema para imageId
const imageIdSchema = z.string().uuid("ID da imagem deve ser um UUID válido").optional();

/**
 * Schema para requisição de reserva de créditos
 */
export const creditReservationRequestSchema = z.object({
  userId: userIdSchema,
  modelId: modelIdSchema,
  description: optionalDescriptionSchema
}) satisfies z.ZodType<CreditReservationRequest>;

/**
 * Schema para requisição de confirmação de créditos
 */
export const creditConfirmationRequestSchema = z.object({
  userId: userIdSchema,
  reservationId: reservationIdSchema,
  modelId: modelIdSchema,
  imageId: imageIdSchema,
  description: optionalDescriptionSchema
}) satisfies z.ZodType<CreditConfirmationRequest>;

/**
 * Schema para requisição de reembolso de créditos
 */
export const creditRefundRequestSchema = z.object({
  userId: userIdSchema,
  amount: positiveAmountSchema,
  description: descriptionSchema,
  relatedImageId: imageIdSchema,
  originalTransactionId: z.string().uuid().optional(),
  reservationId: reservationIdSchema.optional()
}) satisfies z.ZodType<CreditRefundRequest>;

/**
 * Schema para requisição de uso de créditos (legado)
 */
export const creditUsageRequestSchema = z.object({
  userId: userIdSchema,
  modelId: modelIdSchema,
  imageId: imageIdSchema,
  description: optionalDescriptionSchema
}) satisfies z.ZodType<CreditUsageRequest>;

/**
 * Schema para requisição de ganho de créditos
 */
export const creditEarnRequestSchema = z.object({
  userId: userIdSchema,
  amount: positiveAmountSchema,
  description: descriptionSchema,
  type: z.enum(['earned', 'bonus', 'refund'], {
    message: "Tipo deve ser 'earned', 'bonus' ou 'refund'"
  }),
  relatedImageId: imageIdSchema
}) satisfies z.ZodType<CreditEarnRequest>;

/**
 * Schema para status de reserva
 */
export const reservationStatusSchema = z.nativeEnum(ReservationStatus);

/**
 * Schema para tipo de transação
 */
export const transactionTypeSchema = z.nativeEnum(TransactionType);

/**
 * Classe utilitária para validação de créditos
 */
export class CreditsValidation {
  /**
   * Valida uma requisição de reserva de créditos
   */
  static validateReservationRequest(data: unknown): CreditReservationRequest {
    try {
      return creditReservationRequestSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Dados de reserva inválidos: ${messages}`);
      }
      throw new Error('Erro de validação desconhecido');
    }
  }

  /**
   * Valida uma requisição de confirmação de créditos
   */
  static validateConfirmationRequest(data: unknown): CreditConfirmationRequest {
    try {
      return creditConfirmationRequestSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Dados de confirmação inválidos: ${messages}`);
      }
      throw new Error('Erro de validação desconhecido');
    }
  }

  /**
   * Valida uma requisição de reembolso de créditos
   */
  static validateRefundRequest(data: unknown): CreditRefundRequest {
    try {
      return creditRefundRequestSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Dados de reembolso inválidos: ${messages}`);
      }
      throw new Error('Erro de validação desconhecido');
    }
  }

  /**
   * Valida uma requisição de uso de créditos (legado)
   */
  static validateUsageRequest(data: unknown): CreditUsageRequest {
    try {
      return creditUsageRequestSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Dados de uso inválidos: ${messages}`);
      }
      throw new Error('Erro de validação desconhecido');
    }
  }

  /**
   * Valida uma requisição de ganho de créditos
   */
  static validateEarnRequest(data: unknown): CreditEarnRequest {
    try {
      return creditEarnRequestSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Dados de ganho inválidos: ${messages}`);
      }
      throw new Error('Erro de validação desconhecido');
    }
  }

  /**
   * Valida um status de reserva
   */
  static validateReservationStatus(status: unknown): ReservationStatus {
    try {
      return reservationStatusSchema.parse(status);
    } catch (error) {
      throw new Error(`Status de reserva inválido: ${status}`);
    }
  }

  /**
   * Valida um tipo de transação
   */
  static validateTransactionType(type: unknown): TransactionType {
    try {
      return transactionTypeSchema.parse(type);
    } catch (error) {
      throw new Error(`Tipo de transação inválido: ${type}`);
    }
  }

  /**
   * Valida se um valor é um UUID válido
   */
  static validateUUID(value: unknown, fieldName: string = "campo"): string {
    try {
      return z.string().uuid().parse(value);
    } catch (error) {
      throw new Error(`${fieldName} deve ser um UUID válido`);
    }
  }

  /**
   * Valida se um valor é um número positivo
   */
  static validatePositiveAmount(value: unknown, fieldName: string = "valor"): number {
    try {
      return positiveAmountSchema.parse(value);
    } catch (error) {
      throw new Error(`${fieldName} deve ser um número inteiro positivo`);
    }
  }

  /**
   * Valida se uma string não está vazia e não excede o limite
   */
  static validateNonEmptyString(value: unknown, fieldName: string = "campo", maxLength: number = 500): string {
    try {
      return z.string().min(1, `${fieldName} é obrigatório`).max(maxLength, `${fieldName} muito longo`).parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(error.issues[0].message);
      }
      throw new Error(`${fieldName} inválido`);
    }
  }
}

/**
 * Tipos de erro específicos para o sistema de créditos
 */
export class CreditValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'CreditValidationError';
  }
}

export class CreditInsufficientError extends Error {
  constructor(required: number, available: number) {
    super(`Créditos insuficientes. Necessário: ${required}, Disponível: ${available}`);
    this.name = 'CreditInsufficientError';
  }
}

export class CreditReservationError extends Error {
  constructor(message: string, public reservationId?: string) {
    super(message);
    this.name = 'CreditReservationError';
  }
}