// src/app/components/poi-popup/poi-popup.component.ts
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PoiService} from "../poi.service";
import * as turf from '@turf/turf';
import {dto} from "../../../../habarta/dto";
import {VehicleService, VehicleWithDistanceDTO} from "../../vehicle/vehicle.service";


@Component({
  selector: 'app-poi-popup',
  template: `
    <div class="poi-popup">
      <div class="tabs">
        <button
          [class.active]="activeTab === 'information'"
          (click)="selectTab('information')"
        >
          Information
        </button>
        <button
          [class.active]="activeTab === 'proximite'"
          (click)="selectTab('proximite')"
        >
          Proximité
        </button>
        <button
          [class.active]="activeTab === 'dessus'"
          (click)="selectTab('dessus')"
        >
          Dessus
        </button>
        <button
          [class.active]="activeTab === 'editer'"
          (click)="selectTab('editer')"
        >
          Editer
        </button>
      </div>

      <div class="tab-content">
        <div *ngIf="activeTab === 'information'">
          <!-- Contenu de l'onglet Information -->
          <p>Label : {{ poi.label }}</p>
          <p>Adresse : {{ address }}</p>
          <p>Category : {{ poi.category.label }}</p>
        </div>

        <div *ngIf="activeTab === 'proximite'">
            <!-- Contenu de l'onglet Proximité -->
            <h4>Véhicules les Plus Proches</h4>
            <div *ngIf="loadingProximity">
              Chargement des véhicules proches...
            </div>
            <div *ngIf="!loadingProximity && proximityVehicles.length === 0">
              Aucun véhicule trouvé à proximité.
            </div>
            <ul *ngIf="!loadingProximity && proximityVehicles.length > 0">
              <button (click)="centerMapAroundAllMarkers()">Afficher tous les marqueurs mis en évidence</button>
              <li *ngFor="let vehicle of proximityVehicles">
                <strong>{{ vehicle.second.licenseplate }}</strong> - {{ vehicle.second.category.label }}
                <span> ({{ vehicle.first | number:'1.2-2' }} km)</span>
                <button (click)="centerMapOnVehicle(vehicle.second)">Zoom</button>
                <button
                  (click)="toggleHighlightMarker('vehicle-' + vehicle.second.id)"
                  [class.active]="isMarkerHighlighted('vehicle-' + vehicle.second.id)"
                >
                  {{ isMarkerHighlighted('vehicle-' + vehicle.second.id) ? 'Désactiver surbrillance' : 'Mettre en surbrillance' }}
                </button>
<!--                <div>
                  Équipe: {{ vehicle.second.team.label }} ({{ vehicle.second.team.category.label }})
                </div>-->
<!--                <div>
                  Dernière communication: {{ vehicle.second.device.lastCommunicationDate | date:'short' }}
                </div>-->
              </li>
            </ul>
        </div>

        <div *ngIf="activeTab === 'dessus'">
          <!-- Contenu de l'onglet Dessus -->
          <h4>Véhicules dans le Polygone</h4>
          <div *ngIf="loadingDessus">
            Chargement des véhicules dans le polygone...
          </div>
          <div *ngIf="!loadingDessus && dessusVehicles.length === 0">
            Aucun véhicule trouvé dans ce polygone.
          </div>
          <ul *ngIf="!loadingDessus && dessusVehicles.length > 0">
            <li *ngFor="let vehicle of dessusVehicles">
              <strong>{{ vehicle.licenseplate }}</strong> - {{ vehicle.category.label }}
              <div>
                Conducteur: {{ vehicle.driver?.firstName || 'Aucun conducteur' }}
              </div>
              <div>
                Équipe: {{ vehicle.team.label }} ({{ vehicle.team.category.label }})
              </div>
              <div>
                Dernière communication: {{ vehicle.device.lastCommunicationDate | date:'short' }}
              </div>
            </li>
          </ul>
        </div>


        <div *ngIf="activeTab === 'editer'">
          <!-- Contenu de l'onglet Editer -->
          <h4>Modifier le POI</h4>
          <form (ngSubmit)="submitUpdate()">
            <label for="label">Nom :</label>
            <input
              type="text"
              id="label"
              [(ngModel)]="updatedPoi.label"
              name="label"
              required
            /><br/>

            <label for="category">Type :</label>
            <select
              id="category"
              [(ngModel)]="selectedCategoryId"
              name="category"
              required
            >
              <option *ngFor="let category of categories" [value]="category.id">
                {{ category.label }}
              </option>
            </select><br/>

            <label for="radius">Rayon (mètres) :</label>
            <input
              type="number"
              id="radius"
              [(ngModel)]="updatedPoi.radius"
              name="radius"
              required
            /><br/>

            <button type="submit">Mettre à jour</button>
          </form>
          <button (click)="deletePOI()">Supprimer le POI</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .active {
      background-color: #007bff;
      color: white;
    }
    .poi-popup {
      width: 300px;
    }
    .tabs {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .tabs button {
      flex: 1;
      padding: 10px;
      cursor: pointer;
      background-color: #f1f1f1;
      border: none;
      outline: none;
      transition: background-color 0.3s;
    }
    .tabs button:not(:last-child) {
      border-right: 1px solid #ccc;
    }
    .tabs button.active {
      background-color: #ccc;
      font-weight: bold;
    }
    .tabs button:hover {
      background-color: #ddd;
    }
    .tab-content {
      padding: 10px;
      border: 1px solid #ccc;
      border-top: none;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      border: 1px solid #ccc;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 5px;
    }
    button {
      margin-top: 5px;
    }
  `]
})
export class PoiPopupComponent implements OnInit {
  @Input() poi: any;
  @Output() poiDeleted = new EventEmitter<number>();
  @Output() poiUpdated = new EventEmitter<any>();
  @Output() viewAllHighlightedMarkers = new EventEmitter<[number, number]>();
  @Output() highlightMarkerRequest = new EventEmitter<string>();
  @Output() zoomToVehicleMarker = new EventEmitter<number[]>();

