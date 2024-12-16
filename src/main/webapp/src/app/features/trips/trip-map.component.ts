import {Component, Input} from '@angular/core';
import * as L from 'leaflet';
import {TripsService} from './trips.service';
import {dto} from "../../../habarta/dto";
import {parse as WKTParse} from "wellknown";
import {CustomMarkerImpl, MarkerFactory} from "../../core/cartography/marker/MarkerFactory";
import TripEventsDTO = dto.TripEventsDTO;
import TripEventDTO = dto.TripEventDTO;
import TripEventType = dto.TripEventType;


@Component({
  selector: 'app-trip-map',
  template: `
    <div id="trip-container">
      <div id="map"></div>
      <div id="side-panel" class="w-1/4 h-screen p-4 {{ showSidePanel ? 'show' : 'hide'}}">
        <p-toggleButton
          [(ngModel)]="showSidePanel"
          onIcon="pi pi-angle-right"
          offIcon="pi pi-angle-left"
          id="side-panel-toggle"
        />
        <div class="container">
          <div *ngIf="showTimeline" id="trip-cards" class="flex">
            <p-card header="Amplitude">
              <p>{{ tripsService.formatDuration(tripData!.range) }}</p>
            </p-card>
            <p-card header="Arrêt">
              <p>{{ tripsService.formatDuration(tripData!.stopDuration) }}</p>
            </p-card>
            <p-card header="Conduite">
              <p>{{ tripsService.formatDuration(tripData!.drivingDuration) }}</p>
            </p-card>
            <p-card header="Nb de trajets">
              <p>{{ tripData!.tripAmount }}</p>
            </p-card>
            <p-card header="Distance totale">
              <p>{{ tripData!.drivingDistance.toFixed(0) }} Km</p>
            </p-card>
            <p-card header="Nb de POI visités">
              <p>{{ tripData!.poiAmount }}</p>
            </p-card>
          </div>
          <p-timeline [value]="tripData!.tripEvents" id="trips-timeline" *ngIf="showTimeline">
            <ng-template pTemplate="marker" let-event>
              <span *ngIf="event.eventType === TripEventType.STOP"
                    class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
                    [style]="{ 'background-color': event.color }">
                      <i class="pi pi-map-marker"></i>
              </span>
              <span *ngIf="event.eventType === TripEventType.VEHICLE_RUNNING">
                <img src="../../../assets/icon/vgp-vert.svg" alt="{{ tripData!.driverName }}"/>
              </span>
              <span *ngIf="event.eventType === TripEventType.VEHICLE_IDLE">
                <img src="../../../assets/icon/vgp-orange.svg" alt="{{ tripData!.driverName }}"/>
              </span>
            </ng-template>
            <ng-template pTemplate="content" let-event>
              <div
                *ngIf="event.eventType === TripEventType.TRIP"
                (mouseenter)="onTripEventMouseEnter(event)"
                (mouseleave)="onTripEventMouseLeave(event)"
              >
<!--                color round -->
                <div class="p-3 bg-black-alpha-20 border-round cursor-pointer"
                     [style]="{ 'background-color': event.color }"></div>

                {{ event.duration }} : {{ event.start.toLocaleTimeString() }}
                -> {{ event.end.toLocaleTimeString() }} {{ event.distance }}
              </div>
              <div
                class="p-3 bg-black-alpha-20 border-round cursor-pointer"
                *ngIf="event.eventType !== TripEventType.TRIP"
                (mouseenter)="onTripEventMouseEnter(event)"
                (mouseleave)="onTripEventMouseLeave(event)"
                (click)="onTripEventClick(event)"
              > {{ event.poiLabel ? event.poiLabel + ' ' + event.address : event.address }}
                : {{ event.start?.toLocaleTimeString() }}
                -> {{ event.end?.toLocaleTimeString() }} {{ event.duration }}
              </div>
            </ng-template>
          </p-timeline>
          <div *ngIf="!showTimeline">
            <p>Chargement du détail des trajets...</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    #trip-container {
      overflow-x: hidden;
      overflow-y: hidden;
      width: 100%;
      position: absolute;
      top: 0;
    }

    #map {
      height: 80vh;
    }

    #side-panel {
      transition: margin-left 0.5s;
      position: absolute;
      left: 100%;
      top: 0;
      height: 100% !important;
      width: 35%;
      z-index: 1000;
      display: flex;
      padding: 0 !important;

      .container {
        height: 100%;
        display: inline-block;
        background-color: rgba(255, 255, 255, 0.8);
        flex-grow: 1;
        padding: 1.5rem;
        overflow-y: auto;
      }

      &.hide {
        margin-left: -38px;
      }

      &.show {
        margin-left: -35%;
      }

      #side-panel-toggle {
        position: relative;
        margin-top: 10%;
        width: 39px;
      }
    }

    #trip-cards {
      flex-wrap: wrap;
      justify-content: space-between;
      margin-bottom: 2rem;

      ::ng-deep p-card {
        margin: 0.5rem;
        width: 28%;
        height: 25%;
        text-align: center;
        border-radius: 5px;

        .p-card-title {
          font-size: .6rem;
          background-color: lightgray;
          margin: -1rem;
          padding: .5rem 0;
          border-radius: 5px 5px 0 0;
        }
      }
    }

    #trips-timeline {
      overflow-y: auto;
      height: 60%;

      ::ng-deep {
        .p-timeline-event-opposite {
          display: none;
        }

        .p-timeline-event-separator {
          min-width: 32px;
        }
      }
    }
  `]
})
export class TripMapComponent {
  private _tripData: TripEventsDTO | null = null;

