import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import * as L from 'leaflet';
import {TripEvent, TripsService} from './trips.service';
import {dto} from "../../../habarta/dto";
import TripMapDTO = dto.TripMapDTO;
import {parse as WKTParse} from "wellknown" ;

@Component({
  selector: 'app-trip',
  template: `
    <div id="trip-container">
      <div id="map"></div>
      <div id="side-panel" class="w-1/4 h-screen p-4 {{ showSidePanel ? 'show' : 'hide'}}">
        <p-toggleButton
          [(ngModel)]="showSidePanel"
          onIcon="pi pi-angle-left"
          offIcon="pi pi-angle-right"
          id="side-panel-toggle"
        />
        <div *ngIf="tripMap" id="trip-cards" class="flex">
          <p-card header="Amplitude">
            <p>{{ tripMap.range }}</p>
          </p-card>
          <p-card header="Arrêt">
            <p>{{ tripMap.stopDuration }}</p>
          </p-card>
          <p-card header="Conduite">
            <p>{{ tripMap.drivingDuration }}</p>
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
        <p-timeline [value]="tripEvents">
          <ng-template pTemplate="marker" let-event>
            @if(event.eventType === 'trip') {
            } @else {
            <span
              class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
              [style]="{ 'background-color': event.color }">
                    <i class="pi pi-map-marker"></i>
            </span>
            }
          </ng-template>
          <ng-template pTemplate="content" let-event>
            @if(event.eventType === 'trip') {
                <span> {{event.duration}} : {{ event.start }} -> {{ event.end }} {{event.distance}} </span>
            } @else {
                <span> {{ event.address }} : {{ event.start }} -> {{ event.end }} </span>
            }
          </ng-template>
        </p-timeline>
        <div *ngIf="!tripMap">
          <p>Chargement du détail des trajets...</p>
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
      z-index: 1000;
      width: 30%;
      overflow-x: hidden;
      background-color: rgba(255, 255, 255, 0.6);

      &.hide {
        margin-left: 0;
      }

      &.show {
        margin-left: -30%;
      }

      #side-panel-toggle {
        position: absolute;
        top: 10%;
        left: 0;
        transform: translateX(-100%);
        z-index: 1000;
      }
    }

    #trip-cards {
      flex-wrap: wrap;

      .p-card {
        margin: 0.5rem;
        width: 25%;
        height: 25%;
        text-align: center;
        .p-card-title {
          font-size: 1.2rem;
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

  showSidePanel = true;
  tripMap: TripMapDTO | null = null;
  map: L.Map | null = null;
  tripEvents: TripEvent[] = [];

  constructor(
    private route: ActivatedRoute,
    private tripsService: TripsService
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
        console.log(data);
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

    this.tripMap?.trips?.forEach((trip) => {
      // add trip to timeline
      this.tripEvents.push({
        eventType: 'stop',
        start: null,
        end: trip?.startDate?.toLocaleTimeString() || '',
        distance: null,
        duration: null,
        address: trip.poiAtStart?.label || trip.addressAtStart || 'Adresse inconnue',
        color: 'blue'
      }, {
        eventType: 'trip',
        start: trip.startDate.toLocaleTimeString(),
        end: trip.endDate.toLocaleTimeString(),
        distance: trip.distance ? `${trip.distance} km` : null,
        duration: trip.duration ? `${trip.duration / 60} min` : null,
        address: null,
        color: null
      })

      // add trace to map
      if (trip.wktTrace) {
        const geoJSON = WKTParse(trip.wktTrace);
        if (geoJSON === null || geoJSON.type !== 'LineString') {
          alert('Erreur lors de la récupération de la trace')
          return
        }

        L.geoJson(geoJSON, {style: {fillColor: 'blue'}}).addTo(this.map!!);
      }
    });

    // add last stop to timeline
    this.tripEvents.push({
      eventType: 'stop',
      start: this.tripMap.trips[this.tripMap.trips.length - 1].endDate.toLocaleTimeString(),
      end: null,
      distance: null,
      duration: null,
      address: this.tripMap.poiAtEnd?.label || this.tripMap.addressAtEnd || 'Adresse inconnue',
      color: 'blue'
    })
  }
}
