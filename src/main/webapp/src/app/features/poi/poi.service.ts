import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {dto} from "../../../habarta/dto";
import {catchError} from "rxjs/operators";

export interface PoiWithDistance {
  distance: number;
  poi: dto.PointOfInterestEntity;
}

export interface PointOfInterestForm {
  clientCode: string;
  clientLabel: string;
  type: number;
  WKTPoint: string;
  WKTPolygon: string;
  adresse: string;
}

@Injectable({
  providedIn: 'root'
})
export class PoiService {

  private readonly baseUrl = '/api/poi';

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

  getNearestPOIsWithDistance(latitude: number, longitude: number, limit: number = 10): Observable<any> {
    const params = {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      limit: limit.toString(),
    };
    return this.http.get<any>(`${this.baseUrl}/withDistance`, { params });
  }


  ///this method to test if the vehicle last position is near a POI or not.
  // getNearestPOIsWithRadius(latitude: number, longitude: number): Observable<any> {
  //   const params = {
  //     latitude: latitude.toString(),
  //     longitude: longitude.toString(),
  //   };
  //   return this.http.get<any>(`${this.baseUrl}/nearestPOIWithRadius`, { params });
  // }
  getNearestPOIsWithRadius(latitude: number, longitude: number): Observable<any> {
    const params = {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    };

    return this.http.get<any>(`${this.baseUrl}/nearestPOIWithRadius`, { params }).pipe(
      catchError(err => {
        console.error(`Error fetching nearest POI for coordinates [${latitude}, ${longitude}]:`, err);
        // Return null or an empty object as a fallback to avoid breaking downstream logic
        return of({ poi: null, error: true, message: 'Failed to fetch POI' });
      })
    );
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

  createPOI(poiData: PointOfInterestForm): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, poiData);
  }

  updatePOI(id: number, poiData: PointOfInterestForm): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, poiData);
  }

  deletePOI(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  //TODO(workInPogress)

  getPOIByLabel(label: string): Observable<any[]> {
    const params = { label };
    return this.http.get<any[]>(`${this.baseUrl}/label`, { params });
  }
}
