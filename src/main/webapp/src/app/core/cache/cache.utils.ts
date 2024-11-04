import { HttpRequest } from '@angular/common/http';

const POI_URL_PATTERN = /^https?:\/\/[^/]+\/poi$/;

export function canCacheRequest(req: HttpRequest<any>): boolean {
  return req.method === 'GET' && POI_URL_PATTERN.test(req.url);
}
