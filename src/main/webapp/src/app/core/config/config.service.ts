import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { dto } from '../../../habarta/dto';
import {AppConfig} from "../../app.config";

export type AppConfigDTO = dto.AppConfigDTO;

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly baseUrl = '/api/config';
  public config!: AppConfigDTO;

  constructor(private readonly http: HttpClient) {}

  /**
   * Charge la configuration depuis le back-end et la stocke dans le service ainsi que dans AppConfig.
   * Cette méthode sera appelée via APP_INITIALIZER pour être exécutée avant le démarrage de l'application.
   */
  loadConfig(): Observable<AppConfigDTO> {
    return this.http.get<AppConfigDTO>(this.baseUrl).pipe(
      tap((config) => {
        this.config = config;
        AppConfig.config = config;
      })
    );
  }

  /**
   * Méthode pour récupérer la configuration sans la stocker (optionnel).
   */
  getConfig(): Observable<AppConfigDTO> {
    return this.http.get<AppConfigDTO>(this.baseUrl);
  }
}
