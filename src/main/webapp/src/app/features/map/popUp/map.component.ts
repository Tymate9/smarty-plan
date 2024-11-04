import {Component,OnInit,ViewContainerRef} from '@angular/core';
import * as L from 'leaflet';
import {EntityType} from '../../../core/MarkerFactory';
import {PoiService} from "../../poi/poi.service";
import {VehicleService} from "../../vehicle/vehicle.service";
import {dto} from "../../../../habarta/dto";
import 'leaflet.markercluster';
import {MapManager} from "../../../core/map.manager";


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
  clusterPOIGroup: L.MarkerClusterGroup;
  clusterVehicleGroup : L.MarkerClusterGroup;
  protected unTrackedVehicle : String = "Liste des véhicules non-géolocalisés : "

  constructor(private readonly viewContainerRef: ViewContainerRef,
              private readonly poiService: PoiService,
              private readonly vehicleService: VehicleService) {}

  ngOnInit(): void {
    this.initMap();
    this.loadPOIs();
    this.loadVehicles();
    this.clusterPOIGroup = L.markerClusterGroup({
      iconCreateFunction: () => {return L.icon({
        iconUrl: `../../assets/icon/poiCluster.svg`,
        iconSize: [30, 45],
        iconAnchor: [15, 45],
      })},
      animate: true,
      zoomToBoundsOnClick: true,
    });
    this.clusterPOIGroup.on('clustermouseover', function (cluster){
      console.log(cluster.layer.getAllChildMarkers().length)
    })
    this.map.addLayer(this.clusterPOIGroup);
    this.clusterVehicleGroup = L.markerClusterGroup({
      iconCreateFunction: () => {return L.icon({
        iconUrl: `../../assets/icon/vehicleCluster.svg`,
        iconSize: [30, 45],
        iconAnchor: [15, 45],
      })},
      animate: true,
      zoomToBoundsOnClick: true,
    });
    this.map.addLayer(this.clusterVehicleGroup);
  }

  private initMap(): void {
    const normandyCoordinates: L.LatLngExpression = [49.1829, -0.3707];
    this.map = L.map('map', {attributionControl: false}).setView(normandyCoordinates, 8);
    this.mapManager = new MapManager(this.map, this.viewContainerRef);

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
            const marker = this.mapManager.addMarker(EntityType.POI, poi)
/*            if (marker !== null) {
              this.clusterPOIGroup.addLayer(marker);
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
            const marker = this.mapManager.addMarker(EntityType.VEHICLE, vehicle);
/*            if (marker !== null) {
              this.clusterVehicleGroup.addLayer(marker);
            }*/
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