  highlightedStates: { [markerId: string]: boolean } = {};

  activeTab: string = 'information';

  address: string = 'Chargement...';
  updatedPoi: { label: string; radius: number };
  categories: dto.PointOfInterestCategoryEntity[] = [];

  selectedCategoryId: number | null = null;

  constructor(
    private readonly poiService: PoiService,
    private readonly vehicleService: VehicleService,
  ) {}

  selectTab(tab: string) {
    this.activeTab = tab;

    if (tab === 'proximite' && this.proximityVehicles.length === 0 && !this.loadingProximity) {
      this.loadProximityVehicles();
    }

    // Si l'onglet Dessus est sélectionné, charger les véhicules dans le polygone
    if (tab === 'dessus' && this.dessusVehicles.length === 0 && !this.loadingDessus) {
      this.loadDessusVehicles();
    }
  }

  ngOnInit() {
    this.poiService.getAddressFromCoordinates(this.poi.coordinate.coordinates[1],this.poi.coordinate.coordinates[0]).subscribe({
      next: (response) => {
        this.address = response.adresse; // Assurez-vous que 'address' est la bonne clé
      },
      error: () => this.address = 'Adresse non disponible',
    });
    // Initialiser updatedPoi avec les valeurs actuelles du POI
    this.updatedPoi = {
      label: this.poi.label,
      radius: 50, // Valeur par défaut si le calcul échoue
    };

    // Calculer le radius à partir de l'area
    if (this.poi.area && this.poi.area.coordinates && this.poi.area.coordinates[0]) {
      const center = turf.point([this.poi.coordinate.coordinates[0], this.poi.coordinate.coordinates[1]]);
      const edgePointCoord = this.poi.area.coordinates[0][0]; // Premier point du polygone
      const edgePoint = turf.point(edgePointCoord);
      const distance = turf.distance(center, edgePoint, { units: 'meters' });
      this.updatedPoi.radius = Math.round(distance);
    } else {
      // Si le calcul du radius échoue, utilisez une valeur par défaut
      this.updatedPoi.radius = 50;
    }

    // Récupérer les catégories
    this.poiService.getAllPOICategory().subscribe({
      next: (categories) => {
        this.categories = categories;

        // Initialiser selectedCategoryId avec l'ID de la catégorie actuelle du POI
        this.selectedCategoryId = this.poi.category.id;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des catégories:', error);
      }
    });
  }

