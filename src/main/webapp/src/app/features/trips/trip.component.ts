import {Component, Input, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { TripsService } from './trips.service';
import {dto} from "../../../habarta/dto";
import TripDTO = dto.TripDTO;

@Component({
  selector: 'app-trip',
  template: `
    <div>
      <h2>Trace du trajet pour l'ID {{ tripId }}</h2>
      <div id="map" style="height: 500px;"></div>
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
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.tripId = params.get('tripId') || '';
      this.loadTrip();
    });
  }

  loadTrip(): void {
    this.tripsService.getTripById(this.tripId).subscribe({
      next: (data) => {
        this.trip = data;
        this.initMap();
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du trajet:', error);
      }
    });
  }

  initMap(): void {
    if (this.trip && this.trip.trace) {
      const traceCoordinates = this.trip.trace.split(';').map(coord => {
        const [lng, lat] = coord.split(',').map(Number);
        return [lat, lng] as [number, number];
      });

      this.map = L.map('map').setView(traceCoordinates[0], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      L.polyline(traceCoordinates, { color: 'blue' }).addTo(this.map);
    }
  }
}
