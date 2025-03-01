import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PoiPanel} from "./poi-panel";
import {GeoUtils} from "../../../../commons/geo/geo-utils";
import {dto} from "../../../../../habarta/dto";
import PointOfInterestCategoryEntity = dto.PointOfInterestCategoryEntity;
import PointOfInterestEntity = dto.PointOfInterestEntity;
import {GeocodingService} from "../../../../commons/geo/geo-coding.service";
import {PointOfInterestForm, PoiService} from "../../poi.service";
import {GeoJSONGeometry} from "wellknown";
import * as wellknown from 'wellknown'
import * as L from 'leaflet';
import {FormsModule} from "@angular/forms";
import {InputNumber} from "primeng/inputnumber";
import {NgClass, NgForOf, NgIf} from "@angular/common";
import {ButtonDirective} from "primeng/button";
import {InputText} from "primeng/inputtext";
import {GeoJSON} from "leaflet";

@Component({
  selector: 'app-poi-list',
  template: `
    <div class="poi-list">
      <div class="poi-panel"
           *ngFor="let poiPanel of poiPanels"
           [ngClass]="{
             'new-poi-panel': poiPanel.poi.id < 0,
             'modified-panel': poiPanel.isModified
           }">
        <div class="poi-header" (click)="togglePanel(poiPanel)">
          <span class="poi-title">{{ poiPanel.poi.denomination }}</span>
          <span class="poi-address">{{ poiPanel.poi.address }}</span>
          <span class="expand-icon">{{ poiPanel.expanded ? '▼' : '►' }}</span>
          <button pButton label="✖" class="delete-button"
                  (click)="onRemovePanel(poiPanel); $event.stopPropagation();"></button>
        </div>
        <div class="poi-body" [hidden]="!poiPanel.expanded">
          <div>
            <label>
              Code client:
              <input pInputText type="text"
                     [(ngModel)]="poiPanel.poi.client_code"
                     name="code{{poiPanel.poi.id}}"
                     required
                     (ngModelChange)="poiPanel.isModified = true"
                     (focus)="selectAllText($event)"
              />
            </label>

            <label>
              Libellé client:
              <input pInputText type="text"
                     [(ngModel)]="poiPanel.poi.client_label"
                     name="label{{poiPanel.poi.id}}"
                     required
                     (ngModelChange)="poiPanel.isModified = true"
                     (focus)="selectAllText($event)"/>
            </label>

            <label>
              Catégorie:
              <select [(ngModel)]="poiPanel.selectedCategoryId"
                      (ngModelChange)="onCategoryChange($event, poiPanel); poiPanel.isModified = true"
                      name="category{{poiPanel.poi.id}}"
                      required>
                <option *ngFor="let category of poiCategories" [ngValue]="category.id">
                  {{ category.label }}
                </option>
              </select>
            </label>

            <label>
              Modifier :
              <select [(ngModel)]="poiPanel.inputType"
                      name="inputType{{poiPanel.poi.id}}"
                      (ngModelChange)="poiPanel.isModified = true">
                <option value="adresse">Adresse</option>
                <option value="coordonnees">Coordonnées</option>
              </select>
            </label>

            <div *ngIf="poiPanel.inputType === 'adresse'">
              <label>
                Adresse:
                <input pInputText type="text"
                       [(ngModel)]="poiPanel.poi.address"
                       name="address{{poiPanel.poi.id}}"
                       (ngModelChange)="poiPanel.isModified = true"/>
              </label>
            </div>
            <div *ngIf="poiPanel.inputType === 'coordonnees'">
              <label>
                Latitude:
                <p-inputNumber [(ngModel)]="poiPanel.poi.coordinate.coordinates[1]"
                               name="latitude{{poiPanel.poi.id}}"
                               (onInput)="poiPanel.isModified = true"
                               [minFractionDigits]="2"
                               [maxFractionDigits]="5"
                               [showButtons]="false">
                </p-inputNumber>
              </label>
              <label>
                Longitude:
                <p-inputNumber [(ngModel)]="poiPanel.poi.coordinate.coordinates[0]"
                               name="longitude{{poiPanel.poi.id}}"
                               (onInput)="poiPanel.isModified = true"
                               [minFractionDigits]="2"
                               [maxFractionDigits]="5"
                               [showButtons]="false">
                </p-inputNumber>
              </label>
            </div>

            <!-- Première zone de boutons (dessin) -->
            <div class="button-area">
              <!-- Définir un Polygone -->
              <button pButton label="Définir un Polygone" type="button" icon="pi pi-pencil"
                      (click)="startPolygonDrawing(poiPanel)">
              </button>

              <!-- Définir un Cercle (peut être masqué si class="hidden") -->
              <button pButton label="Définir un Cercle" type="button" icon="pi pi-circle"
                      (click)="startCircleDrawing(poiPanel)" class="hidden">
              </button>

              <!-- Définir un Cercle (via Dialog) -->
              <button pButton label="Définir un Cercle" type="button" icon="pi pi-circle"
                      (click)="openEditAreaDialog(poiPanel)">
              </button>
            </div>

            <!-- Seconde zone de boutons (CRUD) -->
            <div class="button-area">
              <!-- Ajouter POI -->
              <button *ngIf="poiPanel.poi.id < 0" pButton label="Ajouter POI" type="button" icon="pi pi-plus"
                      [disabled]="!isFormValid(poiPanel)" (click)="onCreate(poiPanel)">
              </button>

              <!-- Mettre à jour -->
              <button *ngIf="poiPanel.poi.id >= 0" pButton label="Mettre à jour" type="button" icon="pi pi-check"
                      [disabled]="!isFormValid(poiPanel)" (click)="onUpdate(poiPanel)">
              </button>

              <!-- Supprimer -->
              <button *ngIf="poiPanel.poi.id >= 0" pButton label="Supprimer" type="button" icon="pi pi-trash"
                      (click)="deletePoi(poiPanel)">
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="overlay" *ngIf="circleDialogVisible">
      <div class="dialog-box">
        <h3>Modifier l'aire du POI</h3>
        <div class="dialog-content">
          <p>Configurer l'aire du POI en cercle :</p>

          <div class="form-group">
            <label>Rayon (m)</label>
            <input type="number" [(ngModel)]="circleRadius" placeholder="Rayon"/>
          </div>
          <div class="form-group">
            <label>Latitude</label>
            <input type="number" disabled [(ngModel)]="circleCenterLat"/>
          </div>
          <div class="form-group">
            <label>Longitude</label>
            <input type="number" disabled [(ngModel)]="circleCenterLng"/>
          </div>
        </div>

        <div class="dialog-footer">
          <button (click)="confirmEditAreaDiv()">Valider</button>
          <button (click)="cancelEditAreaDiv()">Annuler</button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    FormsModule,
    InputNumber,
    NgClass,
    NgForOf,
    ButtonDirective,
    InputText,
    NgIf
  ],
  styles: [`
    /* Conteneur principal de la liste (scrollable) */
    .poi-list {
      overflow-y: auto;
      max-height: calc(100vh - 200px);
      padding: 10px;
    }

    /* Chaque "panneau" (POI Panel) */
    .poi-panel {
      border: 1px solid #ccc;
      margin-bottom: 10px;
      transition: background-color 0.3s ease, border-color 0.3s ease;
      background-color: #fff; /* fond blanc par défaut */
      border-radius: 4px;
    }

    /* Panneau "nouveau" (POI non enregistré) */
    .new-poi-panel {
      border: 2px dashed #4caf50 !important;
      background-color: #eaffea !important;
    }

    /* Panneau "modifié" */
    .modified-panel {
      border-color: #f69b9b !important;
      background-color: #ffe6e6 !important;
    }

    /* En-tête du panel */
    .poi-header {
      background-color: #e0e0e0;
      padding: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      border-radius: 4px 4px 0 0; /* angles arrondis en haut */
    }

    .poi-title {
      font-weight: bold;
      flex: 1;
      color: #333;
    }

    .poi-address {
      flex: 1;
      color: #555;
    }

    .expand-icon {
      font-size: 16px;
    }

    .delete-button {
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: #ff0000;
    }

    /* Corps du panel (zone "formulaire") */
    .poi-body {
      padding: 10px;
      border-radius: 0 0 4px 4px;
      background-color: #fafafa;
    }

    .poi-body label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }

    /* Zone où l'on place une ligne de bouton de bouton */
    .button-area {
      margin-bottom: 10px;
      display: flex;
      gap: 8px;
      width: 100%;
    }

    /* Sélecteur pour cibler tous les boutons
       directement dans \`.zone-buttons\` */
    .button-area > button,
    .button-area > .p-button {
      flex: 1 1 0;

      /* Pour éviter que le contenu (texte du bouton)
         ne dépasse s’il est trop long : */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Désactiver un bouton */
    button[disabled] {
      background-color: #ccc;
      cursor: not-allowed;
    }

    /*
       BOUTONS pButton
    */
    :host ::ng-deep .p-button,
    :host ::ng-deep button.p-button {
      background-color: #aa001f !important;
      border-color: #aa001f !important;
      color: #fff !important;
      font-weight: 600 !important;
      transition: background-color 0.2s ease !important;
    }

    /* Survol des boutons "rouges" */
    :host ::ng-deep .p-button:hover,
    :host ::ng-deep button.p-button:hover {
      background-color: #8e001b !important;
      border-color: #8e001b !important;
    }

    /* DIALOG OVERLAY (formulaire de dessin de cercle) */
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .dialog-box {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      min-width: 320px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .dialog-box h3 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #333;
    }

    .dialog-content {
      margin-bottom: 16px;
    }

    .form-group {
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .dialog-footer {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .dialog-footer button {
      background-color: #aa001f;
      border: none;
      border-radius: 4px;
      color: #fff;
      font-weight: 600;
      padding: 8px 12px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .dialog-footer button:hover {
      background-color: #8e001b;
    }
  `]
})
export class PoiListComponent implements OnInit {
  @Input() poiPanels: PoiPanel[] = [];
  poiCategories: PointOfInterestCategoryEntity[] = [];

  @Output() poiDrawingRequested = new EventEmitter<{ poi: dto.PointOfInterestEntity, shape: 'polygon'|'circle' }>();
  @Output() poiMarkerAdded = new EventEmitter<dto.PointOfInterestEntity>();
  @Output() poiMarkerUpdated = new EventEmitter<dto.PointOfInterestEntity>();
  @Output() poiMarkerRemoved = new EventEmitter<number>();

  constructor(
    private poiService: PoiService,
    private geocodingService: GeocodingService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories() {
    this.poiService.getAllPOICategory().subscribe(
      (categories) => {
        this.poiCategories = categories;
      },
      (error) => {
        console.error('Erreur lors du chargement des catégories de POI:', error);
      }
    );
  }

  togglePanel(poiPanel: PoiPanel) {
    poiPanel.expanded = !poiPanel.expanded;
  }

  onCategoryChange(categoryId: number, poiPanel: PoiPanel) {
    const selectedCategory = this.poiCategories.find(cat => cat.id === categoryId);
    if (selectedCategory) {
      poiPanel.poi.category = { ...selectedCategory };
      poiPanel.isModified = true;
    } else {
      console.warn(`Catégorie avec l'ID ${categoryId} non trouvée.`);
    }
  }

  onRemovePanel(poiPanel: PoiPanel) {
    this.poiPanels = this.poiPanels.filter(p => p !== poiPanel);
    this.poiMarkerRemoved.emit(poiPanel.poi.id);
  }

  startPolygonDrawing(poiPanel: PoiPanel) {
    this.poiDrawingRequested.emit({ poi: poiPanel.poi, shape: 'polygon' });
  }

  startCircleDrawing(poiPanel: PoiPanel) {
    this.poiDrawingRequested.emit({ poi: poiPanel.poi, shape: 'circle' });
  }

  circleDialogVisible = false;
  circleRadius: number = 80;
  circleCenterLat: number | null = null;
  circleCenterLng: number | null = null;
  currentPoiPanel?: PoiPanel;

  openEditAreaDialog(poiPanel: PoiPanel) {
    this.currentPoiPanel = poiPanel;
    this.circleDialogVisible = true;

    this.circleRadius = 80;
    const lat = poiPanel.poi.coordinate.coordinates[1];
    const lng = poiPanel.poi.coordinate.coordinates[0];
    this.circleCenterLat = lat;
    this.circleCenterLng = lng;
  }

  confirmEditAreaDiv() {
    if (!this.currentPoiPanel) return;
    if (this.circleCenterLat == null || this.circleCenterLng == null) return;

    // Leaflet circle => polygone
    const circle = L.circle([this.circleCenterLat, this.circleCenterLng], {
      radius: this.circleRadius
    });
    const polygon = GeoUtils.convertCircleToPolygon(circle, 32);
    const geoJsonPolygon = polygon.toGeoJSON().geometry as GeoJSON.Polygon;

    // update poi area
    this.updatePoiArea(this.currentPoiPanel.poi.id, geoJsonPolygon);

    this.circleDialogVisible = false;
    this.currentPoiPanel = undefined;
  }

  cancelEditAreaDiv() {
    this.circleDialogVisible = false;
    this.currentPoiPanel = undefined;
  }

  onCreate(poiPanel: PoiPanel) {
    const poi = poiPanel.poi;
    if (poiPanel.inputType === 'adresse' && poi.address && poi.address.trim() !== '') {
      this.geocodingService.geocodeAddress(poi.address).subscribe(
        (result) => {
          const latitude = result.latitude;
          const longitude = result.longitude;
          poi.address = result.adresse;
          poi.coordinate.coordinates = [longitude, latitude];

          if (poiPanel.hasLocationChanged()) {
            const confirmUpdate = confirm("La localisation (adresse/coordonnées) a changé. Voulez-vous repositionner le polygone automatiquement ?");
            if (confirmUpdate) {
              const circle = L.circle([latitude, longitude], { radius: 20 });
              const polygon = GeoUtils.convertCircleToPolygon(circle, 32);
              const geoJsonPolygon = polygon.toGeoJSON().geometry as GeoJSON.Polygon;
              poi.area = geoJsonPolygon;
            }
          }

          this.createPoi(poiPanel, poi, longitude, latitude);
        },
        (error) => {
          console.error("Erreur lors du géocodage de l'adresse :", error);
          alert("Erreur lors du géocodage de l'adresse.");
        }
      );
    } else if (poiPanel.inputType === 'coordonnees') {
      const lat = poi.coordinate.coordinates[1];
      const lng = poi.coordinate.coordinates[0];
      if (GeoUtils.isValidCoordinate(lat, lng)) {
        this.geocodingService.reverseGeocode(lat, lng).subscribe(
          (result) => {
            poi.address = result.adresse;

            if (poiPanel.hasLocationChanged()) {
              const confirmUpdate = confirm("La localisation (adresse/coordonnées) a changé. Voulez-vous repositionner le polygone automatiquement ?");
              if (confirmUpdate) {
                const circle = L.circle([lat, lng], { radius: 20 });
                const polygon = GeoUtils.convertCircleToPolygon(circle, 32);
                const geoJsonPolygon = polygon.toGeoJSON().geometry as GeoJSON.Polygon;
                poi.area = geoJsonPolygon;
              }
            }

            this.createPoi(poiPanel, poi, lng, lat);
          },
          (error) => {
            console.error('Erreur lors du reverse geocoding :', error);
            poi.address = `Coordonnées ${lat}, ${lng}`;
            if (poiPanel.hasLocationChanged()) {
              const confirmUpdate = confirm("La localisation (adresse/coordonnées) a changé. Voulez-vous repositionner le polygone automatiquement ?");
              if (confirmUpdate) {
                const circle = L.circle([lat, lng], { radius: 20 });
                const polygon = GeoUtils.convertCircleToPolygon(circle, 32);
                const geoJsonPolygon = polygon.toGeoJSON().geometry as GeoJSON.Polygon;
                poi.area = geoJsonPolygon;
              }
            }
            this.createPoi(poiPanel, poi, lng, lat);
            alert('Erreur lors du reverse geocoding. Le POI sera créé sans adresse exacte.');
          }
        );
      } else {
        console.error('Veuillez fournir des coordonnées valides pour la création.');
      }
    } else {
      console.error('Veuillez fournir une adresse ou des coordonnées valides pour la création.');
    }
  }

  onUpdate(poiPanel: PoiPanel) {
    const poi = poiPanel.poi;
    if (poiPanel.inputType === 'adresse' && poi.address && poi.address.trim() !== '') {
      this.geocodingService.geocodeAddress(poi.address).subscribe(
        (result) => {
          const latitude = result.latitude;
          const longitude = result.longitude;
          poi.address = result.adresse;
          poi.coordinate.coordinates = [longitude, latitude];

          if (poiPanel.hasLocationChanged()) {
            const confirmUpdate = confirm("La localisation (adresse/coordonnées) a changé. Voulez-vous repositionner le polygone automatiquement ?");
            if (confirmUpdate) {
              const circle = L.circle([latitude, longitude], { radius: 20 });
              const polygon = GeoUtils.convertCircleToPolygon(circle, 32);
              const geoJsonPolygon = polygon.toGeoJSON().geometry as GeoJSON.Polygon;
              poi.area = geoJsonPolygon;
            }
          }

          this.updatePoi(poiPanel, poi, longitude, latitude);
        },
        (error) => {
          console.error("Erreur lors du géocodage de l'adresse :", error);
          alert("Erreur lors du géocodage de l'adresse.");
        }
      );
    } else if (poiPanel.inputType === 'coordonnees') {
      const lat = poi.coordinate.coordinates[1];
      const lng = poi.coordinate.coordinates[0];
      if (GeoUtils.isValidCoordinate(lat, lng)) {
        this.geocodingService.reverseGeocode(lat, lng).subscribe(
          (result) => {
            poi.address = result.adresse;

            if (poiPanel.hasLocationChanged()) {
              const confirmUpdate = confirm("La localisation (adresse/coordonnées) a changé. Voulez-vous repositionner le polygone automatiquement ?");
              if (confirmUpdate) {
                const circle = L.circle([lat, lng], { radius: 20 });
                const polygon = GeoUtils.convertCircleToPolygon(circle, 32);
                const geoJsonPolygon = polygon.toGeoJSON().geometry as GeoJSON.Polygon;
                poi.area = geoJsonPolygon;
              }
            }

            this.updatePoi(poiPanel, poi, lng, lat);
          },
          (error) => {
            console.error('Erreur lors du reverse geocoding :', error);
            poi.address = `Coordonnées ${lat}, ${lng}`;
            if (poiPanel.hasLocationChanged()) {
              const confirmUpdate = confirm("La localisation (adresse/coordonnées) a changé. Voulez-vous repositionner le polygone automatiquement ?");
              if (confirmUpdate) {
                const circle = L.circle([lat, lng], { radius: 20 });
                const polygon = GeoUtils.convertCircleToPolygon(circle, 32);
                const geoJsonPolygon = polygon.toGeoJSON().geometry as GeoJSON.Polygon;
                poi.area = geoJsonPolygon;
              }
            }
            this.updatePoi(poiPanel, poi, lng, lat);
            alert('Erreur lors du reverse geocoding. Le POI sera mis à jour sans adresse exacte.');
          }
        );
      } else {
        console.error('Veuillez fournir des coordonnées valides pour la mise à jour.');
      }
    } else {
      console.error('Veuillez fournir une adresse ou des coordonnées valides pour la mise à jour.');
    }
  }

  deletePoi(poiPanel: PoiPanel) {
    this.poiPanels = this.poiPanels.filter(p => p !== poiPanel);
    this.deletePoiFromDB(poiPanel);
  }

  isFormValid(poiPanel: PoiPanel): boolean {
    const poi = poiPanel.poi;
    const isLabelValid = poi.client_label !== '';
    const isClientCodeValid = poi.client_code !== '';
    const isCategoryValid = poi.category && poi.category.id !== undefined;

    if (poiPanel.inputType === 'adresse') {
      const isAddressValid = poi.address !== '' && poi.address.trim() !== '';
      return isLabelValid && isCategoryValid && isAddressValid && isClientCodeValid;
    } else if (poiPanel.inputType === 'coordonnees') {
      const lat = poi.coordinate.coordinates[1];
      const lng = poi.coordinate.coordinates[0];
      const areCoordinatesValid = GeoUtils.isValidCoordinate(lat, lng);
      return isLabelValid && isCategoryValid && areCoordinatesValid && isClientCodeValid;
    }
    return false;
  }

  addPoiFromSearch(newPoi: PointOfInterestEntity) {
    const panel = new PoiPanel(newPoi, false, newPoi.address);
    this.poiPanels.push(panel);
    this.poiMarkerAdded.emit(newPoi);
  }

  addPoiFromAddress(address: string) {
    this.geocodingService.geocodeAddress(address).subscribe(
      (result) => {
        const latitude = result.latitude;
        const longitude = result.longitude;
        const adresse = result.adresse
        const defaultCategory = this.poiCategories.length > 0 ? { ...this.poiCategories[0] } : { id: 1, label: 'Default', color: '#000000' } as PointOfInterestCategoryEntity;

        const circle = L.circle([latitude, longitude], { radius: 50 });
        const polygon = GeoUtils.convertCircleToPolygon(circle, 32);
        const geoJsonPolygon = polygon.toGeoJSON().geometry as GeoJSON.Polygon;

        const newPoi: PointOfInterestEntity = {
          id: -1,
          client_code: "",
          client_label: ``,
          denomination: "",
          category: defaultCategory,
          address: adresse,
          coordinate: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          area: geoJsonPolygon,
        };

        const panel = new PoiPanel(newPoi, false, adresse);
        this.poiPanels.push(panel);
        this.poiMarkerAdded.emit(newPoi);
      },
      (error) => {
        console.error('Erreur lors du géocodage de l\'adresse:', error);
        alert('Erreur lors du géocodage de l\'adresse. Veuillez réessayer.');
      }
    );
  }

  addPoiFromCoordinates(latitude: number, longitude: number) {
    this.geocodingService.reverseGeocode(latitude, longitude).subscribe(
      (result) => {
        const address = result.adresse || `Adresse inconnue`;
        this.createDraftPoiFromLatLong(address, latitude, longitude);
      },
      (error) => {
        console.error('Erreur lors du reverse geocoding :', error);
        const address = `Adresse inconnue`;
        this.createDraftPoiFromLatLong(address, latitude, longitude);
        alert('Erreur lors du reverse geocoding. Le POI sera créé sans adresse exacte.');
      }
    );
  }

  private createDraftPoiFromLatLong(address: string, latitude: number, longitude: number) {
    const defaultCategory = this.poiCategories.length > 0 ? { ...this.poiCategories[0] } : { id: 1, label: 'Default', color: '#000000' } as PointOfInterestCategoryEntity;

    const circle = L.circle([latitude, longitude], { radius: 50 });
    const polygon = GeoUtils.convertCircleToPolygon(circle, 32);
    const geoJsonPolygon = polygon.toGeoJSON().geometry as GeoJSON.Polygon;

    const newPoi: PointOfInterestEntity = {
      id: -1,
      client_code: "",
      client_label: ``,
      denomination: "",
      category: defaultCategory,
      address: address,
      coordinate: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      area: geoJsonPolygon
    };

    const panel = new PoiPanel(newPoi, false, address);
    this.poiPanels.push(panel);
    this.poiMarkerAdded.emit(newPoi);
  }

  private createPoi(panel: PoiPanel, poi: PointOfInterestEntity, longitude: number, latitude: number) {
    const wktPoint = wellknown.stringify({type: 'Point', coordinates: [longitude, latitude]} as GeoJSONGeometry);
    const wktPolygon = wellknown.stringify(poi.area as GeoJSONGeometry);
    if (!wktPoint || !wktPolygon) {
      alert('Erreur de conversion WKT.');
      return;
    }

    const poiData: PointOfInterestForm = {
      clientCode: poi.client_code?? '0000',
      clientLabel: poi.client_label,
      type: poi.category.id,
      WKTPoint: wktPoint,
      WKTPolygon: wktPolygon,
      adresse: poi.address
    };

    const oldId = poi.id;

    this.poiService.createPOI(poiData).subscribe(
      (createdPoi) => {
        poi.id = createdPoi.id;
        poi.client_code = createdPoi.client_code?? '0000';
        poi.client_label = createdPoi.client_label;
        poi.category = createdPoi.category;
        poi.address = createdPoi.address;
        poi.coordinate = createdPoi.coordinate;
        poi.area = createdPoi.area;
        poi.denomination = createdPoi.denomination;

        panel.resetModifiedValues(); // Met à jour les valeurs originales

        this.poiMarkerRemoved.emit(oldId);

        alert("POI ajouté à la base de données.");
        this.poiMarkerAdded.emit(poi);
      },
      (error) => {
        console.error('Erreur lors de la création du POI :', error);
        alert('Erreur lors de la création du POI. Veuillez réessayer.');
      }
    );
  }

  private updatePoi(panel: PoiPanel, poi: PointOfInterestEntity, longitude: number, latitude: number) {
    const wktPoint = wellknown.stringify({type: 'Point', coordinates: [longitude, latitude]} as GeoJSONGeometry);
    const wktPolygon = wellknown.stringify(poi.area as GeoJSONGeometry);
    if (!wktPoint || !wktPolygon) {
      alert('Erreur de conversion WKT.');
      return;
    }

    const poiData: PointOfInterestForm = {
      clientCode: poi.client_code?? '0000',
      clientLabel: poi.client_label,
      type: poi.category.id,
      WKTPoint: wktPoint,
      WKTPolygon: wktPolygon,
      adresse:poi.address
    };

    this.poiService.updatePOI(poi.id, poiData).subscribe(
      (updatedPoi) => {
        panel.poi = updatedPoi;
        panel.resetModifiedValues(); // Met à jour les valeurs originales
        alert("Modification sauvegardée.");
        this.poiMarkerUpdated.emit(updatedPoi);
      },
      (error) => {
        console.error('Erreur lors de la mise à jour du POI :', error);
        alert('Erreur lors de la mise à jour du POI. Veuillez réessayer.');
      }
    );
  }

  private deletePoiFromDB(panel: PoiPanel) {
    const poi = panel.poi;
    if (poi.id > 0) {
      this.poiService.deletePOI(poi.id).subscribe(
        () => {
          alert("POI supprimé.");
          this.poiMarkerRemoved.emit(poi.id);
        },
        (error) => {
          console.error('Erreur lors de la suppression du POI :', error);
          alert('Erreur lors de la suppression du POI.');
        }
      );
    } else {
      alert("Création du POI annulée.");
      this.poiMarkerRemoved.emit(poi.id);
    }
  }

  public updatePoiArea(poiId: number, area: GeoJSON.Polygon) {
    const panel = this.poiPanels.find(p => p.poi.id === poiId);
    if (!panel) {
      console.warn(`Aucun panel trouvé pour le POI ID ${poiId} lors de la mise à jour de la zone.`);
      return;
    }

    panel.poi.area = area;
    panel.isModified = true; // Le POI a été modifié

    // Émettre un événement pour mettre à jour le marqueur sur la carte
    this.poiMarkerUpdated.emit(panel.poi);
  }

  selectAllText(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }
}
