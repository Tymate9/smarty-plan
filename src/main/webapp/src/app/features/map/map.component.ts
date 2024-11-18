import {Component,OnInit,ViewContainerRef} from '@angular/core';
import * as L from 'leaflet';
import {EntityType} from '../../core/cartography/marker/MarkerFactory';
import {PoiService} from "../poi/poi.service";
import {VehicleService} from "../vehicle/vehicle.service";
import {dto} from "../../../habarta/dto";
import 'leaflet.markercluster';
import {MapManager} from "../../core/cartography/map/map.manager";
import {GeocodingService} from "../../commons/geo/geo-coding.service";


@Component({
  selector: 'app-map',
  template: `
    <p>{{unTrackedVehicle}}</p>
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
  private mapManager : MapManager;
  protected unTrackedVehicle : String = "Liste des véhicules non-géolocalisés : "

  constructor(private readonly viewContainerRef: ViewContainerRef,
              private readonly poiService: PoiService,
              private readonly vehicleService: VehicleService,
              private readonly geoCodingService: GeocodingService) {}

  ngOnInit(): void {
    this.initMap();
    this.loadPOIs();
    this.loadVehicles();

  }

  private initMap(): void {
    const normandyCoordinates: L.LatLngExpression = [49.1829, -0.3707];
    this.map = L.map('map', {attributionControl: false}).setView(normandyCoordinates, 8);
    this.map.setMaxZoom(18);
    this.mapManager = new MapManager(this.map, this.viewContainerRef, this.geoCodingService);
    //Todo(Ajouter au mapmgm)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      this.mapManager.showPopup(e.latlng.lat, e.latlng.lng);
    });
  }

  private loadPOIs(): void {
    this.poiService.getAllPOIs().subscribe({
      next: (pois) => {
        pois.forEach(poi =>
          {
            this.mapManager.addMarker(EntityType.POI, poi)
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
            this.mapManager.addMarker(EntityType.VEHICLE, vehicle);
          }
          else {
              this.unTrackedVehicle += `${vehicle.licenseplate} /// `
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des véhicules:', error);
      }
    });
  }

}

