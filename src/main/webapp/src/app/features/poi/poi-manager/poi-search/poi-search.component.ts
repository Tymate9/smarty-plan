import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {dto} from "../../../../../habarta/dto";
import PointOfInterestEntity = dto.PointOfInterestEntity;
import PointOfInterestCategoryEntity = dto.PointOfInterestCategoryEntity;
import {PoiService} from "../../poi.service";
import {InputNumber} from "primeng/inputnumber";
import {FormsModule} from "@angular/forms";
import {ButtonDirective, ButtonModule} from "primeng/button";
import {NgIf} from "@angular/common";
import {SelectButton} from "primeng/selectbutton";
import {AutoComplete} from "primeng/autocomplete";
import {InputText} from "primeng/inputtext";


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
          optionLabel="denomination"
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
          [allowEmpty]="false"
        ></p-selectButton>
      </div>

      <div class="form-group" *ngIf="inputType === 'adresse'">
        <input
          pInputText
          type="text"
          [(ngModel)]="newPoiAddress"
          placeholder="Entrez une adresse"
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

          ></p-inputNumber>
        </div>
      </div>

      <p-button
        label="Ajouter un brouillon de POI"
        (click)="addNewPoi()"
        [disabled]="isAddPoiDisabled()"
        class="basic-button">
      </p-button>
    </div>
  `,
  standalone: true,
  imports: [
    InputNumber,
    FormsModule,
    ButtonDirective,
    NgIf,
    SelectButton,
    AutoComplete,
    InputText,
    ButtonModule
  ],
  styles: [`
    :host ::ng-deep .search-section {
      background-color: #f9f9f9;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 12px;
      position: relative;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    :host ::ng-deep h3 {
      margin: 0;
      font-size: 16px;
      color: #333;
      padding-bottom: 6px;
      border-bottom: 1px solid #eee;
    }

    :host ::ng-deep .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;
    }

    /* Organisation verticale pour les champs coords */
    :host ::ng-deep .coords-fields-vertical {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Panel d’auto-complétion */
    :host ::ng-deep .my-autocomplete-panel {
      z-index: 900 !important;
      position: absolute !important;
      background-color: #fff;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      max-height: 200px;
      overflow-y: auto;
    }

    /* Label global */
    :host ::ng-deep label {
      color: #555;
      font-weight: 500;
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

