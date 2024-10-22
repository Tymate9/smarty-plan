import {Component, AfterViewInit, OnInit} from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import {dto} from '../../../habarta/dto'

@Component({
  selector: 'app-map',
  template: `
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossorigin=""/>
    <div id="map"></div>
  `,
  styles: [`
    #map {
      height: 100vh;
      width: 100%;
    }
  `]
})
export class MapComponent implements OnInit {

  private map!: L.Map;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.initMap();
    this.loadPOIs();
  }

  private initMap(): void {
    // Initialiser la carte et la centrer sur la Normandie
    const normandyCoordinates: L.LatLngExpression = [49.1829, -0.3707]; // Coordonnées approximatives de la Normandie
    this.map = L.map('map').setView(normandyCoordinates, 8);

    // Ajouter une couche de tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
  }

  private loadPOIs(): void {
    const apiUrl = 'http://localhost:8080/poi'; // Exemple d'URL

    this.http.get<dto.PointOfInterestEntity[]>(apiUrl, { responseType: 'json'}).subscribe({
      next: (pois) => {
        pois.forEach(poi => this.addMarker(poi));
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des POI:', error);
      }
    });
  }

  private addMarker(poi: dto.PointOfInterestEntity): void {
    var customIcon = new L.DivIcon({html : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill='+poi.category.color+' class="size-6">\n' +
        '  <path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />\n' +
        '</svg>'})
    const marker = L.marker([poi.latitude, poi.longitude], {icon : customIcon}).addTo(this.map)
      .bindPopup(`<b>${poi.label}</b><br>Type: ${poi.category.label}<br>Rayon: ${poi.radius}m`);

    if (poi.radius > 0) {
      L.circle([poi.latitude, poi.longitude], {
        color: 'blue',
        fillColor: '#blue',
        fillOpacity: 0.2,
        radius: poi.radius
      }).addTo(this.map);
    }
  }
}

