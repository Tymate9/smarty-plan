import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {dto} from "../../../habarta/dto";

@Injectable({
  providedIn: 'root'
})
export class PoiService {

  private readonly baseUrl = 'http://localhost:8080/poi';

  constructor(private http: HttpClient) {}

  // Méthode pour récupérer tous les POI
  getAllPOIs(): Observable<dto.PointOfInterestEntity[]> {
    return this.http.get<any>(`${this.baseUrl}`);
  }

  getAllPOICategory(): Observable<dto.PointOfInterestCategoryEntity[]> {
    return this.http.get<any>(`${this.baseUrl}/category`)
  }

  getNearestPOIs(latitude: number, longitude: number, limit: number = 10): Observable<any> {
    const params = { latitude: latitude.toString(), longitude: longitude.toString(), limit: limit.toString() };
    return this.http.get<any>(`${this.baseUrl}/nearest`, { params });
  }

  getPOIsInPolygon(polygonWKT: string): Observable<any> {
    const params = { polygonWKT };
    return this.http.get<any>(`${this.baseUrl}/inPolygon`, { params });
  }

  getAddressFromCoordinates(latitude: number, longitude: number): Observable<any> {
    const params = { latitude: latitude.toString(), longitude: longitude.toString() };
    return this.http.get<any>(`${this.baseUrl}/toAdresse`, { params });
  }

  getPOIsFromAddress(adresse: string, limit: number = 1): Observable<any> {
    const params = { adresse, limit: limit.toString() };
    return this.http.get<any>(`${this.baseUrl}/fromAdresse`, { params });
  }

  createPOI(poiData: { label: string; type: number; WKTPoint: string; radius: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, poiData);
  }

  updatePOI(id: number, poiData: { label: string; type: number; WKTPoint: string; radius: number }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, poiData);
  }

  deletePOI(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

}
