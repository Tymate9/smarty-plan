import {HttpRequest} from '@angular/common/http';

const POI_URL_PATTERN = /^https?:\/\/[^/]+\/api\/poi$/;
const TRIP_URL_PATTERN = /^https?:\/\/[^/]+\/api\/trips\/vehicle\/\d+\/\d+$/;

export function canCacheRequest(req: HttpRequest<any>): boolean {
  return req.method === 'GET'
    && (POI_URL_PATTERN.test(req.url)
      || TRIP_URL_PATTERN.test(req.url));
}
