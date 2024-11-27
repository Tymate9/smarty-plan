import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import * as L from 'leaflet';
import {TripEvent, TripsService} from './trips.service';
import {dto} from "../../../habarta/dto";
import TripMapDTO = dto.TripMapDTO;
import {parse as WKTParse} from "wellknown" ;
import {CustomMarkerImpl} from "../../core/cartography/marker/MarkerFactory";

@Component({
  selector: 'app-trip',
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
          <div *ngIf="tripMap" id="trip-cards" class="flex">
            <p-card header="Amplitude">
              <p>{{ tripsService.formatDuration(tripMap.range) }}</p>
            </p-card>
            <p-card header="Arrêt">
              <p>{{ tripsService.formatDuration(tripMap.stopDuration) }}</p>
            </p-card>
            <p-card header="Conduite">
              <p>{{ tripsService.formatDuration(tripMap.drivingDuration) }}</p>
            </p-card>
            <p-card header="Nb de trajets">
              <p>{{ tripMap.tripAmount }}</p>
            </p-card>
            <p-card header="Distance totale">
              <p>{{ tripMap.drivingDistance }} Km</p>
            </p-card>
            <p-card header="Nb de POI visités">
              <p>{{ tripMap.poiAmount }}</p>
            </p-card>
          </div>
          <p-timeline [value]="tripEvents" id="trips-timeline" *ngIf="tripEventsVisible">
            <ng-template pTemplate="marker" let-event>
              <span *ngIf="event.eventType === 'stop'"
                    class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
                    [style]="{ 'background-color': event.color }">
                      <i class="pi pi-map-marker"></i>
              </span>
            </ng-template>
            <ng-template pTemplate="content" let-event>
              <div
                *ngIf="event.eventType === 'trip'"
                (mouseenter)="onTripEventMouseEnter(event)"
                (mouseleave)="onTripEventMouseLeave(event)"
              > {{ event.duration }} : {{ event.start }}
                -> {{ event.end }} {{ event.distance }}
              </div>
              <div
                class="p-3 bg-black-alpha-20 border-round cursor-pointer"
                *ngIf="event.eventType === 'stop'"
                (mouseenter)="onTripEventMouseEnter(event)"
                (mouseleave)="onTripEventMouseLeave(event)"
                (click)="onTripEventClick(event)"
              > {{ event.address }} : {{ event.start }}
                -> {{ event.end }}
              </div>
            </ng-template>
          </p-timeline>
          <div *ngIf="!tripMap">
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
      position: relative;
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
export class TripMapComponent implements OnInit {
  @Input()
  vehicleId: string = '';
  @Input()
  date: string = '';

  protected showSidePanel = true;
  protected tripEventsVisible = false;

  protected tripMap: TripMapDTO | null = null;
  protected tripEvents: TripEvent[] = [];

  private map: L.Map | null = null;
  private featureGroup: L.FeatureGroup = L.featureGroup();

  constructor(
    private route: ActivatedRoute,
    protected tripsService: TripsService
  ) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.date = params.get('date') || '';
      this.vehicleId = params.get('vehicleId') || '';
      this.loadTrip();
    });
  }

  loadTrip(): void {
    this.tripsService.getTripByDateAndVehicle(this.vehicleId, this.date).subscribe({
      next: (data) => {
        this.tripMap = data;
        this.initMap();
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du trajet:', error);
      }
    });
  }

  initMap(): void {
    if (this.tripMap == null) return

    // init map
    this.map = L.map('map', {attributionControl: false}).setView([this.tripMap.trips[0].startLat, this.tripMap.trips[0].startLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.tripMap?.trips?.forEach((trip, index) => {
      // add trip to timeline
      this.tripEvents.push({
        index: index * 2,
        eventType: 'stop',
        start: trip?.lastTripEnd?.toLocaleTimeString() || trip.startDate.toLocaleTimeString(),
        end: trip?.lastTripEnd && trip.startDate.toLocaleTimeString(),
        distance: null,
        duration: null,
        address: trip.poiAtStart?.label || trip.addressAtStart || 'Adresse inconnue',
        color: trip.poiAtStart?.category.color || 'black'
      }, {
        index: index * 2 + 1,
        eventType: 'trip',
        start: trip.startDate.toLocaleTimeString(),
        end: trip.endDate.toLocaleTimeString(),
        distance: trip.distance ? `${trip.distance} km` : null,
        duration: trip.duration ? this.tripsService.formatDuration(trip.duration) : null,
        address: null,
        color: null
      })

      // add start marker
      new CustomMarkerImpl([trip.startLat, trip.startLng]).setIcon(
        L.divIcon({
          html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="30px" height="45px" fill="${trip.poiAtStart?.category.color || 'black'}">
                  <path fill-rule="evenodd" d="M24,4.5A14.82,14.82,0,0,0,9.18,19.32h0c0,.34,0,.68,0,1v.08C9.78,28.52,16.52,35.05,24,43.5,31.81,34.68,38.82,28,38.82,19.32h0A14.82,14.82,0,0,0,24,4.5Zm0,7.7a7.13,7.13,0,1,1-7.13,7.12A7.13,7.13,0,0,1,24,12.2Z" />
                </svg>`,
          /*iconSize: [30, 45],*/
          iconAnchor: [15, 45],
          className: 'custom-poi-icon',
        })
      ).addTo(this.featureGroup).bindPopup(
        `<b>${trip.poiAtStart?.label || trip.addressAtStart}</b><br>${trip.startDate.toLocaleTimeString()}`
      );

      // add trace to map
      if (trip.wktTrace) {
        const geoJSON = WKTParse(trip.wktTrace);
        if (geoJSON === null || geoJSON.type !== 'LineString') {
          alert('Erreur lors de la récupération de la trace')
          return
        }

        L.geoJson(geoJSON, {style: {fillColor: 'blue'}}).addTo(this.featureGroup);
      }
    });

    // add end marker
    const lastTrip = this.tripMap.trips[this.tripMap.trips.length - 1];
    new CustomMarkerImpl([lastTrip.endLat, lastTrip.endLng]).setIcon(
      L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="30px" height="45px" fill="${this.tripMap.poiAtEnd?.category.color || 'black'}">
                  <path fill-rule="evenodd" d="M24,4.5A14.82,14.82,0,0,0,9.18,19.32h0c0,.34,0,.68,0,1v.08C9.78,28.52,16.52,35.05,24,43.5,31.81,34.68,38.82,28,38.82,19.32h0A14.82,14.82,0,0,0,24,4.5Zm0,7.7a7.13,7.13,0,1,1-7.13,7.12A7.13,7.13,0,0,1,24,12.2Z" />
                </svg>`,
        /*iconSize: [30, 45],*/
        iconAnchor: [15, 45],
        className: 'custom-poi-icon',
      })
    ).addTo(this.featureGroup).bindPopup(
      `<b>${this.tripMap.poiAtEnd?.label || this.tripMap.addressAtEnd}</b><br>${lastTrip.endDate.toLocaleTimeString()}`
    );

    // add last stop to timeline
    this.tripEvents.push({
      index: this.tripEvents.length,
      eventType: 'stop',
      start: null,
      end: lastTrip.endDate.toLocaleTimeString(),
      distance: null,
      duration: null,
      address: this.tripMap.poiAtEnd?.label || this.tripMap.addressAtEnd || 'Adresse inconnue',
      color: this.tripMap.poiAtEnd?.category.color || 'black'
    })

    // set page up and zoom
    this.tripEventsVisible = true;
    this.featureGroup.addTo(this.map);
    this.map.fitBounds(this.featureGroup.getBounds());
  }

  onTripEventMouseEnter(event: TripEvent): void {
    let layer = this.featureGroup.getLayers()[event.index]
    if (event.eventType === 'trip' && layer instanceof L.GeoJSON) {
      layer.setStyle({fillColor: 'blue', weight: 5});
    }
    if (event.eventType === 'stop' && layer instanceof L.Marker) {
      layer.getElement()?.classList.add('highlighted-marker');
    }
  }

  onTripEventMouseLeave(event: TripEvent): void {
    let layer = this.featureGroup.getLayers()[event.index]
    if (event.eventType === 'trip' && layer instanceof L.GeoJSON) {
      layer.setStyle({fillColor: 'blue', weight: 3});
    }
    if (event.eventType === 'stop' && layer instanceof L.Marker) {
      layer.getElement()?.classList.remove('highlighted-marker');
    }
  }

  onTripEventClick(event: TripEvent): void {
    let layer = this.featureGroup.getLayers()[event.index]
    if (layer instanceof L.Marker) {
      layer.openPopup();
    }
  }
}
