import { HttpRequest } from '@angular/common/http';

const POI_URL_PATTERN = /^https?:\/\/[^\/]+\/poi$/;

export function canCacheRequest(req: HttpRequest<any>): boolean {
  const urlWithoutHost : string = req.url.split(window.origin)[0];
  // Retourne true uniquement si l'URL correspond au pattern POI (whitelist)
  return req.method === 'GET' && POI_URL_PATTERN.test(urlWithoutHost);
}
