import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {MapManager, MapManagerConfig} from "../../../../core/cartography/map/map.manager";
import * as L from 'leaflet';
import 'leaflet-draw';
import {dto} from "../../../../../habarta/dto";
import PointOfInterestEntity = dto.PointOfInterestEntity;
import {EntityType} from "../../../../core/cartography/marker/MarkerFactory";
import {PopUpConfig} from "../../../../core/cartography/marker/pop-up-config";
import PointOfInterestCategoryEntity = dto.PointOfInterestCategoryEntity;
import {LayerEventType} from "../../../../core/cartography/layer/layer.event";
import {PoiListComponent} from "../poi-list/poi-list.component";
import {GeoUtils} from "../../../../commons/geo/geo-utils";
import {ActivatedRoute} from "@angular/router";
import {PoiService} from "../../poi.service";
import {LatLng, LatLngExpression} from "leaflet";
import {TilesService} from "../../../../services/tiles.service";
import {PoiSearchComponent} from "../poi-search/poi-search.component";


@Component({
  selector: 'app-poi-map',
  template: `
    <div class="transparent-blur-bg" style="width: 100%">
      <div class="poi-map-container">
        <div class="map-container" id="poiEdition-map"></div>
        <div class="side-panel">
          <app-poi-search
            [poiCategories]="poiCategories"
            (poiCreated)="onPoiCreated($event)"
            (newPoiRequested)="onNewPoiRequested($event)"
            [displayedPoiIds]="displayedPoiIds"
          ></app-poi-search>

          <app-poi-list
            (poiMarkerAdded)="onPoiMarkerAdded($event)"
            (poiMarkerUpdated)="onPoiMarkerUpdated($event)"
            (poiMarkerRemoved)="onPoiMarkerRemoved($event)"
            (poiDrawingRequested)="onPoiDrawingRequested($event)"
            #poiList>
          </app-poi-list>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    PoiSearchComponent,
    PoiListComponent
  ],
  styles: [`
    :host ::ng-deep .poi-map-container {
      display: flex;
      /* soustraire la hauteur de la navbar (ex. 60px) */
      height: calc(100vh - 75px);
      padding: 10px;
      /* background-color: #f9f9f9; */
    }

    .map-container {
      flex: 2;
      position: relative;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);

      /* Si besoin que la carte prenne toute la place en hauteur : */
      /* height: 100%; --> Pour que la carte remplisse ce container */
    }

    .side-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 10px;
      gap: 10px;

      /* Permettre le scroll interne si le contenu dépasse */
      overflow-y: auto;
      /* On veut que la side-panel ne dépasse pas la hauteur parent */
      max-height: 100%;

      /* Couleur de fond si désiré */
      background-color: #f9f9f9;
      /* Bordure ou autre style */
      border-left: 1px solid #ccc;
    }

    .side-panel {
      box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
    }

    /* Annule le style inline height: 88vh qui est dans le composant,
       ou le remplace. Car on utilise 100vh. */
    :host ::ng-deep .poi-map-container[style] {
      height: auto !important; /* Ou 100vh !important */
    }

  `]
})
export class PoiMapComponent implements OnInit, AfterViewInit {
  map: L.Map;
  mapManager: MapManager;
  poiCategories: PointOfInterestCategoryEntity[] = [];
  drawControl: L.Control.Draw = new L.Control.Draw();

  @ViewChild('poiList') poiListComponent: PoiListComponent;
  currentDrawingPoi: PointOfInterestEntity | null = null; // POI en cours de dessin

  // Variables pour stocker les paramètres avant que la vue ne soit prête
  private labelsParam: string | null;
  private addressesParam: string | null;
  private coordsParam: string | null;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private route: ActivatedRoute,
    private poiService: PoiService,
    private tilesService: TilesService
  ) {}

  get displayedPoiIds(): number[] {
    return this.poiListComponent?.poiPanels.map(panel => panel.poi.id) ?? [];
  }

  ngOnInit(): void {
    this.initMap();

    this.map.on(L.Draw.Event.CREATED, (e: any) => {
      this.onDrawCreated(e);
    });

    this.map.on(L.Draw.Event.DRAWSTART, () => {
      this.removeDrawControlMessage();
    });

    this.map.on(L.Draw.Event.TOOLBARCLOSED, () => {
      this.stopDrawing();
    });

    // Récupération des paramètres, mais on ne les applique qu'en ngAfterViewInit
    this.route.queryParamMap.subscribe(params => {
      this.labelsParam = params.get('labels');
      this.addressesParam = params.get('addresses');
      this.coordsParam = params.get('coords');
    });
  }

  ngAfterViewInit(): void {
    // Maintenant que poiListComponent est défini, on peut appliquer les query params
    this.applyQueryParams();
  }

  private initMap(): void {
    const normandyCenter: L.LatLngExpression = [49.1817, 0.3714];
    this.map = L.map('poiEdition-map', { zoomControl: true, zoomDelta: 1}).setView(normandyCenter, 9);
    this.map.setMaxZoom(18);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    this.map.attributionControl.setPosition('bottomleft')

    this.mapManager = new MapManager(this.map, this.viewContainerRef, null!, new MapManagerConfig(false));
  }

  private applyQueryParams() {
    // Traiter labels
    if (this.labelsParam) {
      const labels = this.labelsParam.split(',').map(l => l.trim()).filter(l => l !== '');
      labels.forEach(label => {
        this.poiService.getPOIByLabel(label).subscribe(pois => {
          pois.forEach(poi => {
            this.poiListComponent.addPoiFromSearch(poi);
          });
        });
      });
    }

    // Traiter addresses
    if (this.addressesParam) {
      const addresses = this.addressesParam.split(',').map(a => a.trim()).filter(a => a !== '');
      addresses.forEach(address => {
        this.poiListComponent.addPoiFromAddress(address);
      });
    }

    // Traiter coords
    if (this.coordsParam) {
      const coordPairs = this.coordsParam.split(';').map(c => c.trim()).filter(c => c !== '');
      coordPairs.forEach(pair => {
        const [latStr, lngStr] = pair.split(',').map(v => v.trim());
        const latitude = parseFloat(latStr);
        const longitude = parseFloat(lngStr);
        if (!isNaN(latitude) && !isNaN(longitude)) {
          this.poiListComponent.addPoiFromCoordinates(latitude, longitude);
        } else {
          console.warn(`Coordonnées invalides: ${pair}`);
        }
      });
    }
  }

  onPoiCreated(newPoi: PointOfInterestEntity) {
    this.poiListComponent.addPoiFromSearch(newPoi);
  }

  onNewPoiRequested(event: { address?: string, latitude?: number, longitude?: number }) {
    if (event.address) {
      this.poiListComponent.addPoiFromAddress(event.address);
    } else if (event.latitude !== undefined && event.longitude !== undefined) {
      this.poiListComponent.addPoiFromCoordinates(event.latitude, event.longitude);
    }
  }

  onPoiMarkerAdded(poi: PointOfInterestEntity) {
    const config = new PopUpConfig({
      poiPopupTabs: new Set(['information']),
      vehiclePopupTabs : new Set(['information', 'poi']),
      isAreaDynamic : false
    })
    config.isAreaDynamic = false
    this.mapManager.addMarker(EntityType.POI, poi, config);
    this.mapManager.handleLayerEvent(
      {
        type: LayerEventType.ZoomToCoordinates,
        payload: { coordinates: [poi.coordinate.coordinates[0], poi.coordinate.coordinates[1]] }
      }, null)
  }

  onPoiMarkerUpdated(poi: PointOfInterestEntity) {
    this.mapManager.handleLayerEvent({
      type: LayerEventType.RemoveMarker,
      payload: {
        entityType: EntityType.POI,
        markerId: 'poi-' + poi.id
      }
    }, null);
    this.onPoiMarkerAdded(poi);
  }

  onPoiMarkerRemoved(poiId: number) {
    this.mapManager.handleLayerEvent({
      type: LayerEventType.RemoveMarker,
      payload: {
        entityType: EntityType.POI,
        markerId: 'poi-' + poiId
      }
    }, null);
  }

  onPoiDrawingRequested(event: { poi: PointOfInterestEntity, shape: 'polygon'|'circle' }) {
    this.currentDrawingPoi = event.poi;

    const newDrawOptions: L.Control.DrawOptions = {
      rectangle: false,
      polygon: false,
      circle: false,
      circlemarker: false,
      marker: false,
      polyline: false
    };

    if (event.shape === 'polygon') {
      newDrawOptions.polygon = {
        shapeOptions: {
          color: '#ff0000'
        }
      };
    } else if (event.shape === 'circle') {
      newDrawOptions.circle = {
        shapeOptions: {
          color: '#ff0000'
        },
        showRadius: true
      };
    }

    this.drawControl.setDrawingOptions(newDrawOptions);
    this.drawControl.addTo(this.map);
    this.addDrawControlMessage(`Cliquez sur la carte pour dessiner le ${event.shape}.`);
  }

  onDrawCreated(e: any) {
    if (!this.currentDrawingPoi) {
      this.removeDrawControlMessage();
      this.stopDrawing();
      return;
    }

    const type = e.layerType;
    const layer = e.layer;
    let geometry: GeoJSON.Polygon | undefined;

    if (type === 'polygon') {
      geometry = layer.toGeoJSON().geometry as GeoJSON.Polygon;
    } else if (type === 'circle') {
      const polygon = GeoUtils.convertCircleToPolygon(layer as L.Circle, 16);
      geometry = polygon.toGeoJSON().geometry as GeoJSON.Polygon;
    }

    if (geometry) {
      this.currentDrawingPoi.area = geometry;
      this.poiListComponent.updatePoiArea(this.currentDrawingPoi.id, geometry);
    }

    this.removeDrawControlMessage();
    this.stopDrawing();
    this.currentDrawingPoi = null;
  }

  stopDrawing() {
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
        padding: '4px'
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
}
