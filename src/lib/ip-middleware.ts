import { NextRequest } from "next/server";

/**
 * Extrai o IP real do usuário considerando proxies e CDNs
 */
export function getRealIP(request: NextRequest): string {
  // Verificar headers comuns de proxies e CDNs
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  const xClientIP = request.headers.get('x-client-ip');
  const xForwardedFor = request.headers.get('x-forwarded-for');
  
  // Prioridade: CF-Connecting-IP > X-Real-IP > X-Client-IP > X-Forwarded-For > IP da conexão
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (xClientIP) {
    return xClientIP;
  }
  
  if (forwardedFor) {
    // X-Forwarded-For pode conter múltiplos IPs separados por vírgula
    // O primeiro é geralmente o IP original do cliente
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  // Fallback para unknown se nenhum header for encontrado
  return 'unknown';
}

/**
 * Middleware para adicionar o IP real aos headers da requisição
 */
export function addRealIPToHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  const realIP = getRealIP(request);
  headers.set('x-real-client-ip', realIP);
  return headers;
}