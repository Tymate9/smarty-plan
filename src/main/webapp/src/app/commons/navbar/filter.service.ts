import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient, HttpParams} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private localStorageKey = 'userFilters';

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

  // Méthode pour sauvegarder les filtres actuels dans le localStorage
  saveFiltersToLocalStorage(): void {
    const filters = this.getCurrentFilters();
    localStorage.setItem(this.localStorageKey, JSON.stringify(filters));
  }

  // Méthode pour charger les filtres depuis le localStorage
  loadFiltersFromLocalStorage(): void {
    const savedFilters = localStorage.getItem(this.localStorageKey);
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      this.updateFilters(filters);
    }
  }
}
