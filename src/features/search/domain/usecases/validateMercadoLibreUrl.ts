import type { UrlValidationResult } from '../entities/url-validation';

// Host canónico de Mercado Libre México. Válido = ese host exacto o un subdominio suyo.
const ML_HOST = 'mercadolibre.com.mx';

// Extrae { scheme, host } de una URL. Primero intenta el parser estándar `URL`;
// si falla (Hermes/RN 0.86 no siempre es fiable), cae a un parseo por regex.
function extractSchemeAndHost(raw: string): { scheme: string; host: string } | null {
  try {
    const u = new URL(raw);
    const scheme = u.protocol.replace(/:$/, '').toLowerCase();
    const host = u.hostname.toLowerCase();
    if (host) return { scheme, host };
  } catch {
    // Parser nativo no disponible o URL no parseable: seguimos con el fallback.
  }

  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]+)/i.exec(raw.trim());
  if (!match) return null;

  const scheme = match[1].toLowerCase();
  const authority = match[2];
  const hostPort = authority.split('@').pop() ?? authority; // descarta userinfo
  const host = hostPort.split(':')[0].toLowerCase(); // descarta puerto
  if (!host) return null;

  return { scheme, host };
}

// Puro. Válida = URL parseable con esquema http(s) cuyo hostname es
// `mercadolibre.com.mx` o termina en `.mercadolibre.com.mx`.
export function validateMercadoLibreUrl(raw: string): UrlValidationResult {
  const parsed = extractSchemeAndHost(raw);
  if (!parsed) return { ok: false, reason: 'invalidFormat' };

  const { scheme, host } = parsed;
  if (scheme !== 'http' && scheme !== 'https') {
    return { ok: false, reason: 'invalidFormat' };
  }
  if (host === ML_HOST || host.endsWith(`.${ML_HOST}`)) {
    return { ok: true };
  }
  return { ok: false, reason: 'invalidFormat' };
}
