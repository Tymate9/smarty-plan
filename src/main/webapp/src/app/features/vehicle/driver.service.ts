

import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DriverService {

  private apiUrl = '/api/drivers';  // URL to the backend API

  constructor(private http: HttpClient) {}

  // Fetch agencies from the backend
  getDrivers(): Observable<string[]> {
    return this.http.get<string[]>(this.apiUrl);
  }
}
