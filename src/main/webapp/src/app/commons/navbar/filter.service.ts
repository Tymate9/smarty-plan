import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {HttpClient, HttpParams} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private localStorageKey = 'userFilters';

  // Utilisation de BehaviorSubject pour stocker les filtres
  private selectedFilters: BehaviorSubject<{ [key: string]: string[] }>;

  private resetSubject = new Subject<void>();
  reset$ = this.resetSubject.asObservable();

  // Observable pour suivre les changements
  filters$: Observable<{ [key: string]: string[] }>;

  constructor() {
    // Charger les filtres depuis le localStorage lors de l'initialisation
    const savedFilters = localStorage.getItem(this.localStorageKey);
    let initialFilters: { [key: string]: string[] };

    if (savedFilters) {
      initialFilters = JSON.parse(savedFilters);
    } else {
      // Initialiser avec les valeurs par défaut si aucun filtre n'est présent dans le localStorage
      initialFilters = {
        agencies: [],
        vehicles: [],
        drivers: []
      };
    }

    // Initialiser selectedFilters avec les filtres chargés ou les valeurs par défaut
    this.selectedFilters = new BehaviorSubject<{ [key: string]: string[] }>(initialFilters);
    this.filters$ = this.selectedFilters.asObservable();
  }

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

  // Méthode pour reset les filtres
  resetFilters(): void {
    // Clear the selected filters
    const resetFilters = {};
    this.selectedFilters.next(resetFilters);

  }

  triggerReset() {
    this.resetSubject.next();
  }
}

