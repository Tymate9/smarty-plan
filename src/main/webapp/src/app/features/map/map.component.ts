import {Component,OnInit,ViewContainerRef} from '@angular/core';
import * as L from 'leaflet';
import {EntityType, MarkerFactory} from './MarkerFactory';
import {MapPopupComponent} from "./popUp/map-popup/map-popup.component";
import {PoiService} from "../poi/poi.service";
import {VehicleService} from "../vehicle/vehicle.service";
import {dto} from "../../../habarta/dto";
import 'leaflet.markercluster';


@Component({
  selector: 'app-map',
  template: `
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
  clusterGroup: L.MarkerClusterGroup;
  private crossMarker?: L.Marker;

  constructor(private readonly viewContainerRef: ViewContainerRef,
              private readonly poiService: PoiService,
              private readonly vehicleService: VehicleService,
              private readonly markerFactory: MarkerFactory) {
  }

  ngOnInit(): void {
    this.initMap();
    this.loadPOIs();
    this.loadVehicles();
/*    this.clusterGroup = L.markerClusterGroup();
    this.map.addLayer(this.clusterGroup);*/
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
    componentRef.instance.radiusChanged.subscribe((radius: number) => {
      this.updateCircleOnMap(lat, lng, radius);
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

      // Supprimer le cercle de la carte
      if (this.circleLayer) {
        this.map.removeLayer(this.circleLayer);
        this.circleLayer = null;
      }
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
          { const marker = this.markerFactory.createMarker(EntityType.POI, poi, this.map, this.viewContainerRef)
/*            if (marker !== null) {
              this.clusterGroup.addLayer(marker);
            }*/
          }
        );
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des POI:', error);
      }
    });
  }

  private loadVehicles(): void {
    this.vehicleService.getAllVehicles().subscribe({
      next: (vehicles: dto.VehicleSummaryDTO[]) => {
        vehicles.forEach(vehicle => {
          if (vehicle.device && vehicle.device.coordinate) {
            // Ajouter le véhicule à la carte
            console.log(vehicle)
            const marker = this.markerFactory.createMarker(EntityType.VEHICLE, vehicle, this.map, this.viewContainerRef);
/*            if (marker !== null) {
              this.clusterGroup.addLayer(marker);
            }*/
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des véhicules:', error);
      }
    });
  }

  private onPoiCreated(poi: any): void {
    this.markerFactory.createMarker(EntityType.POI, poi, this.map, this.viewContainerRef);
  }

  private circleLayer: L.Circle | null = null;

  private updateCircleOnMap(lat: number, lng: number, radius: number) {
    if (this.circleLayer) {
      // Mettre à jour le rayon du cercle existant
      this.circleLayer.setRadius(radius);
    } else {
      // Créer un nouveau cercle
      this.circleLayer = L.circle([lat, lng], {
        radius: radius,
        color: 'blue',
        fillColor: 'blue',
        fillOpacity: 0.2,
      }).addTo(this.map);
    }
    // Mettre à jour la position du cercle
    this.circleLayer.setLatLng([lat, lng]);
  }
}

