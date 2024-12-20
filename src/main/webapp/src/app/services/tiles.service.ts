import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {switchMap} from "rxjs/operators";


@Injectable({
  providedIn: 'root'
})
export class TilesService {
  private apiUrl = '/api/tiles';

  constructor(private http: HttpClient) {
  }

  getTileApiKey(): Observable<{ apiKey: string }> {
    return this.http.get<{ apiKey: string }>(`${this.apiUrl}/api-key`);
  }

  private async refreshOrGetToken(apiKey: string, mapType: string): Promise<string> {
    let sessionToken = localStorage.getItem(`${mapType}TilesSessionToken`);
    const sessionExpiry = localStorage.getItem(`${mapType}TilesSessionExpiry`);

    if (!sessionToken || !sessionExpiry || new Date(sessionExpiry) < new Date()) {
      const data = await fetch(
        `https://tile.googleapis.com/v1/createSession?key=${apiKey}`,
        {
          method: 'POST',
          body: JSON.stringify({mapType: mapType, language: 'fr-FR', region: 'FR'}),
        }
      );
      const response: {
        session: string
        expiry: string
        tileWidth: number
        tileHeight: number
        imageFormat: string
      } = await data.json();
      sessionToken = response.session;
      localStorage.setItem(`${mapType}TilesSessionToken`, sessionToken);
      localStorage.setItem(`${mapType}TilesSessionExpiry`, response.expiry);
    }
    return sessionToken;
  }

  getTileUrls(): Observable<{ satelliteUrl: string, roadmapUrl: string }> {
    return this.getTileApiKey().pipe(switchMap(async ({apiKey}): Promise<{
      satelliteUrl: string,
      roadmapUrl: string
    }> => {
      const satelliteTilesSessionToken = await this.refreshOrGetToken(apiKey, 'satellite');
      const roadmapTilesSessionToken = await this.refreshOrGetToken(apiKey, 'roadmap');

      return {
        satelliteUrl: `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${satelliteTilesSessionToken}&key=${apiKey}`,
        roadmapUrl: `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${roadmapTilesSessionToken}&key=${apiKey}`
      };
    }));
  }
}
