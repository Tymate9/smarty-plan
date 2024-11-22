import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import * as L from 'leaflet';
import {TripsService} from './trips.service';
import {dto} from "../../../habarta/dto";
import TripDTO = dto.TripDTO;
import {parse as WKTParse} from "wellknown" ;

@Component({
  selector: 'app-trip',
  template: `
    <div class="flex">
      <div id="map" class="w-3/4 h-screen"></div>
      <div class="drawer drawer-end w-1/4 h-screen bg-gray-100 p-4">
        <h2 class="text-xl font-bold mb-4">Détails du trajet {{ tripId }}</h2>
        <div *ngIf="trip">
          <p><strong>Start Date:</strong> {{ trip.startDate }}</p>
          <p><strong>Start POI/Address:</strong> {{ trip.poiAtStart?.label ?? trip.addressAtStart }} </p>
          <p><strong>End Date:</strong> {{ trip.endDate }}</p>
          <p><strong>End POI/Address:</strong> {{ trip.poiAtEnd?.label ?? trip.addressAtEnd }}</p>
          <p><strong>Distance:</strong> {{ trip.distance }} km</p>
          <p><strong>Duration:</strong> {{ trip.duration }} s</p>
          <p><strong>Data Points:</strong> {{ trip.datapoints }}</p>
        </div>
        <div *ngIf="!trip">
          <p>Chargement des détails du trajet...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    #map {
      width: 100%;
      height: 500px;
    }
  `]
})
export class TripComponent implements OnInit {
  @Input()
  tripId: string = '';
  trip: TripDTO | null = null;
  map: L.Map | null = null;

  constructor(
    private route: ActivatedRoute,
    private tripsService: TripsService
  ) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.tripId = params.get('tripId') || '';
      this.loadTrip();
    });
  }

  loadTrip(): void {
    this.tripsService.getTripById(this.tripId).subscribe({
      next: (data) => {
        console.log(data);
        this.trip = data;
        this.initMap();
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du trajet:', error);
      }
    });
  }

  initMap(): void {
    if (this.trip && this.trip.wktTrace) {
      const geoJSON = WKTParse(this.trip.wktTrace);
      if (geoJSON === null || geoJSON.type !== 'LineString') {
        alert('Erreur lors de la récupération de la trace')
        return
      }

      this.map = L.map('map').setView([geoJSON.coordinates[0][1], geoJSON.coordinates[0][0]], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      L.geoJson(geoJSON, {style: {fillColor: 'blue'}}).addTo(this.map);
    }
  }
}
