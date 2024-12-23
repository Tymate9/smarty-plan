import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {switchMap} from "rxjs/operators";
import {ConfigService} from "../core/config/config.service";


@Injectable({
  providedIn: 'root'
})
export class TilesService {
  constructor(private configService: ConfigService) {
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
      if (!data.ok) {
        alert('Failed to get session token for ${mapType} tiles');
        return ''
      }
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
    return this.configService.getConfig().pipe(switchMap(async ({tilesApiKey}): Promise<{
      satelliteUrl: string,
      roadmapUrl: string
    }> => {
      const satelliteTilesSessionToken = await this.refreshOrGetToken(tilesApiKey, 'satellite');
      const roadmapTilesSessionToken = await this.refreshOrGetToken(tilesApiKey, 'roadmap');

      if (satelliteTilesSessionToken === '' || roadmapTilesSessionToken === '') {
        return {
          satelliteUrl: '',
          roadmapUrl: ''
        };
      }

      return {
        satelliteUrl: `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${satelliteTilesSessionToken}&key=${tilesApiKey}`,
        roadmapUrl: `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${roadmapTilesSessionToken}&key=${tilesApiKey}`
      };
    }));
  }
}