  deletePOI() {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce POI ?')) {
      this.poiService.deletePOI(this.poi.id).subscribe({
        next: () => {
          alert('POI supprimé avec succès.');
          this.poiDeleted.emit(this.poi.id);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du POI:', error);
          alert('Une erreur est survenue lors de la suppression du POI.');
        },
      });
    }
  }

  submitUpdate() {
    if (this.selectedCategoryId === null) {
      alert('Veuillez sélectionner une catégorie pour le POI.');
      return;
    }

    const updatedData = {
      label: this.updatedPoi.label,
      type: this.selectedCategoryId,
      WKTPoint: `POINT(${this.poi.coordinate.coordinates[0]} ${this.poi.coordinate.coordinates[1]})`,
      radius: this.updatedPoi.radius,
    };

    this.poiService.updatePOI(this.poi.id, updatedData).subscribe({
      next: (updatedPoi) => {
        alert('POI mis à jour avec succès.');
        this.poi = updatedPoi
        this.poiUpdated.emit(updatedPoi);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du POI:', error);
        alert('Une erreur est survenue lors de la mise à jour du POI.');
      },
    });
  }

  centerMapAroundAllMarkers() {
    this.viewAllHighlightedMarkers.emit([this.poi.coordinate.coordinates[1], this.poi.coordinate.coordinates[0]]);
  }

  proximityVehicles: VehicleWithDistanceDTO[] = [];
  loadingProximity: boolean = false;

  loadProximityVehicles() {
    this.loadingProximity = true;
    const latitude = this.poi.coordinate.coordinates[1];
    const longitude = this.poi.coordinate.coordinates[0];
    const limit = 5;

    this.vehicleService.getNearestVehiclesWithDistance(latitude, longitude, limit).subscribe({
      next: (data) => {
        this.proximityVehicles = data;
        this.loadingProximity = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des véhicules proches:', error);
        this.loadingProximity = false;
      }
    });
  }

  centerMapOnVehicle(vehicle: dto.VehicleSummaryDTO) {
    const coordinates = vehicle.device?.coordinate?.coordinates;
    if (coordinates && coordinates.length === 2) {
      this.zoomToVehicleMarker.emit([coordinates[1], coordinates[0]]);
    }
  }

  dessusVehicles: dto.VehicleSummaryDTO[] = [];
  loadingDessus: boolean = false;

  loadDessusVehicles() {
    this.loadingDessus = true;
    // Convertir le polygone en WKT
    const polygon = turf.polygon(this.poi.area.coordinates);
    const wkt = this.convertToWktPolygon(this.poi.area.coordinates);

    this.vehicleService.getVehicleInPolygon(wkt).subscribe({
      next: (data) => {
        this.dessusVehicles = data;
        this.loadingDessus = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des véhicules dans le polygone:', error);
        this.loadingDessus = false;
      }
    });
  }

  convertToWktPolygon(coordinates: number[][][]): string {
    if (!coordinates || coordinates.length === 0) {
      throw new Error('Les coordonnées du polygone sont manquantes ou invalides.');
    }
    const linearRing = coordinates[0];

    const firstPoint = linearRing[0];
    const lastPoint = linearRing[linearRing.length - 1];
    const isClosed = firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];

    const closedLinearRing = isClosed ? linearRing : [...linearRing, firstPoint];

    const pointsWkt = closedLinearRing.map(point => `${point[0]} ${point[1]}`).join(', ');
    return `POLYGON((${pointsWkt}))`;
  }

  toggleHighlightMarker(markerId: string) {
    // Basculer l'état de surbrillance dans highlightedStates
    this.highlightedStates[markerId] = !this.highlightedStates[markerId];

    // Émettre l'événement pour que MapManager gère la surbrillance
    this.highlightMarkerRequest.emit(markerId);
  }

  isMarkerHighlighted(markerId: string): boolean {
    return this.highlightedStates[markerId] || false;
  }

}
