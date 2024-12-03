import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KeycloakConfig } from 'keycloak-js';

// Définir une interface pour le DTO de la configuration Keycloak
export interface KeycloakDTO {
  logoutURL: string;
  realmName: string;
  authServerURL: string;
  clientId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly baseUrl = '/api/envConfig';

  constructor(private readonly http: HttpClient) {}

  // Méthode pour récupérer la configuration Keycloak
  getKeycloakConfig(): Observable<KeycloakDTO> {
    return this.http.get<KeycloakDTO>(`${this.baseUrl}/keycloak`);
  }
}
