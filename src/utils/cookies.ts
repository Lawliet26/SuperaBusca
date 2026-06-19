// Almacén local de la sesión.
//
// NOTA DE SEGURIDAD: acá NO hay "encriptación". La versión anterior usaba
// base64 + reverse con una key hardcodeada en el bundle, que es ofuscación
// trivial (reversible en segundos desde la consola) y solo daba falsa
// sensación de seguridad. La quitamos.
//
// El token de acceso viaja en el header Authorization (Bearer) hacia una API
// en otro dominio; estas cookies son únicamente el almacenamiento local del
// lado del cliente. La protección real frente a robo de token es minimizar XSS
// + TTL corto del JWT, no ofuscar el valor en la cookie.

// Secure solo cuando estamos sobre HTTPS (en http://localhost de dev, Secure
// impediría guardar la cookie en algunos navegadores).
const isSecureContext = (): boolean =>
  typeof location !== 'undefined' && location.protocol === 'https:';

// Establecer una cookie
export const setCookie = (name: string, value: unknown, days: number = 7): void => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  const secure = isSecureContext() ? ';Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(stringValue)};expires=${expires.toUTCString()};path=/;SameSite=Strict${secure}`;
};

// Obtener una cookie
export const getCookie = <T = string>(name: string): T | null => {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      const raw = cookie.substring(nameEQ.length);
      if (!raw) return null;

      let value: string;
      try {
        value = decodeURIComponent(raw);
      } catch {
        // Cookie en formato viejo (ofuscado) o corrupta: la tratamos como inválida.
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch {
        // Valor string plano (ej: un token JWT).
        return value as unknown as T;
      }
    }
  }
  return null;
};

// Eliminar una cookie
export const deleteCookie = (name: string): void => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

// Verificar si existe una cookie
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};
