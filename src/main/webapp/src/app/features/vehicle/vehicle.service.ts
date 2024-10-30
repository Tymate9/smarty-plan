import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { dto} from "../../../habarta/dto";

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  private readonly baseUrl = 'http://localhost:8080/vehicles';

  constructor(private readonly http: HttpClient) {}

  // Méthode pour récupérer tous les véhicules
  getAllVehicles(): Observable<dto.VehicleSummaryDTO[]> {
    return this.http.get<dto.VehicleSummaryDTO[]>(`${this.baseUrl}`);
  }

}
