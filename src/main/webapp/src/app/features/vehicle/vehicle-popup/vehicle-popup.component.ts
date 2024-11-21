import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import {PoiService} from "../../poi/poi.service";
import {dto} from "../../../../habarta/dto";
import {LayerEvent, LayerEventType} from "../../../core/cartography/layer/layer.event";
import {PopUpConfig} from "../../../core/cartography/marker/pop-up-config";
import {EntityType} from "../../../core/cartography/marker/MarkerFactory";


@Component({
  selector: 'app-vehicle-popup',
  template: `
    <div class="vehicle-popup">
      <p-tabView [(activeIndex)]="activeTabIndex" (onChange)="onTabChange($event)">
        <!-- Onglet Information -->
        <p-tabPanel header="Information" *ngIf="popUpConfig.isTabEnabled(entityType, 'information')">
          <h4>{{ entity.licenseplate }}</h4>
          <div class="p-field">
            <label><strong>Conducteur:</strong></label>
            <span>{{ entity.driver?.firstName + ' ' + (entity.driver?.lastName || 'Aucun conducteur') }}</span>
          </div>
          <div class="p-field">
            <label><strong>Équipe:</strong></label>
            <span>{{ entity.team.label }}</span>
          </div>
          <div class="p-field">
            <label><strong>Catégorie:</strong></label>
            <span>{{ entity.category.label }}</span>
          </div>
          <div class="p-field">
            <label><strong>Dernière communication:</strong></label>
            <span>{{ entity.device.lastCommunicationDate | date:'short' }}</span>
          </div>
        </p-tabPanel>

        <!-- Onglet POI -->
        <p-tabPanel header="POI" *ngIf="popUpConfig.isTabEnabled(entityType, 'poi')">
          <h4>Liste des POIs les plus proches :</h4>
          <p-progressSpinner *ngIf="loadingNearbyPOIs" styleClass="custom-spinner"></p-progressSpinner>
          <p *ngIf="!loadingNearbyPOIs && nearbyPOIs.length === 0">
            Aucun POI trouvé à proximité.
          </p>
          <div *ngIf="!loadingNearbyPOIs && nearbyPOIs.length > 0">
            <div *ngFor="let poi of nearbyPOIs" class="poi-item">
              <div>
                <strong>{{ poi.poi.label }}</strong> - {{ poi.poi.category.label }} - Distance : {{ poi.distance | number:'1.0-2' }} km
              </div>
              <div class="poi-actions">
                <button pButton label="Centrer sur ce POI" icon="pi pi-search-plus" (click)="centerMapOnPOI(poi.poi)"></button>
                <button
                  pButton
                  [label]="isMarkerHighlighted('poi-' + poi.poi.id) ? 'Désactiver surbrillance' : 'Mettre en surbrillance'"
                  [icon]="isMarkerHighlighted('poi-' + poi.poi.id) ? 'pi pi-eye-slash' : 'pi pi-eye'"
                  (click)="toggleHighlightMarker('poi-' + poi.poi.id)"
                ></button>
              </div>
            </div>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
  styles: [`
    .vehicle-popup {
    }
    .p-field {
      margin-bottom: 1rem;
    }
    .poi-item {
      border: 1px solid #ccc;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 5px;
    }
    .poi-actions {
      margin-top: 10px;
      display: flex;
      gap: 5px;
    }
    .custom-spinner {
      display: block;
      margin: 0 auto;
    }
  `]
})
export class VehiclePopupComponent implements OnInit {
  @Input() popUpConfig: PopUpConfig;
  entityType: EntityType = EntityType.VEHICLE;
  @Input() entity: dto.VehicleSummaryDTO;
  @Output() layerEvent = new EventEmitter<LayerEvent>();
  nearbyPOIs: any[] = [];
  loadingNearbyPOIs: boolean = false;

  activeTabIndex: number = 0;
  tabNames: string[] = ['information', 'poi'];
  highlightedStates: { [markerId: string]: boolean } = {};

  constructor(private poiService: PoiService) {}

  ngOnInit() {
    // Initialiser l'onglet actif
    this.activeTabIndex = this.tabNames.indexOf('information');
    // Charger les POIs si l'onglet POI est activé par défaut
    if (this.activeTabIndex === this.tabNames.indexOf('poi')) {
      this.loadNearbyPOIs();
    }
  }

  onTabChange(event: any) {
    this.activeTabIndex = event.index;
    const tabName = this.tabNames[this.activeTabIndex];
    this.selectTab(tabName);
  }

  selectTab(tab: string) {
    this.activeTabIndex = this.tabNames.indexOf(tab);
    if (tab === 'poi' && this.nearbyPOIs.length === 0 && !this.loadingNearbyPOIs) {
      this.loadNearbyPOIs();
    }
  }

  loadNearbyPOIs() {
    this.loadingNearbyPOIs = true;
    const latitude = this.entity.device.coordinate?.coordinates[1] ?? 0.0;
    const longitude = this.entity.device.coordinate?.coordinates[0] ?? 0.0;
    this.poiService.getNearestPOIsWithDistance(latitude, longitude, 3).subscribe({
      next: (response) => {
        this.nearbyPOIs = response.map((pair: any) => {
          return {
            distance: pair.first,
            poi: pair.second,
          };
        });
        this.loadingNearbyPOIs = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des POIs les plus proches:', error);
        this.loadingNearbyPOIs = false;
      },
    });
  }

  centerMapOnPOI(poi: any) {
    const coordinates = poi.coordinate.coordinates;
    this.layerEvent.emit({
      type: LayerEventType.ZoomToCoordinates,
      payload: { coordinates }
    });
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
    this.showAllHighlightedMarkers();
  }

  isMarkerHighlighted(markerId: string): boolean {
    return this.highlightedStates[markerId] || false;
  }

  showAllHighlightedMarkers() {
    this.layerEvent.emit({
      type: LayerEventType.ZoomToHighlightedMarkersIncludingCoords,
      payload: {
        lat: this.entity.device.coordinate?.coordinates[1] ?? 0.0,
        lng: this.entity.device.coordinate?.coordinates[0] ?? 0.0,
      }
    });
  }
}

