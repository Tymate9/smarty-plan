// src/app/components/poi-popup/poi-popup.component.ts
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PointOfInterestForm, PoiService} from "../poi.service";
import * as wellknown from 'wellknown'
import {dto} from "../../../../habarta/dto";
import {VehicleService, VehicleWithDistanceDTO} from "../../vehicle/vehicle.service";
import {LayerEvent, LayerEventType} from "../../../core/cartography/layer/layer.event";
import {GeoJSONGeometry} from "wellknown";
import {PopUpConfig} from "../../../core/cartography/marker/pop-up-config";
import {EntityType} from "../../../core/cartography/marker/MarkerFactory";
import {Router} from "@angular/router";


@Component({
  selector: 'app-poi-popup',
  template: `
  <div class="poi-popup">
    <div class="tabs">
      <button
        *ngIf="popUpConfig.isTabEnabled(entityType, 'information')"
        [class.active]="activeTab === 'information'"
        (click)="selectTab('information')"
      >
        Information
      </button>
      <button
        *ngIf="popUpConfig.isTabEnabled(entityType, 'proximite')"
        [class.active]="activeTab === 'proximite'"
        (click)="selectTab('proximite')"
      >
        Proximité
      </button>
      <button
        *ngIf="popUpConfig.isTabEnabled(entityType, 'dessus')"
        [class.active]="activeTab === 'dessus'"
        (click)="selectTab('dessus')"
      >
        Dans POI
      </button>
      <button
        *ngIf="popUpConfig.isTabEnabled(entityType, 'editer')"
        [class.active]="activeTab === 'editer'"
        (click)="selectTab('editer')"
      >
        Editer
      </button>
    </div>

    <div class="tab-content">
      <div *ngIf="activeTab === 'information' && popUpConfig.isTabEnabled(entityType, 'information')">
        <!-- Contenu de l'onglet Information -->
        <p>Label : {{ entity.label }}</p>
        <p>Adresse : {{ address }}</p>
        <p>Category : {{ entity.category.label }}</p>
      </div>

      <div *ngIf="activeTab === 'proximite' && popUpConfig.isTabEnabled(entityType, 'proximite')">
        <!-- Contenu de l'onglet Proximité -->
        <h4>Véhicules les Plus Proches</h4>
        <div *ngIf="loadingProximity">
          Chargement des véhicules proches...
        </div>
        <div *ngIf="!loadingProximity && proximityVehicles.length === 0">
          Aucun véhicule trouvé à proximité.
        </div>
        <ul *ngIf="!loadingProximity && proximityVehicles.length > 0">
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
          </li>
        </ul>
      </div>

      <div *ngIf="activeTab === 'dessus' && popUpConfig.isTabEnabled(entityType, 'dessus')">
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

      <div *ngIf="activeTab === 'editer' && popUpConfig.isTabEnabled(entityType, 'editer')">
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
          <button type="submit">Mettre à jour</button>
        </form>
        <button (click)="deletePOI()">Supprimer le POI</button>
        <button (click)="navigateToPoiEdit()">Aller à l'Édition POI</button>
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
  //TODO(améliorer la configuration des popUp)
  @Input() popUpConfig: PopUpConfig;
  entityType: EntityType = EntityType.POI;
  @Input() entity: dto.PointOfInterestEntity;
  @Output() layerEvent = new EventEmitter<LayerEvent>();

  highlightedStates: { [markerId: string]: boolean } = {};
  activeTab: string = 'information';
  address: string = 'Chargement...';
  updatedPoi: { label: string;};
  categories: dto.PointOfInterestCategoryEntity[] = [];

  selectedCategoryId: number | null = null;

  proximityVehicles: VehicleWithDistanceDTO[] = [];
  loadingProximity: boolean = false;

  dessusVehicles: dto.VehicleSummaryDTO[] = [];
  loadingDessus: boolean = false;

  constructor(
    private readonly poiService: PoiService,
    private readonly vehicleService: VehicleService,
    private readonly router: Router
  ) {}

  navigateToPoiEdit() {
    this.router.navigate(['/poiedit', this.entity.label]);
  }

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
    this.poiService.getAddressFromCoordinates(this.entity.coordinate.coordinates[1],this.entity.coordinate.coordinates[0]).subscribe({
      next: (response) => {
        this.address = response.adresse;
      },
      error: () => this.address = 'Adresse non disponible',
    });
    // Initialiser updatedPoi avec les valeurs actuelles du POI
    this.updatedPoi = {
      label: this.entity.label,
    };
    // Récupérer les catégories
    this.poiService.getAllPOICategory().subscribe({
      next: (categories) => {
        this.categories = categories;

        // Initialiser selectedCategoryId avec l'ID de la catégorie actuelle du POI
        this.selectedCategoryId = this.entity.category.id;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des catégories:', error);
      }
    });
  }

  deletePOI() {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce POI ?')) {
      this.poiService.deletePOI(this.entity.id).subscribe({
        next: () => {
          alert('POI supprimé avec succès.');
          this.layerEvent.emit({
            type: LayerEventType.RemoveMarker,
            payload: {
              entityType: EntityType.POI,
              markerId: 'poi-' + this.entity.id, // Utiliser l'ID du POI
            }
          })
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
    // Vérifier que les coordonnées sont valides
    if (
      this.entity.coordinate.coordinates[0] === null ||
      this.entity.coordinate.coordinates[1] === null ||
      isNaN(this.entity.coordinate.coordinates[0]) ||
      isNaN(this.entity.coordinate.coordinates[1])
    ) {
      alert("Veuillez fournir des coordonnées valides pour le POI.");
      return;
    }
    // Générer le WKTPoint
    const wktPoint = `POINT(${this.entity.coordinate.coordinates[0]} ${this.entity.coordinate.coordinates[1]})`;
    // Construire l'objet updatedData avec WKTPoint et WKTPolygon
    const updatedData: PointOfInterestForm = {
      label: this.updatedPoi.label,
      type: this.selectedCategoryId,
      WKTPoint: wktPoint,
      WKTPolygon: wellknown.stringify(this.entity.area as GeoJSONGeometry)
    };
    // Appeler le service pour mettre à jour le POI
    this.poiService.updatePOI(this.entity.id, updatedData).subscribe({
      next: (updatedPoi) => {
        alert('POI mis à jour avec succès.');
        this.entity = updatedPoi;
        this.layerEvent.emit({
          type: LayerEventType.POIUpdated,
          payload: { updatedPoi }
        });
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du POI:', error);
        alert('Une erreur est survenue lors de la mise à jour du POI.');
      },
    });
  }

  centerMapAroundAllMarkers() {
    this.layerEvent.emit({
      type: LayerEventType.ZoomToHighlightedMarkersIncludingCoords,
      payload: {
        lat: this.entity.coordinate.coordinates[1],
        lng: this.entity.coordinate.coordinates[0]
      }
    });
  }

  loadProximityVehicles() {
    this.loadingProximity = true;
    const latitude = this.entity.coordinate.coordinates[1];
    const longitude = this.entity.coordinate.coordinates[0];
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
      this.layerEvent.emit({
        type: LayerEventType.ZoomToCoordinates,
        payload: {
          coordinates: [coordinates[0], coordinates[1]]
        }
      });
    }
  }

  loadDessusVehicles() {
    this.loadingDessus = true;
    // Convertir le polygone en WKT
    const wkt = this.convertToWktPolygon(this.entity.area.coordinates);
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
    this.highlightedStates[markerId] = !this.highlightedStates[markerId];
    const eventType = this.highlightedStates[markerId]
      ? LayerEventType.HighlightMarker
      : LayerEventType.RemoveHighlightMarker;
    this.layerEvent.emit({
      type: eventType,
      payload: { markerID: markerId }
    });
    this.centerMapAroundAllMarkers()
  }

  isMarkerHighlighted(markerId: string): boolean {
    return this.highlightedStates[markerId] || false;
  }
}
