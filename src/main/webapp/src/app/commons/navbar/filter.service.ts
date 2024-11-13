import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient, HttpParams} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  // Utilisation de BehaviorSubject pour stocker les filtres
  private selectedFilters = new BehaviorSubject<{ [key: string]: string[] }>({
    agencies: [],
    vehicles: [],
    drivers: []
  });


  // Observable pour suivre les changements
  filters$ = this.selectedFilters.asObservable();

  // Méthode pour mettre à jour les filtres
  updateFilters(filters: { [key: string]: string[] }) {
    this.selectedFilters.next(filters);
  }

  // Méthode pour obtenir les filtres actuels
  getCurrentFilters() {
    return this.selectedFilters.getValue();
  }


}
