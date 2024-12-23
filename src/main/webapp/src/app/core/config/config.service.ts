import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {dto} from "../../../habarta/dto";
import AppConfigDTO = dto.AppConfigDTO;

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly baseUrl = '/api/config';

  constructor(private readonly http: HttpClient) {
  }

  // Méthode pour récupérer la configuration
  getConfig(): Observable<AppConfigDTO> {
    return this.http.get<AppConfigDTO>(`${this.baseUrl}`);
  }
}
