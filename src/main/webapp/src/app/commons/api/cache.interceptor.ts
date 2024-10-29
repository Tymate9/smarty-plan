import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { canCacheRequest } from './cache.utils';
import {CACHE_DURATIONS} from "./cache-config";

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  constructor(private cacheService: CacheService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // TODO(tester plus précisément le système de cache une fois que les méthodes POST auront été ajouté et que les filtre auront été ajouté.)
    if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
      const basePath = req.url.split('?')[0].split(window.origin)[0];
      this.cacheService.cacheBust(basePath);
    }

    if (!canCacheRequest(req)) {
      return next.handle(req);
    }

    const cacheKey = this.createCacheKey(req.urlWithParams, req.body);
    const cachedResponse = this.cacheService.getCache(cacheKey);

    if (cachedResponse) {
      console.log("Réponse fournis par le cache" + cachedResponse)
      return of(cachedResponse);
    }

    const cacheDuration = this.getCacheDuration(req.url);
    if (cacheDuration === 0) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cacheService.setCache(cacheKey, event, cacheDuration); // Cache de 4 heures
        }
      })
    );
  }

  private createCacheKey(url: string, body: any): string {
    const bodyHash = this.simpleHash(JSON.stringify(body));
    return `${url}_${bodyHash}`;
  }

  private getCacheDuration(url: string): number {
    // TODO(Vérifier s'il n'y a pas une manière plus intélligente de le faire, surtout au niveau de la récupération de la récupération de la cléfs de CACHE_DURATION).
    const routeMatch = url.split('/')[3]; // Récupère le premier paramètre après l'hôte
    return CACHE_DURATIONS[routeMatch as keyof typeof CACHE_DURATIONS] || 0;
  }

  private simpleHash(str: string): string {
    return Array.from(str).reduce((hash, char) => (hash = (hash << 5) - hash + char.charCodeAt(0)) & hash, 0).toString();
  }
}
