import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Définir une interface pour le DTO de la configuration Keycloak
export interface AppConfig {
  keycloakConfig: KeycloakAppConfig
}

export interface KeycloakAppConfig {
  redirectUrl: string;
  realmName: string;
  authServerURL: string;
  frontendClientId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly baseUrl = '/api/config';

  constructor(private readonly http: HttpClient) {}

  // Méthode pour récupérer la configuration Keycloak
  getKeycloakConfig(): Observable<AppConfig> {
    return this.http.get<AppConfig>(`${this.baseUrl}/keycloak`);
  }
}
