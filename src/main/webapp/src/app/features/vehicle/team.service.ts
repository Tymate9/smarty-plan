import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class TeamService {

  private apiUrl = '/api/teams';  // URL to the backend API

  constructor(private http: HttpClient) {}

  // Fetch agencies from the backend
  getAgencies(): Observable<string[]> {
    return this.http.get<string[]>(this.apiUrl);
  }
}
