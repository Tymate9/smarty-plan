

import {Injectable} from "@angular/core";
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DriverService {

  private baseUrl = '/api/drivers';  // URL to the backend API

  constructor(private http: HttpClient) {}

  getDrivers(agencyIds: string[] | null = null ): Observable<string[]> {
    const params = {
      agencyIds: agencyIds && agencyIds.length > 0 ? agencyIds : []
    };
    return this.http.get<string[]>(`${this.baseUrl}`, { params });

  }


  // Fetch agencies from the backend
  // getDrivers(): Observable<string[]> {
  //   return this.http.get<string[]>(this.baseUrl);
  // }
  //
  //
  // // New method to get drivers by agency IDs
  // getDriversByAgencies(agencyIds: string[]): Observable<string[]> {
  //   const params ={
  //     agencyIds: agencyIds.length ? agencyIds : []
  //   }
  //   return this.http.get<string[]>(`${this.baseUrl}/byAgencies`, { params });
  //
  // }




}
