import {Component, OnDestroy, OnInit, ViewContainerRef} from '@angular/core';
import * as L from 'leaflet';
import {EntityType} from '../../core/cartography/marker/MarkerFactory';
import {PoiService} from "../poi/poi.service";
import {VehicleService} from "../vehicle/vehicle.service";
import {dto} from "../../../habarta/dto";
import 'leaflet.markercluster';
import {interval, Subscription} from 'rxjs';
import {MapManager} from "../../core/cartography/map/map.manager";
import {GeocodingService} from "../../commons/geo/geo-coding.service";
import {FilterService} from "../../commons/navbar/filter.service";
import {LayerEvent, LayerEventType} from "../../core/cartography/layer/layer.event";
import {NotificationService} from "../../commons/notification/notification.service";
import {TilesService} from "../../services/tiles.service";
import {Button} from "primeng/button";
import {NgClass, NgIf} from "@angular/common";
import {TeamService} from "../vehicle/team.service";
import {
  ScrollingInfoBannerComponent
} from "../../commons/app-scrolling-info-banner/app-scrolling-info-banner.component";


@Component({
  selector: 'app-map',
  template: `
    <app-scrolling-info-banner
      *ngIf="lunchPauseMessage"
      [text]="lunchPauseMessage"
      [scrollDuration]="20">
    </app-scrolling-info-banner>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <p-button
        label="Alerting véhicules"
        icon="{{ isCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up' }}"
        [raised]="true" severity="info"
        (onClick)="toggleDiv()"
        styleClass="custom-button-red">
      </p-button>
      <p-button label="Mettre à jour les positions" [raised]="true" severity="info" (click)="refreshVehiclePositions()"
                styleClass="custom-button-red"></p-button>
    </div>
    <div [ngClass]="{ 'hidden': isCollapsed }" class="collapsible-content">
      <p>{{ noComVehicle }}</p>
      <p>{{ unpluggedVehicle }}</p>
    </div>
    <div id="cartography-map"></div>
  `,
  standalone: true,
  imports: [
    Button,
    NgClass,
    ScrollingInfoBannerComponent,
    NgIf
  ],
  styles: [`
    #cartography-map {
      height: 87vh;
      width: 100%;
    }

    .hidden {
      display: none;
    }

    .collapsible-content {
      padding: 10px;
      border: 1px solid #ddd;
      background-color: var(--gray-100);
    }

    ::ng-deep .p-button.p-component.p-button-info.p-button-raised.custom-button-red {
      background-color: #aa001f !important;
      border-color: #aa001f !important;
      color: white !important;
      font-weight: 600;
    }
  `]
})
export class MapComponent implements OnInit, OnDestroy {

  private map!: L.Map;
  private mapManager: MapManager;
  protected noComVehicle: String = "Liste des véhicules non-communicant ou sans statut : "
  protected unpluggedVehicle: String = "Liste des véhicules dont le boitier est déconnecté : "
  private filters: { agencies: string[], vehicles: string[], drivers: string[] };
  isCollapsed: boolean = true;
  private updateSubscription?: Subscription;
  private filterSubscription?: Subscription;
  lunchPauseMessage: string = '';


  constructor(private readonly viewContainerRef: ViewContainerRef,
              private readonly poiService: PoiService,
              private readonly vehicleService: VehicleService,
              private readonly geoCodingService: GeocodingService,
              private readonly filterService: FilterService,
              private readonly tilesService: TilesService,
              private readonly notificationService: NotificationService,
              private readonly teamService: TeamService) {
  }

  ngOnInit(): void {
    this.initMap();
    this.loadPOIs();
    this.filterSubscription = this.subscribeToFilterChanges();
    this.updateSubscription = this.startVehiclePositionUpdater();
    this.loadLunchPauseMessage();
  }

  ngOnDestroy(): void {
    // Annule les souscriptions
    this.filterSubscription?.unsubscribe();
    this.updateSubscription?.unsubscribe();

    // IMPORTANT : retire la carte pour éviter "Map container is already initialized."
    if (this.map) {
      this.map.remove();
    }
  }

  private loadLunchPauseMessage() {
    const now = new Date();
    // Convertit l'heure courante en "HH:mm"
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeParam = `${hh}:${mm}`;

    this.teamService.getTeamsInPause(timeParam).subscribe({
      next: (message: string) => {
        // S'il est vide => on n'affiche pas le composant
        this.lunchPauseMessage = message.trim();
        // On pourrait logger ou gérer autrement
        console.log("Pause message: ", this.lunchPauseMessage);
      },
      error: (err) => {
        console.error("Erreur lors de la récupération du message de pause: ", err);
      }
    });
  }

