import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {MarkerFactory} from "../../MarkerFactory";
import {PoiService} from "../../../poi/poi.service";
import {dto} from "../../../../../habarta/dto";
import PointOfInterestCategoryEntity = dto.PointOfInterestCategoryEntity;

@Component({
  selector: 'app-map-popup',
  template: `
    <div>
      <h4>Coordonnées : {{ latitude.toFixed(5) }}, {{ longitude.toFixed(5) }}</h4>
      <h4>Adresse : {{ address }}</h4>
      <button (click)="addPOI()">Ajouter un POI</button>
      <button (click)="showNearbyVehicles()">Afficher les véhicules les plus proches</button><br>
      <button (click)="showNearbyPOIs()">Afficher les POI les plus proches</button><br>
      <button (click)="showNearbyObjects()">Afficher les objets les plus proches</button>
      <div *ngIf="highlightedVehicleNames.length > 0">
        <h5>Véhicules à proximité :</h5>
        <ul>
          <li *ngFor="let name of highlightedVehicleNames">{{ name }}</li>
        </ul>
      </div>
      <div *ngIf="showForm">
        <label for="poiName">Nom du POI:</label>
        <input type="text" id="poiName" placeholder="Nom du POI" [(ngModel)]="poiName"><br>

        <label for="poiCategory">Type de POI:</label>
        <select id="poiCategory" [(ngModel)]="selectedCategoryId" name="poiCategory">
          <option *ngFor="let category of categories" [value]="category.id">
            {{ category.label }}
          </option>
        </select><br>

        <label for="poiRadius">Rayon (mètres):</label>
        <input type="number" id="poiRadius" placeholder="Rayon en mètres" [(ngModel)]="poiRadius" (ngModelChange)="onRadiusChange($event)"><br>
        <button (click)="submitPOI()">Soumettre</button>
      </div>
    </div>
  `,
})
export class MapPopupComponent implements OnInit,OnDestroy {
  constructor(
    private markerFactory : MarkerFactory,
    private poiService : PoiService) {}
  @Input() latitude!: number;
  @Input() longitude!: number;
  @Output() addPOIRequest = new EventEmitter<{ lat: number, lng: number }>();
  @Output() buttonClick = new EventEmitter<void>();
  @Output() poiCreated = new EventEmitter<any>();
  @Output() closePopup = new EventEmitter<void>();
  @Output() radiusChanged = new EventEmitter<number>();

  address: string = 'Chargement...';
  categories: PointOfInterestCategoryEntity[] = [];
  selectedCategoryId: number = -1;
  poiName: string = '';
  poiRadius : number = 1;
  showForm: boolean = false;
  highlightedVehicleNames: string[] = [];

  ngOnInit() {
    this.poiService.getAddressFromCoordinates(this.latitude, this.longitude).subscribe({
      next: (response) => {
        this.address = response.adresse;
      },
      error: () => this.address = 'Adresse non disponible',
    });

    // Récupérer les catégories
    this.poiService.getAllPOICategory().subscribe({
      next: (categories) => {
        this.categories = categories;
        if (this.categories.length > 0) {
          this.selectedCategoryId = this.categories[0].id;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des catégories:', error);
      }
    });
  }

  ngOnDestroy() {
    this.resetHighlights();
  }

  onRadiusChange(newRadius: number) {
    this.radiusChanged.emit(newRadius);
  }

  onButtonClick() {
    this.buttonClick.emit(); // Émet un événement pour réinitialiser la croix
  }

  private simulateProximityRequest(entityType: string): string[] {
    if (entityType === 'vehicle') return ['vehicle-1', 'vehicle-2'];
    if (entityType === 'poi') return ['poi-3', 'poi-4'];
    return ['vehicle-1', 'poi-3'];
  }

  addPOI() {
    this.highlightedVehicleNames = [];
    this.addPOIRequest.emit({ lat: this.latitude, lng: this.longitude });
    this.showForm = true;
  }

  showNearbyVehicles() {
    this.showForm = false;
    this.onButtonClick()
    this.resetHighlights();
    const nearbyIds = this.simulateProximityRequest('vehicle');
    this.highlightMarkers(nearbyIds, 'vehicle');
  }

  showNearbyPOIs() {
    this.showForm = false;
    this.onButtonClick()
    this.resetHighlights();
    const nearbyIds = this.simulateProximityRequest('poi');
    this.highlightMarkers(nearbyIds, 'poi');
  }

  showNearbyObjects() {
    this.showForm = false;
    this.onButtonClick()
    this.resetHighlights();
    const nearbyIds = this.simulateProximityRequest('all');
    this.highlightMarkers(nearbyIds, 'all');
  }

  private highlightMarkers(ids: string[], type: string) {
    this.highlightedVehicleNames = []; // Réinitialise la liste des noms
    ids.forEach(id => {
      const marker = this.markerFactory.markersMap.get(id);
      if (marker) {
        marker.highlight();
        if (type === 'vehicle') {
          this.highlightedVehicleNames.push(`Véhicule ID: ${id}`); // Ajoute le nom du véhicule
        }
        else if (type === 'all')
        {
          this.highlightedVehicleNames.push(`Objet ID: ${id}`);
        }
        else if ( type === 'poi')
        {
          this.highlightedVehicleNames.push(`POI ID: ${id}`);
        }
      }
    });
  }

  submitPOI() {
    if (this.selectedCategoryId === -1) {
      alert("Veuillez sélectionner une catégorie pour le POI.");
      return;
    }

    const poiData = {
      label: this.poiName,
      type: this.selectedCategoryId,
      WKTPoint: `POINT(${this.longitude} ${this.latitude})`,
      radius: this.poiRadius
    };

    this.poiService.createPOI(poiData).subscribe({
      next: (response) => {
        console.log('POI ajouté avec succès', response);
        this.poiCreated.emit({ ...response, coordinates: [this.latitude, this.longitude] });
        this.closePopup.emit();
      },
      error: (error) => console.error("Erreur lors de l'ajout du POI:", error)
    });
  }

  private resetHighlights() {
    this.markerFactory.resetAllHighlights();
  }
}

// TODO(trouver un endroit ou tester cette méthode)

/*const francePolygonWKT = 'POLYGON((-5.1406 51.1242, 9.5593 51.1242, 9.5593 41.3337, -5.1406 41.3337, -5.1406 51.1242))';

this.poiService.getPOIsInPolygon(francePolygonWKT).subscribe({
  next: (pois) => console.log('POI dans le polygone couvrant la France :', pois),
  error: (error) => console.error('Erreur lors de la récupération des POI :', error)
});*/
