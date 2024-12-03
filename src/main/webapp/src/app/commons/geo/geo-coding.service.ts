import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GeocodeResult {
  adresse: string;
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResult {
  adresse: string;
}

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // Méthode pour le géocodage (adresse vers coordonnées)
  geocodeAddress(address: string): Observable<GeocodeResult> {
    const params = { adresse: address };
    return this.http.get<GeocodeResult>(`${this.baseUrl}/geocode`, { params });
  }

  // Méthode pour le géocodage inverse (coordonnées vers adresse)
  reverseGeocode(lat: number, lon: number): Observable<ReverseGeocodeResult> {
    const params = { latitude: lat.toString(), longitude: lon.toString() };
    return this.http.get<ReverseGeocodeResult>(`${this.baseUrl}/reverse-geocode`, { params });
  }
}