  private initMap(): void {
    const normandyCoordinates: L.LatLngExpression = [49.1829, -0.3707];
    this.map = L.map('cartography-map', {zoomControl: true, zoomDelta:1}).setView(normandyCoordinates, 9);
    this.map.setMaxZoom(18);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    this.map.attributionControl.setPosition('bottomleft')
    // this.tilesService.getTileUrls().subscribe(tileUrls => {
    //   const baseLayers = {
    //     "Carte routière": L.tileLayer(tileUrls.roadmapUrl).on('tileerror', this.tilesService.onTileError),
    //     "Satellite": L.tileLayer(tileUrls.satelliteUrl).on('tileerror', this.tilesService.onTileError),
    //   };
    //
    //   L.control.layers(baseLayers, {}, {position: "bottomleft"}).addTo(this.map!);
    //
    //   baseLayers["Carte routière"].addTo(this.map!);
    // })

    this.map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      this.mapManager.showPopup(e.latlng.lat, e.latlng.lng);
    });
    this.mapManager = new MapManager(this.map, this.viewContainerRef, this.geoCodingService);
  }

  private loadPOIs(): void {
    this.poiService.getAllPOIs().subscribe({
      next: (pois) => {
        const centerLatLng = this.map.getCenter();
        pois.sort((poiA, poiB) => {
          const latLngA = L.latLng(poiA.coordinate.coordinates[1], poiA.coordinate.coordinates[0]);
          const latLngB = L.latLng(poiB.coordinate.coordinates[1], poiB.coordinate.coordinates[0]);

          const distA = latLngA.distanceTo(centerLatLng);
          const distB = latLngB.distanceTo(centerLatLng);

          return distA - distB;
        });
        this.addPoisInBatches(pois);
/*        pois.forEach(poi => {
            this.mapManager.addMarker(EntityType.POI, poi)
          }
        );*/
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des POI:', error);
      }
    });
  }

  private addPoisInBatches(pois: dto.PointOfInterestEntity[]) {
    const batchSize = 150;
    let index = 0;

    const addBatch = (deadline?: IdleDeadline) => {
      while ((deadline && deadline.timeRemaining() > 0) || !deadline) {
        const batch = pois.slice(index, index + batchSize);

        batch.forEach((poi) => {
          this.mapManager.addMarker(EntityType.POI, poi);
        });
        index += batchSize;

        if (index >= pois.length) {
          this.notificationService.success("Point d'intérêt", "Chargement des points d'intérêt terminé")
          return;
        }
      }
      requestIdleCallback(addBatch);
    };
    requestIdleCallback(addBatch);
  }

  private subscribeToFilterChanges(): Subscription {
    return this.filterService.filters$.subscribe(filters => {
      this.filters = filters as { agencies: string[], vehicles: string[], drivers: string[] };

      // Call getFilteredVehicles each time filters change
      this.vehicleService.getFilteredVehicles(this.filters.agencies, this.filters.vehicles, this.filters.drivers)
        .subscribe(filteredVehicles => {

          // Handle the filtered vehicles here, for example by updating the map markers
          this.displayFilteredVehiclesOnMap(filteredVehicles);
          this.mapManager.handleLayerEvent(
            {
              type: LayerEventType.SetViewAroundMarkerType,
              payload:
                {
                  markerType: EntityType.VEHICLE
                }
            }, null)
        });
    });
  }

  private displayFilteredVehiclesOnMap(vehicles: dto.VehicleSummaryDTO[]): void {

    // this.mapManager.deleteMarkers();
    const event: LayerEvent = {
      type: LayerEventType.DeleteAllMarkers,
      payload: {
        markerType: 'vehicle'
      }
    }
    this.mapManager.handleLayerEvent(event, null)

    // Reset unTrackedVehicle list for each filter change
    this.noComVehicle = "Liste des véhicules non-communicant ou sans statut : ";

    // Display new markers on the map based on the filtered vehicles
    vehicles.forEach(vehicle => {

      if (vehicle.device && vehicle.device.coordinate) {

        this.mapManager.addMarker(EntityType.VEHICLE, vehicle);
        if (vehicle.device.state === "" || vehicle.device.state === "NO_COM" || vehicle.device?.state === null) {
          this.noComVehicle += `[${vehicle.driver?.lastName + " " + vehicle.driver?.firstName}-${vehicle.licenseplate}] /// `
        }
        if (vehicle.device.state === "UNPLUGGED") {
          this.unpluggedVehicle += `[${vehicle.driver?.lastName + " " + vehicle.driver?.firstName}-${vehicle.licenseplate}] /// `
        }
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
              newState: result.state
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

  toggleDiv() {
    this.isCollapsed = !this.isCollapsed;
  }
}
