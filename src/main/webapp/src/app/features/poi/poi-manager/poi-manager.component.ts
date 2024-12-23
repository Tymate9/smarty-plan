import {Component, OnInit, ViewContainerRef} from '@angular/core';
import {dto} from "../../../../habarta/dto";
import PointOfInterestEntity = dto.PointOfInterestEntity;
import {PointOfInterestForm, PoiService} from "../poi.service";
import PointOfInterestCategoryEntity = dto.PointOfInterestCategoryEntity;
import * as L from 'leaflet';
import 'leaflet-draw';
import {GeocodingService} from "../../../commons/geo/geo-coding.service";
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {MapManager, MapManagerConfig} from "../../../core/cartography/map/map.manager";
import {EntityType} from "../../../core/cartography/marker/MarkerFactory";
import {LayerEvent, LayerEventType} from "../../../core/cartography/layer/layer.event";
import * as wellknown from 'wellknown'
import {GeoJSONGeometry} from "wellknown";
import {GeoUtils} from "../../../commons/geo/geo-utils";
import { PopUpConfig } from 'src/app/core/cartography/marker/pop-up-config';
import {ActivatedRoute} from '@angular/router';
import {NotificationService} from "../../../commons/notification/notification.service";
import {TilesService} from "../../../services/tiles.service";


export class PoiPanel {
  public selectedCategoryId: number;
  public isModified: boolean = false;

  constructor(
    public poi: PointOfInterestEntity,
    public expanded: boolean = false,
    public address?: string,
    private _inputType: string = 'adresse',
    public modifiedAddress?: string,
    public modifiedLatitude?: number,
    public modifiedLongitude?: number
  ) {
    // Initialiser selectedCategoryId avec l'ID actuel de la catégorie
    this.selectedCategoryId = this.poi.category.id;

    // Initialiser les valeurs modifiées avec les valeurs actuelles
    this.resetModifiedValues();
  }

  get inputType(): string {
    return this._inputType;
  }

  set inputType(value: string) {
    this._inputType = value;
    this.resetModifiedValues();
/*    this.isModified = true;*/
  }

