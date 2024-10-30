import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import {PoiService} from "../../poi/poi.service";
import {dto} from "../../../../habarta/dto";

@Component({
  selector: 'app-vehicle-popup',
  template: `
    <div>
      <div *ngIf="showVehicleInfo">
        <h4>{{ vehicle.licenseplate }}</h4>
        <p><strong>Conducteur:</strong> {{ vehicle.driver?.firstName + ' ' + vehicle.driver?.firstName || 'Aucun conducteur' }}</p>
        <p><strong>Équipe:</strong> {{ vehicle.team.label }}</p>
        <p><strong>Catégorie:</strong> {{ vehicle.category.label }}</p>
        <p><strong>Dernière communication:</strong> {{ vehicle.device.lastCommunicationDate | date:'short' }}</p>
      </div>

      <div *ngIf="!showVehicleInfo">
        <p>Liste des POIs les plus proches :</p>
        <ul>
          <li *ngFor="let poi of nearbyPOIs">
            {{ poi.poi.label }} - Distance : {{ poi.distance | number:'1.0-2' }} m
            <button type="button" (click)="centerMapOnPOI(poi.poi)">Centrer sur ce POI</button>
          </li>
        </ul>
      </div>
      <button type="button" (click)="togglePOIList()">Afficher les POIs les plus proches</button>
    </div>
  `,
})
export class VehiclePopupComponent implements OnInit {
  @Input() vehicle: dto.VehicleSummaryDTO;
  @Output() centerOnPOI = new EventEmitter<[number, number]>();

  showVehicleInfo = true;
  nearbyPOIs: any[] = [];

  constructor(private poiService: PoiService) {}

  ngOnInit() {
    const latitude = this.vehicle.device.coordinate?.coordinates[1] ?? 0.0;
    const longitude = this.vehicle.device.coordinate?.coordinates[0] ?? 0.0;

    this.poiService.getNearestPOIsWithDistance(latitude, longitude, 5).subscribe({
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

  togglePOIList() {
    this.showVehicleInfo = !this.showVehicleInfo;
  }

  centerMapOnPOI(poi: any) {
    const coordinates = poi.coordinate.coordinates;
    this.centerOnPOI.emit(coordinates);
  }
}
