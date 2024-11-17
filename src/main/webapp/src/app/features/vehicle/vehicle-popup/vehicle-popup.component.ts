import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import {PoiService} from "../../poi/poi.service";
import {dto} from "../../../../habarta/dto";
import {LayerEvent, LayerEventType} from "../../../core/cartography/tmpTest/layer.event";

@Component({
  selector: 'app-vehicle-popup',
  template: `
    <div class="tabs">
      <button
        [class.active]="activeTab === 'information'"
        (click)="selectTab('information')"
      >
        Information
      </button>
      <button
        [class.active]="activeTab === 'poi'"
        (click)="selectTab('poi')"
      >
        POI
      </button>
    </div>

    <div class="tab-content">
      <!-- Onglet Information -->
      <div *ngIf="activeTab === 'information'">
        <h4>{{ entity.licenseplate }}</h4>
        <p>
          <strong>Conducteur:</strong> {{ entity.driver?.firstName + ' ' + (entity.driver?.lastName || 'Aucun conducteur') }}
        </p>
        <p><strong>Équipe:</strong> {{ entity.team.label }}</p>
        <p><strong>Catégorie:</strong> {{ entity.category.label }}</p>
        <p><strong>Dernière communication:</strong> {{ entity.device.lastCommunicationDate | date:'short' }}</p>
      </div>

      <!-- Onglet POI -->
      <div *ngIf="activeTab === 'poi'">
        <p>Liste des POIs les plus proches :</p>
        <button (click)="showAllHighlightedMarkers()">Afficher tous les marqueurs mis en évidence</button>
        <ul>
          <li *ngFor="let poi of nearbyPOIs">
            {{ poi.poi.label }} - Distance : {{ poi.distance | number:'1.0-2' }} km
            <button type="button" (click)="centerMapOnPOI(poi.poi)">Centrer sur ce POI</button>
            <button
              (click)="toggleHighlightMarker('poi-' + poi.poi.id)"
              [class.active]="isMarkerHighlighted('poi-' + poi.poi.id)"
            >
              {{ isMarkerHighlighted('poi-' + poi.poi.id) ? 'Désactiver surbrillance' : 'Mettre en surbrillance' }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    /* Styles pour les boutons toggle */
    .active {
      background-color: #007bff;
      color: white;
    }
  `]
})
export class VehiclePopupComponent implements OnInit {
  @Input() entity: dto.VehicleSummaryDTO;
  @Output() layerEvent = new EventEmitter<LayerEvent>();

  nearbyPOIs: any[] = [];

  activeTab: string = 'information'; // Onglet par défaut
  highlightedStates: { [markerId: string]: boolean } = {};


  constructor(private poiService: PoiService) {}

  showAllHighlightedMarkers() {
    this.layerEvent.emit({
      type: LayerEventType.ZoomToHighlightedMarkersIncludingCoords,
      payload: {
        lat: this.entity.device.coordinate?.coordinates[1] ?? 0.0,
        lng: this.entity.device.coordinate?.coordinates[0] ?? 0.0,
      }
    });
  }

  toggleHighlightMarker(markerId: string) {
    // Basculer l'état de surbrillance
    this.highlightedStates[markerId] = !this.highlightedStates[markerId];

    // Déterminer le type d'événement en fonction de l'état
    const eventType = this.highlightedStates[markerId]
      ? LayerEventType.HighlightMarker
      : LayerEventType.RemoveHighlightMarker;

    // Émettre l'événement
    this.layerEvent.emit({
      type: eventType,
      payload: { markerID: markerId }
    });
  }

  isMarkerHighlighted(markerId: string): boolean {
    return this.highlightedStates[markerId] || false;
  }

  ngOnInit() {
    this.loadNearbyPOIs()
  }

  selectTab(tab: string) {
    this.activeTab = tab;

    if (tab === 'information') {
      // Aucune action supplémentaire nécessaire pour l'onglet Information
    }

    if (tab === 'poi' && this.nearbyPOIs.length === 0) {
      this.loadNearbyPOIs();
    }
  }

  loadNearbyPOIs() {
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
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des POIs les plus proches:', error);
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
}
