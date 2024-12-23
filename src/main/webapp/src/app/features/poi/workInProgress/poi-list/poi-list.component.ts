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
          <button pButton label="✖" class="delete-button" (click)="onRemovePanel(poiPanel); $event.stopPropagation();"></button>
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
                       (ngModelChange)="poiPanel.isModified = true" />
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

            <div class="zone-buttons">
              <button pButton label="Dessiner un Polygone" type="button" (click)="startPolygonDrawing(poiPanel)"></button>
              <button pButton label="Dessiner un Cercle" type="button" (click)="startCircleDrawing(poiPanel)"></button>
            </div>

            <div *ngIf="poiPanel.poi.id < 0">
              <button pButton label="Ajouter POI" type="button" [disabled]="!isFormValid(poiPanel)" (click)="onCreate(poiPanel)"></button>
            </div>
            <div *ngIf="poiPanel.poi.id >= 0">
              <button pButton label="Mettre à jour" type="button" [disabled]="!isFormValid(poiPanel)" (click)="onUpdate(poiPanel)"></button>
              <button pButton label="Supprimer" type="button" (click)="deletePoi(poiPanel)"></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .poi-list {
      overflow-y: auto;
      max-height: calc(100vh - 200px);
      flex: 1;
      padding: 10px;
    }

    .poi-panel {
      border: 1px solid #ccc;
      margin-bottom: 10px;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .new-poi-panel {
      border: 2px dashed #4caf50 !important;
      background-color: #eaffea !important;
    }

    .modified-panel {
      border-color: #f69b9b !important;
      background-color: #ffe6e6 !important;
    }

    .poi-header {
      background-color: #e0e0e0;
      padding: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .poi-title {
      font-weight: bold;
      flex: 1;
    }

    .poi-address {
      flex: 1;
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

    .poi-body {
      padding: 10px;
    }

    .poi-body label {
      display: block;
      margin-bottom: 10px;
    }

    .zone-buttons {
      margin-bottom: 10px;
    }

    button[disabled] {
      background-color: #ccc;
      cursor: not-allowed;
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
          client_code: "0000",
          client_label: `${adresse}`,
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
      client_code: "0000",
      client_label: `${address}`,
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