  protected showSidePanel = true;
  protected showTimeline = false;

  private map: L.Map | null = null;
  private featureGroup: L.FeatureGroup = L.featureGroup();

  constructor(
    protected tripsService: TripsService
  ) {
  }

  @Input() set tripData(tripEventsDTO: TripEventsDTO | null) {
    if (!tripEventsDTO) {
      return;
    }
    console.log(tripEventsDTO);
    this._tripData = tripEventsDTO;

    // init map
    if (this.map) {
      this.featureGroup.clearLayers();
    } else {
      this.map = L.map('map', {
        attributionControl: false,
        zoomControl: false
      }).setView([tripEventsDTO.tripEvents[0].lat ?? 0, tripEventsDTO.tripEvents[0].lng ?? 0], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
    }

    tripEventsDTO?.tripEvents?.forEach(tripEvent => {

      // todo : use full marker creation
      if (tripEvent.eventType !== TripEventType.TRIP && tripEvent.lat !== null && tripEvent.lng !== null) {
        new CustomMarkerImpl([tripEvent.lat, tripEvent.lng])
          .setIcon(this.getIcon(tripEvent.eventType, tripEvent.color))
          .addTo(this.featureGroup)
          .bindPopup(
            `<b>${tripEvent.poiLabel || 'Arrêt'}</b><br>${tripEvent.address}<br>${tripEvent.start?.toLocaleTimeString()} - ${tripEvent.end?.toLocaleTimeString()}`
          );
      }

      // add trace to map
      if (tripEvent.eventType === TripEventType.TRIP && tripEvent.trace) {
        const geoJSON = WKTParse(tripEvent.trace);
        if (geoJSON === null || geoJSON.type !== 'LineString') {
          alert('Erreur lors de la récupération de la trace')
          return
        }

        L.geoJson(geoJSON,
          {style: {color: tripEvent.color || 'blue'}}
        ).addTo(this.featureGroup);
      }
    });

    // set page up and zoom
    this.featureGroup.addTo(this.map);
    this.showTimeline = true;
    this.map.fitBounds(this.featureGroup.getBounds());
  }

  get tripData(): TripEventsDTO | null {
    return this._tripData;
  }

  onTripEventMouseEnter(event: TripEventDTO): void {
    let layer = this.featureGroup.getLayers()[event.index]
    if (event.eventType === TripEventType.TRIP && layer instanceof L.GeoJSON) {
      layer.setStyle({fillColor: 'blue', weight: 5});
    } else if (layer instanceof L.Marker) {
      layer.getElement()?.classList.add('highlighted-marker');
    }
  }

  onTripEventMouseLeave(event: TripEventDTO): void {
    let layer = this.featureGroup.getLayers()[event.index]
    if (event.eventType === TripEventType.TRIP && layer instanceof L.GeoJSON) {
      layer.setStyle({fillColor: 'blue', weight: 3});
    } else if (layer instanceof L.Marker) {
      layer.getElement()?.classList.remove('highlighted-marker');
    }
  }

  onTripEventClick(event: TripEventDTO): void {
    let layer = this.featureGroup.getLayers()[event.index]
    if (layer instanceof L.Marker) {
      layer.openPopup();
    }
  }

  private getIcon(eventType: TripEventType.STOP | TripEventType.VEHICLE_RUNNING | TripEventType.VEHICLE_IDLE, color: string | null): L.DivIcon {
    switch (eventType) {
      case TripEventType.STOP:
        return L.divIcon({
          html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="30px" height="45px" fill="${color || 'black'}">
                  <path fill-rule="evenodd" d="M24,4.5A14.82,14.82,0,0,0,9.18,19.32h0c0,.34,0,.68,0,1v.08C9.78,28.52,16.52,35.05,24,43.5,31.81,34.68,38.82,28,38.82,19.32h0A14.82,14.82,0,0,0,24,4.5Zm0,7.7a7.13,7.13,0,1,1-7.13,7.12A7.13,7.13,0,0,1,24,12.2Z" />
                </svg>`,
          /*iconSize: [30, 45],*/
          iconAnchor: [15, 45],
          className: 'custom-poi-icon',
        });
      case TripEventType.VEHICLE_RUNNING:
        return MarkerFactory.getVehicleIcon({
          device: {state: 'MOVING'},
          category: {label: 'vgp'}
        });
      case TripEventType.VEHICLE_IDLE:
        return MarkerFactory.getVehicleIcon({
          device: {state: 'OFF'},
          category: {label: 'vgp'}
        })
    }
  }

  protected readonly TripEventType = TripEventType;
}
