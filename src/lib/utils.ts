import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Valida e ajusta dimensões conforme restrições da BFL API
 * - Máximo 1440px
 * - Deve ser divisível por 32
 * - Mínimo 32px
 */
export function validateBFLDimensions(width: number, height: number): { width: number; height: number } {
  const maxDimension = 1440;
  
  // Limitar ao máximo permitido
  let validWidth = Math.min(width, maxDimension);
  let validHeight = Math.min(height, maxDimension);
  
  // Garantir que seja divisível por 32
  validWidth = Math.floor(validWidth / 32) * 32;
  validHeight = Math.floor(validHeight / 32) * 32;
  
  // Garantir dimensões mínimas (pelo menos 32px)
  validWidth = Math.max(validWidth, 32);
  validHeight = Math.max(validHeight, 32);
  
  return { width: validWidth, height: validHeight };
}
