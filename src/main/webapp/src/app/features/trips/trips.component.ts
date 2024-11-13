import {Component, Input, OnInit} from '@angular/core';
import { TripsService } from './trips.service';
import {dto} from "../../../habarta/dto";
import TripDTO = dto.TripDTO;

@Component({
  selector: 'app-trips',
  template: `
    <div>
      <h2>Trajets pour le véhicule {{ vehicleId }}</h2>
      <table>
        <thead>
          <tr>
            <th>ID du trajet</th>
            <th>Date de calcul</th>
            <th>Date de début</th>
            <th>Date de fin</th>
            <th>Distance (km)</th>
            <th>Durée (s)</th>
            <th>Points de données</th>
            <th>Coordonnées de départ</th>
            <th>Coordonnées d'arrivée</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let trip of trips">
            <td>{{ trip.tripId }}</td>
            <td>{{ trip.computeDate }}</td>
            <td>{{ trip.startDate }}</td>
            <td>{{ trip.endDate }}</td>
            <td>{{ trip.distance }}</td>
            <td>{{ trip.duration }}</td>
            <td>{{ trip.datapoints }}</td>
            <td>{{ trip.startLng }}, {{ trip.startLat }}</td>
            <td>{{ trip.endLng }}, {{ trip.endLat }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }
    th {
      background-color: #f2f2f2;
    }
  `]
})
export class TripsComponent implements OnInit {
  @Input()
  vehicleId = '1'; // Exemple d'ID de véhicule, remplacer par la logique réelle pour obtenir l'ID du véhicule
  trips: TripDTO[] = [];

  constructor(private tripsService: TripsService) {}

  ngOnInit(): void {
    this.tripsService.getTripsByVehicle(this.vehicleId).subscribe({
      next: (data) => {
        this.trips = data;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des trajets:', error);
      }
    });
  }
}
