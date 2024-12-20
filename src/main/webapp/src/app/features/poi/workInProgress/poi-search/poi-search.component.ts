import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {dto} from "../../../../../habarta/dto";
import PointOfInterestEntity = dto.PointOfInterestEntity;
import PointOfInterestCategoryEntity = dto.PointOfInterestCategoryEntity;
import {PoiService} from "../../poi.service";

@Component({
  selector: 'app-poi-search',
  template: `
    <div class="search-section">
      <h3>Rechercher un POI</h3>

      <div class="form-group">
        <p-autoComplete
          [(ngModel)]="searchQuery"
          [suggestions]="filteredPois"
          (completeMethod)="searchPois($event)"
          field="client_label"
          placeholder="Rechercher un POI"
          (onSelect)="onPoiSelected($event)"
          [minLength]="2"
          [forceSelection]="false"
          [dropdown]="false"
          inputStyleClass="search-input"
          panelStyleClass="my-autocomplete-panel"
        ></p-autoComplete>
      </div>
      <h3>Ajouter un POI</h3>
      <div class="form-group">
        <p-selectButton
          [options]="inputTypeOptions"
          [(ngModel)]="inputType"
          optionLabel="label"
          optionValue="value"
        ></p-selectButton>
      </div>

      <div class="form-group" *ngIf="inputType === 'adresse'">
        <input
          type="text"
          [(ngModel)]="newPoiAddress"
          placeholder="Entrez une adresse"
          class="basic-input"
        />
      </div>

      <div *ngIf="inputType === 'coordonnees'" class="coords-fields-vertical">
        <div class="form-group">
          <label for="latitude">Latitude :</label>
          <p-inputNumber
            id="latitude"
            [(ngModel)]="newPoiLatitude"
            mode="decimal"
            [min]="-90"
            [max]="90"
            [minFractionDigits]="2"
            [maxFractionDigits]="5"
            placeholder="Latitude"
            [showButtons]="false"
            class="basic-input"
          ></p-inputNumber>
        </div>
        <div class="form-group">
          <label for="longitude">Longitude :</label>
          <p-inputNumber
            id="longitude"
            [(ngModel)]="newPoiLongitude"
            mode="decimal"
            [min]="-180"
            [max]="180"
            [minFractionDigits]="2"
            [maxFractionDigits]="5"
            [showButtons]="false"
            placeholder="Longitude"
            class="basic-input"
          ></p-inputNumber>
        </div>
      </div>

      <button
        pButton
        type="button"
        label="Ajouter un brouillon de POI"
        (click)="addNewPoi()"
        [disabled]="isAddPoiDisabled()"
        class="basic-button"
      ></button>
    </div>
  `,
  styles: [`
    :host ::ng-deep .search-section {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #f9f9f9;
      position: relative;
    }

    :host ::ng-deep h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 16px;
      color: #333;
    }

    :host ::ng-deep .form-group {
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    :host ::ng-deep .basic-input {
      width: 100%;
      box-sizing: border-box;
      padding: 6px;
      font-size: 14px;
    }

    :host ::ng-deep .coords-fields-vertical {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    :host ::ng-deep .basic-button {
      width: 100%;
      padding: 8px;
      font-size: 14px;
      text-align: center;
      box-sizing: border-box;
    }

    :host ::ng-deep .my-autocomplete-panel {
      z-index: 900 !important;
      position: relative !important;
    }
  `]
})
export class PoiSearchComponent implements OnInit {
  @Input() displayedPoiIds: number[] = [];
  @Input() poiCategories: PointOfInterestCategoryEntity[] = [];

  @Output() poiCreated = new EventEmitter<PointOfInterestEntity>();
  @Output() newPoiRequested = new EventEmitter<{ address?: string , latitude?:number, longitude?:number}>();

  searchQuery: string = '';
  filteredPois: PointOfInterestEntity[] = [];
  inputType: string = 'adresse';
  newPoiAddress: string = '';
  newPoiLatitude: number | null = null;
  newPoiLongitude: number | null = null;

  inputTypeOptions = [
    { label: 'Adresse', value: 'adresse' },
    { label: 'Coordonnées', value: 'coordonnees' }
  ];

  constructor(
    private poiService: PoiService
  ) {}

  ngOnInit(): void {}

  searchPois(event: any) {
    const query = event.query.trim();
    if (query.length >= 2) {
      this.poiService.getPOIByLabel(query).subscribe(
        (pois) => {
          // Filtrer les POI déjà affichés
          this.filteredPois = pois.filter(
            poi => poi.id && !this.displayedPoiIds.includes(poi.id)
          );
        },
        (error) => {
          console.error('Erreur lors de la recherche de POI:', error);
          this.filteredPois = [];
        }
      );
    } else {
      this.filteredPois = [];
    }
  }

  onPoiSelected(selectedPoi: any) {
    const poi = selectedPoi.value as dto.PointOfInterestEntity;
    this.poiCreated.emit(poi);
    // Réinitialiser la recherche après sélection
    this.searchQuery = '';
    this.filteredPois = [];
  }

  addNewPoi() {
    if (this.inputType === 'adresse') {
      const address = this.newPoiAddress.trim();
      if (address) {
        this.newPoiRequested.emit({ address });
        this.newPoiAddress = '';
      } else {
        alert('Veuillez fournir une adresse valide.');
      }
    } else if (this.inputType === 'coordonnees') {
      if (this.newPoiLatitude !== null && this.newPoiLongitude !== null && !isNaN(this.newPoiLatitude) && !isNaN(this.newPoiLongitude)) {
        const latitude = this.newPoiLatitude;
        const longitude = this.newPoiLongitude;
        this.newPoiRequested.emit({ latitude, longitude });
        this.newPoiLatitude = null;
        this.newPoiLongitude = null;
      } else {
        alert('Veuillez fournir des coordonnées valides.');
      }
    } else {
      alert('Type d\'entrée non valide.');
    }
  }

  isAddPoiDisabled(): boolean {
    if (this.inputType === 'adresse') {
      return !this.newPoiAddress || this.newPoiAddress.trim() === '';
    } else if (this.inputType === 'coordonnees') {
      return (
        this.newPoiLatitude === null ||
        this.newPoiLongitude === null ||
        isNaN(this.newPoiLatitude) ||
        isNaN(this.newPoiLongitude)
      );
    }
    return true;
  }
}

