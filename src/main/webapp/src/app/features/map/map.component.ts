import {Component, OnDestroy, OnInit, ViewContainerRef} from '@angular/core';
import * as L from 'leaflet';
import {EntityType} from '../../core/cartography/marker/MarkerFactory';
import {PoiService} from "../poi/poi.service";
import {VehicleService} from "../vehicle/vehicle.service";
import {dto} from "../../../habarta/dto";
import 'leaflet.markercluster';
import { interval, Subscription } from 'rxjs';
import {MapManager} from "../../core/cartography/map/map.manager";
import {GeocodingService} from "../../commons/geo/geo-coding.service";
import {FilterService} from "../../commons/navbar/filter.service";
import {LayerEvent, LayerEventType} from "../../core/cartography/layer/layer.event";
import {NotificationService} from "../../commons/notification/notification.service";


@Component({
  selector: 'app-map',
  template: `
<!--    <p>{{unTrackedVehicle}}</p>-->
    <button (click)="refreshVehiclePositions()">Mettre à jour les positions</button>
    <div id="map"></div>
  `,
  styles: [`
    #map {
      height: 100vh;
      width: 100%;
    }
  `]
})
export class MapComponent implements OnInit, OnDestroy {

  private map!: L.Map;
  private mapManager : MapManager;
  protected unTrackedVehicle : String = "Liste des véhicules non-géolocalisés : "
  private filters : { agencies : string[], vehicles : string[], drivers : string[] };
  private updateSubscription?: Subscription;
  private filterSubscription?: Subscription;

  constructor(private readonly viewContainerRef: ViewContainerRef,
              private readonly poiService: PoiService,
              private readonly vehicleService: VehicleService,
              private readonly geoCodingService: GeocodingService,
              private readonly filterService:FilterService,
              private readonly notificationService: NotificationService) {}

  ngOnInit(): void {
    this.initMap();
    this.loadPOIs();
    this.filterSubscription = this.subscribeToFilterChanges();
    this.updateSubscription = this.startVehiclePositionUpdater();
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
    this.updateSubscription?.unsubscribe();
  }

  private initMap(): void {
    const normandyCoordinates: L.LatLngExpression = [49.1829, -0.3707];
    this.map = L.map('map', {attributionControl: false}).setView(normandyCoordinates, 9);
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

  private subscribeToFilterChanges(): Subscription {
    return this.filterService.filters$.subscribe(filters => {
      this.filters = filters as { agencies : string[], vehicles : string[], drivers : string[] };

      // Call getFilteredVehicles each time filters change
      this.vehicleService.getFilteredVehicles(this.filters.agencies, this.filters.vehicles, this.filters.drivers)
        .subscribe(filteredVehicles => {

          // Handle the filtered vehicles here, for example by updating the map markers
          this.displayFilteredVehiclesOnMap(filteredVehicles);
        });
    });
  }

  private displayFilteredVehiclesOnMap(vehicles: dto.VehicleSummaryDTO[]): void {

   // this.mapManager.deleteMarkers();
    const event : LayerEvent = {
      type : LayerEventType.DeleteAllMarkers,
        payload: {
          markerType :'vehicle'
        }
    }
    this.mapManager.handleLayerEvent(event,null)

    // Reset unTrackedVehicle list for each filter change
    this.unTrackedVehicle = "Liste des véhicules non-géolocalisés : ";

    // Display new markers on the map based on the filtered vehicles
    vehicles.forEach(vehicle => {

      if (vehicle.device && vehicle.device.coordinate) {

        const marker = this.mapManager.addMarker(EntityType.VEHICLE, vehicle);
      }
      else {
        this.unTrackedVehicle += `${vehicle.licenseplate} /// `
      }
    });

  }

  private startVehiclePositionUpdater(): Subscription {
    // Créer un intervalle qui émet toutes les 5 minutes (300000 ms)
    return interval(300000).subscribe(() => {
      this.updateVehiclePositions();
    });
  }

  private updateVehiclePositions(): void {
    this.vehicleService.getFilteredVehicles(this.filters.agencies, this.filters.vehicles, this.filters.drivers, "LOCALIZATION").subscribe({
      next: (filteredLocalizations: dto.VehicleLocalizationDTO[]) => {
        filteredLocalizations.forEach((result: dto.VehicleLocalizationDTO) => {
          const markerId = `vehicle-${result.id}`;
          const event: LayerEvent = {
            type: LayerEventType.UpdateMarkerPosition,
            payload: {
              id: markerId,
              entityType: EntityType.VEHICLE,
              newCoordinates: result.lastPosition,
            }
          };
          this.mapManager.handleLayerEvent(event, null);
        });
        // Afficher une notification de succès après la mise à jour
        this.notificationService.success('Mise à jour réussie', 'Les positions des véhicules ont été mises à jour.');
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour des positions des véhicules:', error);

        // Afficher une notification d'erreur
        this.notificationService.error('Erreur de mise à jour', 'Impossible de mettre à jour les positions des véhicules.');
      }
    });
  }

  refreshVehiclePositions(): void {
    // Arrêter le minuteur actuel
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    // Mettre à jour immédiatement les positions
    this.updateVehiclePositions();
    // Redémarrer le minuteur
    this.startVehiclePositionUpdater();
  }
}

