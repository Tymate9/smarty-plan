import {Component,OnInit,ViewContainerRef} from '@angular/core';
import * as L from 'leaflet';
import {EntityType, MarkerFactory} from './MarkerFactory';
import {vehicleDTO} from "../../../habarta/custom";
import {MapPopupComponent} from "./popUp/map-popup/map-popup.component";
import {PoiService} from "../POI/poi.service";

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
  private crossMarker?: L.Marker;

  constructor(private readonly viewContainerRef: ViewContainerRef,
              private readonly poiService: PoiService,
              private readonly markerFactory: MarkerFactory) {
  }

  ngOnInit(): void {
    this.initMap();
    this.loadPOIs();
    this.loadVehicles();
  }

  private initMap(): void {
    const normandyCoordinates: L.LatLngExpression = [49.1829, -0.3707];
    this.map = L.map('map').setView(normandyCoordinates, 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      this.showPopup(e.latlng.lat, e.latlng.lng);
    });
  }

  private showPopup(lat: number, lng: number): void {
    const container = L.DomUtil.create('div');

    // Crée et injecte le composant Angular dans le conteneur
    const componentRef = this.viewContainerRef.createComponent(MapPopupComponent);
    componentRef.instance.latitude = lat;
    componentRef.instance.longitude = lng;
    componentRef.instance.addPOIRequest.subscribe((coords) => {
      this.resetCrossMarker();
      this.zoomToLocation(coords.lat, coords.lng);
    });
    componentRef.instance.buttonClick.subscribe(() => this.resetCrossMarker());
    componentRef.instance.poiCreated.subscribe((poi) => this.onPoiCreated(poi));
    componentRef.instance.closePopup.subscribe(() => {
      this.map.closePopup();
      this.resetCrossMarker();
      componentRef.destroy();
    });

    // Ajoute le composant Angular dans le conteneur DOM
    container.appendChild((componentRef.hostView as any).rootNodes[0]);

    // Crée la popup Leaflet et ajoute le conteneur
    L.popup()
      .setLatLng([lat, lng])
      .setContent(container)
      .openOn(this.map);

    // Nettoie le composant et réinitialise la croix quand la popup est fermée
    this.map.on('popupclose', () => {
      componentRef.destroy();
      this.resetCrossMarker();
    });
  }

  private zoomToLocation(lat: number, lng: number): void {
    this.map.setView([lat, lng], this.map.getMaxZoom());

    // Dessiner une croix rouge
    if (this.crossMarker) this.map.removeLayer(this.crossMarker);

    this.crossMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div style="color: red; font-size: 24px;">✚</div>`,
        iconSize: [24, 24],
        className: 'cross-marker',
      }),
      interactive: false,
    }).addTo(this.map);
  }

  private resetCrossMarker(): void {
    if (this.crossMarker) {
      this.map.removeLayer(this.crossMarker);
      this.crossMarker = undefined;
    }
  }

  private loadPOIs(): void {
    this.poiService.getAllPOIs().subscribe({
      next: (pois) => {
        pois.forEach(poi =>
          this.markerFactory.createMarker(EntityType.POI, poi, this.map, this.viewContainerRef)
        );
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des POI:', error);
      }
    });
  }

  private loadVehicles(): void {
    // Liste en dur pour simuler les véhicules
    const vehicles: vehicleDTO[] = [
      {
        id: '1',
        serialNumber: 'ABC123',
        adresse: '123 Rue de Paris',
        driverName: 'John Doe',
        coordinate: {
          type: 'Point',
          coordinates: [2.3522, 48.8566]
        }
      },
      {
        id: '2',
        serialNumber: 'DEF456',
        adresse: '456 Rue de Lyon',
        driverName: 'Jane Doe',
        coordinate: {
          type: 'Point',
          coordinates: [4.8357, 45.7640]
        }
      },
      {
        id: '3',
        serialNumber: 'GHI789',
        adresse: '789 Rue de Marseille',
        driverName: 'Jack Smith',
        coordinate: {
          type: 'Point',
          coordinates: [5.3698, 43.2965]
        }
      }
    ];

    // Simule l'affichage des véhicules
    vehicles.forEach(vehicle => this.markerFactory.createMarker(EntityType.VEHICLE, vehicle, this.map, this.viewContainerRef));
  }

  private onPoiCreated(poi: any): void {
    this.markerFactory.createMarker(EntityType.POI, poi, this.map, this.viewContainerRef);
  }
}

