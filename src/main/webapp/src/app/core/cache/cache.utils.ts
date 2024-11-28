import { HttpRequest } from '@angular/common/http';
//TODO(Réfléchir au cache POI)
const POI_URL_PATTERN = /^https?:\/\/[^/]+\/poi$/;

export function canCacheRequest(req: HttpRequest<any>): boolean {
  return req.method === 'GET' && POI_URL_PATTERN.test(req.url);
}