  // Méthode pour réinitialiser les valeurs modifiées
  resetModifiedValues() {
    this.modifiedAddress = this.address || '';
    this.modifiedLatitude = this.poi.coordinate.coordinates[1];
    this.modifiedLongitude = this.poi.coordinate.coordinates[0];
    this.isModified = false;
  }
}
@Component({
  selector: 'app-poi-manager',
  template: `
    <div class="poi-manager-container">
      <!-- Zone de la carte -->
      <div class="map-container">
        <!-- Composant de la carte Leaflet -->
        <div id="map" style="height: 100%;"></div>
      </div>

      <!-- Zone de recherche et d'ajout -->
      <div class="side-panel">
        <!-- Section de recherche et d'ajout -->
        <div class="search-section" style="display: grid; gap: 6px;">
          <!-- Champ de recherche avec autocomplétion -->
          <input
            pInputText
            type="text"
            placeholder="Rechercher un POI"
            [(ngModel)]="searchQuery"
            (input)="onSearchChange()"
          />

          <!-- Liste déroulante des suggestions -->
          <ul *ngIf="showSuggestions" class="suggestions-list">
            <li *ngFor="let poi of filteredPois" (click)="onPoiSelected(poi)">
              {{ poi.client_label }}
            </li>
          </ul>

          <p-dropdown
            [options]="inputTypeOptions"
            [(ngModel)]="inputType"
            placeholder="Select Type">
          </p-dropdown>


          <!-- Champs dynamiques en fonction de la sélection -->
          <div *ngIf="inputType === 'adresse'">
            <!-- Champ pour l'adresse -->
            <input
              pInputText
              type="text"
              placeholder="Entrer une adresse"
              [(ngModel)]="newPoiAddress"
            />
          </div>

          <div *ngIf="inputType === 'coordonnees'">
            <!-- Champs pour la latitude et la longitude -->
            <input
              pInputText
              type="number"
              placeholder="Latitude"
              [(ngModel)]="newPoiLatitude"
              min="-90"
              max="90"
              step="any"
            />
            <input
              pInputText
              type="number"
              placeholder="Longitude"
              [(ngModel)]="newPoiLongitude"
              min="-180"
              max="180"
              step="any"
            />
          </div>

          <!-- Bouton "Ajouter POI" -->
          <p-button
            label="Créer un brouillon de POI"
            (onClick)="addNewPoi()"
            [disabled]="isAddPoiDisabled()"
            [raised]="true"
            severity="info"
            styleClass="custom-button-red">
          </p-button>

        </div>

        <!-- Panneau d'expansion pour chaque POI -->
        <div class="poi-list">
          <div class="poi-panel" *ngFor="let poiPanel of poiPanels">
            <!-- En-tête du panneau -->
            <div class="poi-header" (click)="togglePanel(poiPanel)" [ngClass]="{'modified': poiPanel.isModified}">
              <span>{{ poiPanel.poi.denomination }}</span>
              <span>{{ poiPanel.address }}</span>
              <button
                class="delete-button"
                (click)="removePanel(poiPanel); $event.stopPropagation();"
              >
                ✖
              </button>
            </div>
            <!-- Corps du panneau -->
            <div class="poi-body" [hidden]="!poiPanel.expanded">
              <!-- Dans le formulaire du template -->
              <form (ngSubmit)="onSubmit(poiPanel)">
                <!-- Champ Label -->
                <label>
                  Code client:
                  <input
                    pInputText
                    type="text"
                    [(ngModel)]="poiPanel.poi.client_code"
                    name="code{{poiPanel.poi.id}}"
                    required
                    (ngModelChange)="poiPanel.isModified = true"
                  />
                </label>
                <label>
                  Libellé client:
                  <input
                    pInputText
                    type="text"
                    [(ngModel)]="poiPanel.poi.client_label"
                    name="label{{poiPanel.poi.id}}"
                    required
                    (ngModelChange)="poiPanel.isModified = true"
                  />
                </label>

                <!-- Champ Catégorie -->
                <label>
                  Catégorie:
                  <div class="custom-dropdown">
                  <select
                    [(ngModel)]="poiPanel.selectedCategoryId"
                    (ngModelChange)="onCategoryChange($event, poiPanel); poiPanel.isModified = true"
                    name="category{{poiPanel.poi.id}}"
                    required
                  >
                    <option *ngFor="let category of poiCategories" [ngValue]="category.id">
                      {{ category.label }}
                    </option>
                  </select>
                  </div>

                </label>

                <!-- Liste déroulante Modifier -->
                <label>
                  Modifier :
                  <p-dropdown
                    [(ngModel)]="poiPanel.inputType"
                    name="inputType{{poiPanel.poi.id}}"
                    (onChange)="poiPanel.isModified = true"
                    [options]="inputTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select type">
                  </p-dropdown>

                </label>

                <!-- Champs dynamiques -->
                <div *ngIf="poiPanel.inputType === 'adresse'">
                  <label>
                    Adresse:
                    <input
                      pInputText
                      type="text"
                      [(ngModel)]="poiPanel.modifiedAddress"
                      name="address{{poiPanel.poi.id}}"
                      (ngModelChange)="poiPanel.isModified = true"
                    />
                  </label>
                </div>

                <div *ngIf="poiPanel.inputType === 'coordonnees'">
                  <label>
                    Latitude:
                    <input
                      pInputText
                      type="number"
                      [(ngModel)]="poiPanel.modifiedLatitude"
                      name="latitude{{poiPanel.poi.id}}"
                      step="any"
                      (ngModelChange)="poiPanel.isModified = true"
                    />
                  </label>
                  <label>
                    Longitude:
                    <input
                      pInputText
                      type="number"
                      [(ngModel)]="poiPanel.modifiedLongitude"
                      name="longitude{{poiPanel.poi.id}}"
                      step="any"
                      (ngModelChange)="poiPanel.isModified = true"
                    />
                  </label>
                </div>

                <!-- Boutons pour ajouter une zone -->
                <div class="zone-buttons" style="margin-top: 1rem; display: flex; justify-content: center; align-items: center; gap: 1rem;">

                  <p-button
                    type="button"
                    label="Dessiner un Polygone"
                    icon="pi pi-pencil"
                    styleClass="p-button-secondary"
                    (click)="startPolygonDrawing(poiPanel)">
                  </p-button>

                  <p-button
                    type="button"
                    label="Dessiner un Cercle"
                    icon="pi pi-circle-on"
                    styleClass="p-button-secondary"
                    (click)="startCircleDrawing(poiPanel)">
                  </p-button>
                </div>

                <!-- Boutons de soumission -->
                <div *ngIf="poiPanel.poi.id < 0" style="margin-top: 1rem; display: flex; justify-content: center; align-items: center;">
                  <p-button
                    type="submit"
                    [disabled]="!isFormValid(poiPanel)"
                    label="Ajouter POI"
                    icon="pi pi-plus"
                    [raised]="true"
                    severity="info"
                    styleClass="custom-button-red">
                  </p-button>
                </div>
                <div *ngIf="poiPanel.poi.id >= 0" style="margin-top: 1rem; display: flex; gap: 1rem;">
                  <p-button
                    type="submit"
                    [disabled]="!isFormValid(poiPanel)"
                    label="Mettre à jour"
                    icon="pi pi-refresh"
                    styleClass="p-button-warning">
                  </p-button>

                  <p-button
                    type="button"
                    label="Supprimer"
                    (click)="deletePoi(poiPanel)"
                    icon="pi pi-trash"
                    styleClass="p-button-danger">
                  </p-button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  styles: [`
    .modified {
      background-color: #f69b9b !important;
    }

    .draw-control-message {
    }

    .poi-list {
      overflow-y: auto;
      max-height: calc(100vh - 200px);
      flex: 1;
    }

    .poi-panel {
      border: 1px solid #ccc;
      margin-bottom: 10px;
    }

    .poi-header {
      background-color: #e0e0e0;
      padding: 10px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .poi-header span {
      flex: 1;
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

    .poi-body form label {
      display: block;
      margin-bottom: 10px;
      color: var(--gray-500);
    }

    .poi-body form input,
    .poi-body form select {
      width: 100%;
      padding: 5px;
      margin-top: 5px;
    }

    .poi-body form button {
      margin-right: 10px;
    }

    .poi-manager-container {
      display: flex;
      height: 100vh;
    }

    .map-container {
      flex: 2;
      position: relative;
    }

    .side-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 10px;
    }

    .search-section {
      margin-bottom: 20px;
    }

    .search-section input {
      width: 100%;
      margin-bottom: 5px;
    }

    .search-section ul {
      list-style-type: none;
      padding: 0;
      margin: 0;
      border: 1px solid #ccc;
      max-height: 200px;
      overflow-y: auto;
      position: absolute;
      background-color: white;
      width: calc(100% - 20px);
      z-index: 1000;
    }

    .search-section li {
      padding: 5px;
      cursor: pointer;
    }

    .search-section li:hover {
      background-color: #f0f0f0;
    }

    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .suggestions-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
      border: 1px solid #ccc;
      max-height: 200px;
      overflow-y: auto;
      position: absolute;
      background-color: white;
      width: calc(100% - 20px);
      z-index: 1000;
    }

    .suggestions-list li {
      padding: 5px;
      cursor: pointer;
    }

    .suggestions-list li:hover {
      background-color: #f0f0f0;
    }
    ::ng-deep .p-button.p-component.p-button-info.p-button-raised.custom-button-red   {
      background-color:#aa001f !important;
      border-color:#aa001f !important;
      color: white !important;
      font-weight:600;
    }
    /* Container for the select dropdown */
    .custom-dropdown {
      position: relative;
      display: inline-block;
      width: 100%;
      max-width: 300px;
    }

    /* Style the native select element */
    .custom-dropdown select {
      appearance: none;
      -moz-appearance: none;
      -webkit-appearance: none;
      background-color: #ffffff;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 10px 40px 10px 12px;
      font-size: 14px;
      width: 100%;
      box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: border-color 0.3s, box-shadow 0.3s;
    }

    /* Add hover and focus effects */
    .custom-dropdown select:hover {
      border-color: #007ad9;
    }

    .custom-dropdown select:focus {
      border-color: #007ad9;
      box-shadow: 0px 0px 5px rgba(0, 122, 217, 0.5);
      outline: none;
    }

    .custom-dropdown select:disabled {
      background-color: #f9f9f9;
      border-color: #e0e0e0;
      cursor: not-allowed;
    }



  `]
})
export class PoiManagerComponent implements OnInit {
  poiPanels: PoiPanel[] = [];
  poiCategories: PointOfInterestCategoryEntity[] = [];
  searchQuery: string = '';
  searchSubject: Subject<string> = new Subject();
  showSuggestions: boolean = false;
  filteredPois: PointOfInterestEntity[] = [];
  map: L.DrawMap;
  inputType: string = 'adresse'; // Valeur par défaut
  newPoiAddress: string = '';
  newPoiLatitude: number | null = null;
  newPoiLongitude: number | null = null;
  mapManager: MapManager;
  temporaryPoiId = -1;
  drawControl: L.Control.Draw = new L.Control.Draw();
  currentPoiPanel: PoiPanel | null = null;
  inputTypeOptions = [
    { label: 'Adresse', value: 'adresse' },
    { label: 'Coordonnées', value: 'coordonnees' }
  ];


  constructor(
    private readonly poiService: PoiService,
    private readonly geocodingService: GeocodingService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly route: ActivatedRoute,
    private readonly notificationService:NotificationService,
    private readonly tilesService: TilesService
  ) {}

  // Methods Related to Map Initialization and Control
  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const labelParam = params.get('label');
      if (labelParam) {
        const poilabel= String(labelParam);
        this.poiService.getPOIByLabel(poilabel).subscribe((pois) => {
          // Filtrer les POIs déjà ajoutés
          pois.forEach((poi) => {
              this.onPoiSelected(poi)
            }
          );
        });
      } else {
        console.log('Aucun Label de POI transmis dans l\'URL.');
      }
    });
    // Coordonnées approximatives du centre de la Normandie
    const normandyCenter: L.LatLngExpression = [49.1817, 0.3714];
    // Initialiser la carte
    this.map = L.map('map', {attributionControl: false, zoomDelta: 0.5}).setView(normandyCenter, 9);
    this.map.setMaxZoom(19);

    this.tilesService.getTileUrls().subscribe(tileUrls => {
      const baseLayers = {
        "Carte routière": L.tileLayer(tileUrls.roadmapUrl),
        "Satellite": L.tileLayer(tileUrls.satelliteUrl),
      };

      L.control.layers(baseLayers, {}, {position: "bottomleft"}).addTo(this.map!);

      baseLayers["Carte routière"].addTo(this.map!);
    })

    this.mapManager = new MapManager(this.map, this.viewContainerRef, this.geocodingService, new MapManagerConfig(false));
    // Charger les catégories de POI au démarrage
    this.poiService.getAllPOICategory().subscribe(
      (categories) => {
        this.poiCategories = categories;
      },
      (error) => {
        console.error('Erreur lors du chargement des catégories de POI:', error);
      }
    );
    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => {
      this.performSearch(query);
    });
    this.initializeDrawControls();
  }

  initializeDrawControls() {
    this.map.on(L.Draw.Event.CREATED, (e: any) => {
      this.onDrawCreated(e);
    });

    this.map.on(L.Draw.Event.DRAWSTART, () => {
      this.removeDrawControlMessage();
    });

    this.map.on(L.Draw.Event.TOOLBARCLOSED, () => {
      this.stopDrawing();
    });
  }

  // Methods Related to Drawing Controls on the Map
  startPolygonDrawing(poiPanel: PoiPanel) {
    this.currentPoiPanel = poiPanel;
    this.drawControl.setDrawingOptions({
      polygon: {
        shapeOptions: {
          color: '#ff0000',
        },
      },
      rectangle: false,
      circle: false,
      circlemarker: false,
      marker: false,
      polyline: false,
    });
    this.drawControl.addTo(this.map);
    this.addDrawControlMessage(`Cliquez ici pour commencer le dessin du polygone du POI ${poiPanel.poi.denomination}`);
  }

  startCircleDrawing(poiPanel: PoiPanel) {
    this.currentPoiPanel = poiPanel;
    this.drawControl.setDrawingOptions({
      circle: {
        shapeOptions: {
          color: '#ff0000',
        },
        showRadius: true,
      },
      rectangle: false,
      polygon: false,
      circlemarker: false,
      marker: false,
      polyline: false,
    });
    this.drawControl.addTo(this.map);
    this.addDrawControlMessage(`Cliquez ici pour commencer le dessin du polygone du POI ${poiPanel.poi.denomination}`);
  }

  onDrawCreated(e: any) {
    const type = e.layerType;
    const layer = e.layer;

    if (type === 'polygon' || type === 'circle') {
      let geometry;

      if (type === 'polygon') {
        geometry = layer.toGeoJSON().geometry;
      } else if (type === 'circle') {
        // Convertir le cercle en polygone avec 16 côtés
        const polygon = GeoUtils.convertCircleToPolygon(layer as L.Circle, 16);
        // Récupérer la géométrie en GeoJSON du polygone
        geometry = polygon.toGeoJSON().geometry;
      }

      // Vérifier s'il y a un POI actuellement sélectionné pour mise à jour
      if (this.currentPoiPanel) {
        const poi = this.currentPoiPanel.poi;
        // Mettre à jour la zone du POI avec le nouveau polygone
        poi.area = {
          type: 'Polygon',
          coordinates: geometry.coordinates as number[][][],
        };

        // Appeler updateMarkerOnMap avec le POI mis à jour
        this.updateMarkerOnMap(poi, poi.id);
        this.currentPoiPanel.isModified = true
      }
    }
    this.removeDrawControlMessage();
  }

  stopDrawing() {
    this.currentPoiPanel = null;
    this.removeDrawControlMessage();
    this.drawControl.remove();
  }

  addDrawControlMessage(message: string) {
    const drawControlContainer = this.drawControl.getContainer();
    if (!drawControlContainer) {
      console.error('Impossible de récupérer le conteneur du DrawControl.');
      return;
    }

    let messageDiv = drawControlContainer.querySelector('.draw-control-message') as HTMLElement;
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      Object.assign(messageDiv.style, {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        marginTop: '8px',
        border: '1px solid #ccc',
        fontSize: '14px',
        color: '#333',
        textAlign: 'center',
      });
      messageDiv.className = 'draw-control-message';
      messageDiv.innerText = message;

      const toolbarDiv = drawControlContainer.querySelector('.leaflet-draw-toolbar');
      if (toolbarDiv && toolbarDiv.parentNode) {
        toolbarDiv.parentNode.insertBefore(messageDiv, toolbarDiv.nextSibling);
      } else {
        drawControlContainer.appendChild(messageDiv);
      }
    } else {
      messageDiv.innerText = message;
    }
  }

  removeDrawControlMessage() {
    const drawControlContainer = this.drawControl.getContainer();
    if (!drawControlContainer) return;
    const messageDiv = drawControlContainer.querySelector('.draw-control-message') as HTMLElement;
    if (messageDiv) {
      messageDiv.remove();
    }
  }

  // Methods Related to Markers on the Map
  updateMarkerOnMap(poi: PointOfInterestEntity, oldMarkerId?: number) {
    // Supprimer l'ancien marqueur
    const removeEvent: LayerEvent = {
      type: LayerEventType.RemoveMarker,
      payload: {
        entityType: EntityType.POI,
        markerId: oldMarkerId !== undefined ? 'poi-' + oldMarkerId : 'poi-' + poi.id,
      },
    };
    this.mapManager.handleLayerEvent(removeEvent, null);
    // Ajouter le nouveau marqueur
    this.addMarkerToMap(poi);
  }

  addMarkerToMap(poi: PointOfInterestEntity) {
    // Créer une instance de PopUpConfig avec uniquement l'onglet 'information' activé
    const poiPopUpConfig = new PopUpConfig({
      poiPopupTabs: new Set(['information']),
      isAreaDynamic: true // Seul l'onglet 'information' est activé
    });
    this.mapManager.addMarker(EntityType.POI, poi, poiPopUpConfig);
  }

  // Methods Related to Search and POI Selection
  onSearchChange() {
    const query = this.searchQuery.trim();
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    if (query.length >= 2) {
      this.poiService.getPOIByLabel(query).subscribe((pois) => {
        // Filtrer les POIs déjà ajoutés
        this.filteredPois = pois.filter(
          (poi) => poi.id && !this.poiPanels.some((panel) => panel.poi.id === poi.id)
        );
        this.showSuggestions = this.filteredPois.length > 0;
      });
    } else {
      this.filteredPois = [];
      this.showSuggestions = false;
    }
  }

  onPoiSelected(poi: PointOfInterestEntity) {
    // Effectuer le géocodage inverse pour obtenir l'adresse
    const latitude = poi.coordinate.coordinates[1];
    const longitude = poi.coordinate.coordinates[0];

    this.geocodingService.reverseGeocode(latitude, longitude).subscribe(
      (result) => {
        const address = result.adresse;
        const poiPanel = new PoiPanel(poi, false, address);
        this.poiPanels.push(poiPanel);

        const event: LayerEvent = {
          type: LayerEventType.POICreated,
          payload: {
            poi: poi,
            popUpConfig:new PopUpConfig({
              poiPopupTabs: new Set(['information']),
              isAreaDynamic : false// Seul l'onglet 'information' est activé
            })
          },
        };
        this.mapManager.handleLayerEvent(event, null);
      },
      (error) => {
        console.error('Erreur lors du géocodage inverse :', error);
        const poiPanel = new PoiPanel(poi, false, 'Adresse inconnue');
        this.poiPanels.push(poiPanel);

        const event: LayerEvent = {
          type: LayerEventType.POICreated,
          payload: {
            poi: poi,
            popUpConfig:new PopUpConfig({
              poiPopupTabs: new Set(['information']),
              isAreaDynamic : false
            })
          },
        };
        this.mapManager.handleLayerEvent(event, null);
      }
    );
    // Réinitialiser le champ de recherche
    this.searchQuery = '';
    // Fermer la liste des suggestions
    this.showSuggestions = false;
    // Réinitialiser les résultats filtrés
    this.filteredPois = [];
  }

  addNewPoi() {
    if (this.inputType === 'adresse') {
      if (this.newPoiAddress.trim()) {
        this.geocodingService.geocodeAddress(this.newPoiAddress).subscribe(
          (result) => {
            this.newPoiAddress = result.adresse
            const latitude = result.latitude;
            const longitude = result.longitude;
            const label = `${this.newPoiAddress}`;
            this.createPoi(label, this.newPoiAddress, latitude, longitude);
          },
          (error) => {
            console.error('Erreur lors du géocodage :', error);
            alert('Erreur lors du géocodage de l\'adresse. Veuillez réessayer.');
          }
        );
      } else {
        console.warn('L\'adresse du POI est vide.');
        alert('Veuillez fournir une adresse valide.');
      }
    } else if (this.inputType === 'coordonnees') {
      if (this.newPoiLatitude !== null && this.newPoiLongitude !== null) {
        const latitude = this.newPoiLatitude;
        const longitude = this.newPoiLongitude;

        // Appel au service de géocodage inverse pour obtenir l'adresse
        this.geocodingService.reverseGeocode(latitude, longitude).subscribe(
          (result) => {
            const address = result.adresse;
            const label = `${address}`;
            this.createPoi(label, address, latitude, longitude);
          },
          (error) => {
            console.error('Erreur lors du géocodage inverse :', error);
            // Créer le POI sans adresse
            const label = `Nouveau POI aux coordonnées ${latitude}, ${longitude}`;
            this.createPoi(label, null, latitude, longitude, false);
            alert('Erreur lors du géocodage inverse. Le POI sera créé sans adresse.');
          }
        );
      } else {
        console.warn('Les coordonnées du POI sont nulles.');
        alert('Veuillez fournir des coordonnées valides.');
      }
    } else {
      console.warn('Type d\'entrée non reconnu pour la création du POI.');
      alert('Type d\'entrée non valide.');
    }
  }

  createPoi(label: string, address: string | null, latitude: number, longitude: number, isTemporary: boolean = true) {
    // Assigner une copie de la catégorie par défaut
    const defaultCategory = { ...this.poiCategories[0] };
    // Créer un cercle Leaflet temporaire pour générer le polygone
    const circle = L.circle([latitude, longitude], { radius: 50 }); // Rayon de 50 mètres
    const polygon = GeoUtils.convertCircleToPolygon(circle, 32); // Utiliser 32 côtés pour un cercle plus lisse
    const geoJsonPolygon = polygon.toGeoJSON().geometry as GeoJSON.Polygon;
    // Créer le nouvel objet POI avec un polygone valide
    const newPoi: PointOfInterestEntity = {
      id: isTemporary ? this.temporaryPoiId-- : -1,
      client_code : "0000",
      client_label: label,
      denomination: "",
      category: defaultCategory,
      address:address ?? "Adresse Inconnu",
      coordinate: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      area: geoJsonPolygon, // Assignation du polygone valide
    };
    // Créer et ajouter le PoiPanel
    const poiPanel = new PoiPanel(newPoi, true, address || 'Adresse inconnue');
    this.poiPanels.push(poiPanel);
    // Ajouter le marqueur à la carte
    this.addMarkerToMap(newPoi);
    // Réinitialiser les champs du formulaire
    this.newPoiAddress = '';
    this.newPoiLatitude = null;
    this.newPoiLongitude = null;

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

  // Methods Related to POI Panels
  togglePanel(poiPanel: PoiPanel) {
    poiPanel.expanded = !poiPanel.expanded;
  }

  onCategoryChange(categoryId: number, poiPanel: PoiPanel) {
    const selectedCategory = this.poiCategories.find(cat => cat.id === categoryId);
    if (selectedCategory) {
      // Assigner une copie de la catégorie pour éviter la mutation de poiCategories
      poiPanel.poi.category = { ...selectedCategory };
    } else {
      console.warn(`Catégorie avec l'ID ${categoryId} non trouvée.`);
    }
  }

  removePanel(poiPanel: PoiPanel) {
    this.poiPanels = this.poiPanels.filter((panel) => panel !== poiPanel);
    const event: LayerEvent = {
      type: LayerEventType.RemoveMarker,
      payload: {
        entityType: EntityType.POI,
        markerId: 'poi-' + poiPanel.poi.id, // Utiliser l'ID du POI
      },
    };
    this.mapManager.handleLayerEvent(event, null);
    // Rechercher à nouveau si le champ de recherche n'est pas vide
    if (this.searchQuery.trim().length >= 2) {
      this.onSearchChange();
    }
  }

  onSubmit(poiPanel: PoiPanel) {
    const poi = poiPanel.poi;
    // Initialiser les coordonnées à partir des valeurs modifiées
    let longitude: number;
    let latitude: number;
    if (poiPanel.inputType === 'adresse' && poiPanel.modifiedAddress && poiPanel.modifiedAddress.trim() !== '') {
      // Géocoder l'adresse pour obtenir les coordonnées
      this.geocodingService.geocodeAddress(poiPanel.modifiedAddress).subscribe(
        (result) => {
          console.log("Les modification en fonction de result c'est ici")
          latitude = result.latitude;
          longitude = result.longitude;
          // Procéder à la création ou mise à jour du POI
          this.createOrUpdatePoi(poiPanel, poi, longitude, latitude);
        },
        (error) => {
          console.error("Erreur lors du géocodage de l'adresse :", error.error);
          this.notificationService.error("Erreur lors du géocodage de l'adresse", error.error.error)
        }
      );
    } else if (poiPanel.inputType === 'coordonnees' && GeoUtils.isValidCoordinate(poiPanel.modifiedLatitude!, poiPanel.modifiedLongitude!)) {
      // Utiliser les coordonnées modifiées
      latitude = poiPanel.modifiedLatitude!;
      longitude = poiPanel.modifiedLongitude!;
      // Procéder à la création ou mise à jour du POI
      this.createOrUpdatePoi(poiPanel, poi, longitude, latitude);
    } else {
      console.error('Veuillez fournir une adresse ou des coordonnées valides.');
    }
  }

  createOrUpdatePoi(poiPanel: PoiPanel, poi: PointOfInterestEntity, longitude: number, latitude: number) {
    // Convertir La nouvelle latitude et longitude en un wkt string
    const wktPoint = wellknown.stringify({type: 'Point', coordinates: [longitude, latitude]} as GeoJSONGeometry);
    if (!wktPoint) {
      alert('Erreur lors de la conversion des coordonnées en WKT.');
      console.error('Erreur lors de la conversion de poi.coordinate en WKT.');
      return;
    }

    // Convertir poi.area en chaîne WKT
    const wktPolygon = wellknown.stringify(poi.area as GeoJSONGeometry);
    if (!wktPolygon) {
      alert('Erreur lors de la conversion du polygone en WKT.');
      console.error('Erreur lors de la conversion de poi.area en WKT.');
      return;
    }

    // Construire l'objet poiData avec les chaînes WKT existantes
    const poiData: PointOfInterestForm = {
      clientCode: poi.client_code?? '0000',
      clientLabel: poi.client_label,
      type: poi.category.id,
      WKTPoint: wktPoint, // Utiliser la chaîne WKT générée à partir de poi.coordinate
      WKTPolygon: wktPolygon, // Utiliser la chaîne WKT générée à partir de poi.area
      adresse:poiPanel.address || "Adresse Inconnue"
    };

    if (poi.id <= -1) {
      // Création d'un nouveau POI
      this.poiService.createPOI(poiData).subscribe(
        (createdPoi) => {
          const oldMarkerId = poi.id; // Sauvegarder l'ID temporaire
          poi.id = createdPoi.id; // Mettre à jour l'ID avec l'ID de la base de données

          // Mettre à jour les coordonnées du POI
          poi.coordinate.coordinates = [longitude, latitude];

          // Mettre à jour le marqueur sur la carte
          this.updateMarkerOnMap(poi, oldMarkerId);
          poiPanel.isModified = false;
          alert("POI ajouté à la base de donnée.")
        },
        (error) => {
          console.error('Erreur lors de la création du POI :', error);
          // Afficher un message d'erreur à l'utilisateur
          alert('Erreur lors de la création du POI. Veuillez réessayer.');
        }
      );
    } else {
      // Mise à jour du POI existant
      this.poiService.updatePOI(poi.id, poiData).subscribe(
        (updatedPoi) => {
          poiPanel.poi = updatedPoi;

          // Mettre à jour le marqueur sur la carte
          this.updateMarkerOnMap(updatedPoi);

          // Mettre à jour l'adresse si nécessaire
          if (poiPanel.inputType === 'coordonnees') {
            // Effectuer un géocodage inverse pour obtenir l'adresse
            this.geocodingService.reverseGeocode(latitude, longitude).subscribe(
              (result) => {
                poiPanel.address = result.adresse;
                // Réinitialiser les valeurs modifiées
                poiPanel.resetModifiedValues();
                poiPanel.isModified = false;
                alert("Modification sauvegardé.")
              },
              (error) => {
                console.error('Erreur lors du géocodage inverse :', error);
                poiPanel.address = 'Adresse inconnue';
                poiPanel.isModified = false;
              }
            );
          } else {
            // Si l'adresse a été modifiée, mettre à jour l'adresse du panneau
            poiPanel.address = poiPanel.modifiedAddress;
            // Mettre à jour les coordonnées du POI
            poi.coordinate.coordinates = [longitude, latitude];
            // Réinitialiser les valeurs modifiées
            poiPanel.resetModifiedValues();
            poiPanel.isModified = false;
            alert("Modification sauvegardé.")
          }
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du POI :', error);
          // Afficher un message d'erreur à l'utilisateur
          alert('Erreur lors de la mise à jour du POI. Veuillez réessayer.');
        }
      );
    }
  }

  isFormValid(poiPanel: PoiPanel): boolean {
    const poi = poiPanel.poi;
    const isLabelValid = poi.client_label !== '';
    const isCategoryValid = poi.category && poi.category.id !== undefined;

    if (poiPanel.inputType === 'adresse') {
      const isAddressValid = poiPanel.modifiedAddress !== '';
      return isLabelValid && isCategoryValid && isAddressValid;
    } else if (poiPanel.inputType === 'coordonnees') {
      const areCoordinatesValid = GeoUtils.isValidCoordinate(
        poiPanel.modifiedLatitude!,
        poiPanel.modifiedLongitude!
      );
      return isLabelValid && isCategoryValid && areCoordinatesValid;
    }
    return false;
  }

  deletePoi(poiPanel: PoiPanel) {
    const poi = poiPanel.poi;
    if (poi.id > 0) {
      this.poiService.deletePOI(poi.id).subscribe(
        () => {
          this.poiPanels = this.poiPanels.filter((panel) => panel !== poiPanel);
          // Émettre un événement pour supprimer le marqueur
          const event: LayerEvent = {
            type: LayerEventType.RemoveMarker,
            payload: {
              entityType: EntityType.POI,
              markerId: 'poi-' + poiPanel.poi.id,
            },
          };
          this.mapManager.handleLayerEvent(event, null);
          alert("POI supprimé.")
        },
        (error) => {
          console.error('Erreur lors de la suppression du POI :', error);
          // Gérer l'erreur
        }
      );
    } else {
      // POI non enregistré
      this.poiPanels = this.poiPanels.filter((panel) => panel !== poiPanel);
      // Émettre un événement pour supprimer le marqueur
      const event: LayerEvent = {
        type: LayerEventType.RemoveMarker,
        payload: {
          entityType: EntityType.POI,
          markerId: 'poi-' + poiPanel.poi.id,
        },
      };
      this.mapManager.handleLayerEvent(event, null);
      alert("Création du POI annulé.")
    }
  }

}
