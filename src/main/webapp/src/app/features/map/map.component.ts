import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  template: `
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            crossorigin=""></script>
    <div id="map"></div>
  `,
  styles: [`
    #map {
      height: 100vh;
      width: 100%;
    }
  `]
})
export class MapComponent implements AfterViewInit {

  constructor() { }

  ngAfterViewInit(): void {
    // Initialiser la carte et la centrer sur Paris
    const map = L.map('map').setView([49.4404591, 1.0939658], 13);

    // Ajouter une couche de tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Ajouter un marqueur sur Paris
    const marker = L.marker([49.440448, 1.104829]).addTo(map)
      .bindPopup('<b>Chez moi</b>')
      .openPopup();

    const marker2 = L.marker([49.443172454833984, 1.0925747156143188]).addTo(map)
      .bindPopup('<b>Le/La Môme</b><br>Pour se détendre.')
      .openPopup();

    // Optionnel : Ajouter un cercle autour du marqueur
    const circle = L.circle([49.4404591, 1.0939658], {
      color: 'blue',
      fillColor: '#blue',
      fillOpacity: 0.2,
      radius: 500
    }).addTo(map);
  }
}
