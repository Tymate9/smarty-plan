// src/app/core/config/config.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AppConfig } from '../../app.config';

export interface AppConfigDTO {
  keycloakConfig: {
    redirectUrl: string;       // ← on ajoute ce champ
    authServerUrl: string;
    realmName: string;
    frontendClientId: string;
  };
  tilesApiKey: string;
  testEnv: boolean;
  defaultTheme: string;
  availableThemes: string[];
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly baseUrl = '/api/config';
  public config!: AppConfigDTO;

  constructor(private readonly http: HttpClient) {}

  loadConfig(): Observable<AppConfigDTO> {
    return this.http.get<AppConfigDTO>(this.baseUrl).pipe(
      tap(cfg => {
        this.config = cfg;
        AppConfig.config = cfg;
      })
    );
  }

  getConfig(): Observable<AppConfigDTO> {
    return this.http.get<AppConfigDTO>(this.baseUrl);
  }
}
