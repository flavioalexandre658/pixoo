import crypto from "crypto";

// Função para hash SHA256
export async function hashSHA256(text: string): Promise<string> {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// Função para obter primeiro nome
export function getFirstName(fullName: string): string {
  return fullName.split(" ")[0] || "";
}

// Função para obter nome restante
export function getRemainingName(fullName: string): string {
  const parts = fullName.split(" ");
  return parts.slice(1).join(" ") || "";
}

// Função para obter IP do usuário (server-side)
export async function getUserIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

// Funções de cookie (apenas para compatibilidade - não funcionam em server-side)
export function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

export function setCookie(
  name: string,
  value: string,
  days: number = 30
): void {
  if (typeof window === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}
