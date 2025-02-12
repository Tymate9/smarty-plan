import {Component, Input} from '@angular/core';
import * as L from 'leaflet';
import {TripsService} from './trips.service';
import {dto} from "../../../habarta/dto";
import {parse as WKTParse} from "wellknown";
import {CustomMarkerImpl, MarkerFactory} from "../../core/cartography/marker/MarkerFactory";
import {TilesService} from "../../services/tiles.service";
import TripEventsDTO = dto.TripEventsDTO;
import TripEventDTO = dto.TripEventDTO;
import TripEventType = dto.TripEventType;
import {GeoUtils} from "../../commons/geo/geo-utils";


@Component({
  selector: 'app-trip-map',
  template: `
    <div id="trip-container">
      <div id="map"></div>
      <div id="side-panel" class="h-screen p-4 {{ showSidePanel ? 'show' : 'hide'}}">
        <p-toggleButton
          [(ngModel)]="showSidePanel"
          onIcon="pi pi-angle-right"
          offIcon="pi pi-angle-left"
          id="side-panel-toggle"
        />
        <div class="container">
          <h3 *ngIf="tripData">{{ tripData.driverName ?? 'Véhicule non attribué' }} - {{ tripData.licensePlate }}</h3>
          <div *ngIf="showTimeline" id="trip-cards" class="flex">
            <p-card header="Amplitude">
              <p>{{ tripsService.formatDuration(tripData!.range) }}</p>
            </p-card>
            <p-card header="Arrêt">
              <p>{{ tripsService.formatDuration(tripData!.stopDuration) }}</p>
            </p-card>
            <p-card header="Conduite">
              <p>{{ tripsService.formatDuration(tripData!.drivingDuration) }}</p>
            </p-card>
            <p-card header="Durée estimée d'arrêt moteur tournant">
              <p>{{ tripsService.formatDuration(tripData!.idleDuration) }}</p>
            </p-card>
            <p-card header="Distance totale">
              <p>{{ tripData!.drivingDistance.toFixed(0) }} Km</p>
            </p-card>
            <p-card header="Nb de POI visités">
              <p>{{ tripData!.poiAmount }}</p>
            </p-card>
          </div>
          <p-tabView>
            <p-tabPanel header="Résumé">
              <p-timeline [value]="tripData!.compactedTripEvents" id="trips-timeline" *ngIf="showTimeline">
                <ng-template pTemplate="marker" let-event>
              <span *ngIf="event.eventType === TripEventType.STOP"
                    class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
                    [style]="{ 'background-color': event.color }">
                      <i class="pi pi-map-marker"></i>
              </span>
                  <span *ngIf="event.eventType === TripEventType.VEHICLE_RUNNING">
                <img src="../../../assets/icon/jd-{{tripData!.vehicleCategory.toLowerCase()}}-vert.svg" alt="{{ tripData!.driverName ?? 'Véhicule non attribué'}}" style="width: 50px;height: 50px"/>
              </span>
                  <span *ngIf="event.eventType === TripEventType.VEHICLE_IDLE">
                <img src="../../../assets/icon/jd-{{tripData!.vehicleCategory.toLowerCase()}}-orange.svg" alt="{{ tripData!.driverName ?? 'Véhicule non attribué'}}" style="width: 50px;height: 50px"/>
              </span>
                </ng-template>
                <ng-template pTemplate="content" let-event>
                  <div
                    *ngIf="event.eventType === TripEventType.TRIP"
                    (mouseenter)="onTripEventMouseEnter(event)"
                    (mouseleave)="onTripEventMouseLeave(event)"
                    style="margin: 10px 0; position: relative"
                  >
                    <div>
                      <div class="trip-dot" [style]="{ 'background-color': event.color }"></div>

                      Trajet de <strong>{{ (tripsService.formatDuration(event.duration)) }}</strong></div>

                    <div class="time-oval">
                      {{
                        event.start?.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }}
                    </div>
                    <i class="pi pi-caret-right"></i>
                    <div class="time-oval">
                      {{
                        event.end?.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }}
                    </div>

                    <!--                {{ event.distance.toFixed(0) }} Km-->
                    <div class="distance-rectangle small-right" style="position: relative">
                      <p style="position: absolute; top:-0.6rem; left:0.2rem;">{{ event.distance.toFixed(0) }} Km</p>
                      <i *ngIf="event.sourceIndexes?.length > 0" class="pi pi-star-fill" style="bottom:0.4rem; right:0rem; position: absolute; color: darkred;"></i>
                    </div>
                  </div>
                  <div
                    class="p-3 bg-black-alpha-20 border-round cursor-pointer"
                    *ngIf="event.eventType !== TripEventType.TRIP && event.eventType !== TripEventType.TRIP_EXPECTATION"
                    (mouseenter)="onTripEventMouseEnter(event)"
                    (mouseleave)="onTripEventMouseLeave(event)"
                    (click)="onTripEventClick(event)"
                    style="position: relative"
                  > {{ event.poiLabel ? event.poiLabel + ' ' + event.address : event.address }}
                    <br/> {{ event.start?.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) }}
                    <i class="pi pi-caret-right"></i> {{
                      event.end?.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    }} <strong *ngIf="event.duration != null">{{ tripsService.formatDuration(event.duration) }}</strong>
                    <i *ngIf="event.sourceIndexes?.length > 0" class="pi pi-star-fill" style="right: 1rem; bottom: 1rem; position: absolute; color:darkred"></i>
                  </div>
                </ng-template>
              </p-timeline>
            </p-tabPanel>
            <p-tabPanel header="Détaillé">
              <p-timeline [value]="tripData!.tripEvents" id="trips-timeline" *ngIf="showTimeline">
                <ng-template pTemplate="marker" let-event>
              <span *ngIf="event.eventType === TripEventType.STOP"
                    class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
                    [style]="{ 'background-color': event.color }">
                      <i class="pi pi-map-marker"></i>
              </span>
                  <span *ngIf="event.eventType === TripEventType.VEHICLE_RUNNING">
                <img src="../../../assets/icon/jd-{{tripData!.vehicleCategory.toLowerCase()}}-vert.svg" alt="{{ tripData!.driverName ?? 'Véhicule non attribué'}}" style="width: 50px;height: 50px"/>
              </span>
                  <span *ngIf="event.eventType === TripEventType.VEHICLE_IDLE">
                <img src="../../../assets/icon/jd-{{tripData!.vehicleCategory.toLowerCase()}}-orange.svg" alt="{{ tripData!.driverName ?? 'Véhicule non attribué'}}" style="width: 50px;height: 50px"/>
              </span>
                </ng-template>
                <ng-template pTemplate="content" let-event>
                  <div
                    *ngIf="event.eventType === TripEventType.TRIP"
                    (mouseenter)="onTripEventMouseEnter(event)"
                    (mouseleave)="onTripEventMouseLeave(event)"
                    style="margin: 10px 0;"
                  >
                    <div>
                      <div class="trip-dot" [style]="{ 'background-color': event.color }"></div>

                      Trajet de <strong>{{ (tripsService.formatDuration(event.duration)) }}</strong></div>

                    <div class="time-oval">
                      {{
                        event.start?.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }}
                    </div>
                    <i class="pi pi-caret-right"></i>
                    <div class="time-oval">
                      {{
                        event.end?.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }}
                    </div>

                    <!--                {{ event.distance.toFixed(0) }} Km-->
                    <div class="distance-rectangle small-right">
                      {{ event.distance.toFixed(0) }} Km
                    </div>
                  </div>
                  <div
                    class="p-3 bg-black-alpha-20 border-round cursor-pointer"
                    *ngIf="event.eventType !== TripEventType.TRIP && event.eventType !== TripEventType.TRIP_EXPECTATION"
                    (mouseenter)="onTripEventMouseEnter(event)"
                    (mouseleave)="onTripEventMouseLeave(event)"
                    (click)="onTripEventClick(event)"
                  > {{ event.poiLabel ? event.poiLabel + ' ' + event.address : event.address }}
                    <br/> {{ event.start?.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) }}
                    <i class="pi pi-caret-right"></i> {{
                      event.end?.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    }} <strong *ngIf="event.duration != null">{{ tripsService.formatDuration(event.duration) }}</strong>
                  </div>
                </ng-template>
              </p-timeline>
            </p-tabPanel>
          </p-tabView>
          <div *ngIf="!showTimeline">
            <p>Chargement du détail des trajets...</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    #trip-container {
      overflow-x: hidden;
      overflow-y: hidden;
      width: 100%;
      position: absolute;
      top: 0;
    }

    #map {
      height: 80vh;

      ::ng-deep {
        .leaflet-control-zoom {
          margin-top: 70px;
        }
      }
    }

    #side-panel {
      transition: margin-left 0.5s;
      position: absolute;
      left: 100%;
      top: 0;
      height: 100% !important;
      width: 35%;
      z-index: 1000;
      display: flex;
      padding: 0 !important;

      .container {
        height: 100%;
        display: inline-block;
        background-color: rgba(255, 255, 255, 0.8);
        flex-grow: 1;
        padding: 1.5rem;
        overflow-y: auto;
      }

      &.hide {
        margin-left: -38px;
      }

      &.show {
        margin-left: -35%;
      }

      #side-panel-toggle {
        position: relative;
        margin-top: 10%;
        width: 39px;


        ::ng-deep .p-element.p-button.p-togglebutton.p-component.p-button-icon-only.p-highlight {
          background-color: #aa001f !important;
          border-color: #aa001f !important;
          color: white !important;
          font-weight: 600;
        }

        ::ng-deep .p-element.p-button.p-togglebutton.p-component.p-button-icon-only {
          background-color: #aa001f !important;
          border-color: #aa001f !important;
          color: white !important;
          font-weight: 600;
        }

        ::ng-deep .pi.p-button-icon.p-button-icon-left.pi-angle-left {
          color: white !Important;
        }

      }

      .trip-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 5px;
      }

      .distance-rectangle {
        padding: 5px 10px;
        border: 1px solid #BDBDBD;
        background-color: #BDBDBD;
        border-radius: 5px;
        font-size: 16px;
        text-align: center;
        width: 80px;
        height: 30px;
        align-items: center;
        font-weight: bold;
        color: white;
      }

      .small-right {
        float: right;
        margin-right: 10px;
        margin-top: 5px;
      }

      .time-oval {
        display: inline-block;
        padding: 5px 10px;
        border: 1px solid #d9e0e3;
        border-radius: 20px;
        background-color: #d9e0e3;
        text-align: center;
      }


    }

    #trip-cards {
      flex-wrap: wrap;
      justify-content: space-between;
      margin-bottom: 2rem;

      ::ng-deep p-card {
        margin: 0.5rem;
        width: 28%;
        text-align: center;
        border-radius: 5px;
        font-weight: bold;
        font-size: 1.0rem;

        .p-card {
          height: 15vh;
        }

        .p-card-title {
          font-size: 0.7rem;
          background-color: lightgray;
          margin: -1rem;
          padding: .5rem 0;
          border-radius: 5px 5px 0 0;
          font-weight: bold;
        }
      }
    }

    #trips-timeline {
      overflow-y: auto;
      height: 60%;

      ::ng-deep {
        .p-timeline-event-opposite {
          display: none;
        }

        .p-timeline-event-separator {
          min-width: 32px;
        }
      }
    }
  `]
})
export class TripMapComponent {
  private _tripData: TripEventsDTO | null = null;

  protected showSidePanel = true;
  protected showTimeline = false;

  private map: L.Map | null = null;
  private featureGroup: L.FeatureGroup = L.featureGroup();

  constructor(
    protected tripsService: TripsService,
    protected tilesService: TilesService
  ) {
  }

  @Input() set tripData(tripEventsDTO: TripEventsDTO | null) {
    if (!tripEventsDTO) {
      return;
    }
    this._tripData = tripEventsDTO;
    console.log(tripEventsDTO)
    // init map
    if (this.map) {
      this.featureGroup.clearLayers();
    } else {
      this.map = L.map('map', {
        zoomDelta: 1,
      }).setView([tripEventsDTO.tripEvents[0].lat ?? 0, tripEventsDTO.tripEvents[0].lng ?? 0], 13);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      // add gmaps redirect control
      GeoUtils.getGMapsRedirectControl(this.map).addTo(this.map);

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
    }

    tripEventsDTO?.tripEvents?.forEach(tripEvent => {

      // todo : use full marker creation
      if (tripEvent.eventType != TripEventType.TRIP
        && tripEvent.eventType != TripEventType.TRIP_EXPECTATION
        && tripEvent.lat !== null && tripEvent.lng !== null) {
        const popupLabel = tripEvent.poiLabel ??
          (tripEvent.eventType === TripEventType.VEHICLE_RUNNING ? 'Véhicule roulant'
            : tripEvent.eventType === TripEventType.VEHICLE_IDLE ? 'Véhicule à l\'arrêt avec moteur tournant'
              : 'Arrêt');
        new CustomMarkerImpl([tripEvent.lat, tripEvent.lng])
          .setIcon(this.getIcon(tripEvent.eventType, tripEvent.color, tripEventsDTO.vehicleCategory.toLowerCase()))
          .addTo(this.featureGroup)
          .bindPopup(
            `<b>${popupLabel}</b><br>${tripEvent.address}<br>${tripEvent.start?.toLocaleTimeString() ?? ''} - ${tripEvent.end?.toLocaleTimeString() ?? ''}`
          );
      }

      // add trace to map
      if ([TripEventType.TRIP, TripEventType.TRIP_EXPECTATION].includes(tripEvent.eventType)
        && tripEvent.trace) {
        const geoJSON = WKTParse(tripEvent.trace);
        if (geoJSON === null || geoJSON.type !== 'LineString') {
          alert('Erreur lors de la récupération de la trace')
          return
        }

        L.geoJson(geoJSON,
          {
            style: {
              color: tripEvent.color || 'blue',
              dashArray: tripEvent.eventType === TripEventType.TRIP_EXPECTATION ? '4' : undefined
            }
          }
        ).addTo(this.featureGroup);
      }
    });

    // set page up and zoom
    this.featureGroup.addTo(this.map);
    this.showTimeline = true;
    this.map.flyToBounds(
      this.featureGroup.getBounds().pad(0.1),
      {
        paddingBottomRight: [this.showSidePanel ? this.map.getSize().x * 0.35 - 39 : 0, 0]
      }
    );
  }

  get tripData(): TripEventsDTO | null {
    return this._tripData;
  }


  private applyEventsHiglightedStyle(
    indexes: number[],
    fillColor: string,
    weight: number,
    highlightMarker: boolean
  ): void {
    indexes.forEach(index => {
      const layer = this.featureGroup.getLayers()[index];
      if (layer instanceof L.GeoJSON) {
        layer.setStyle({ fillColor: fillColor, weight: weight });
      } else if (layer instanceof L.Marker) {
        const element = layer.getElement();
        if (element) {
          if (highlightMarker) {
            element.classList.add('highlighted-marker');
          } else {
            element.classList.remove('highlighted-marker');
          }
        }
      }
    });
  }

// Méthode refactorisée pour l'événement MouseEnter
  onTripEventMouseEnter(event: TripEventDTO): void {
    const fillColor = 'blue';
    const weight = 5;
    const highlightMarker = true;

    if (event.sourceIndexes && event.sourceIndexes.length > 0) {
      this.applyEventsHiglightedStyle(event.sourceIndexes, fillColor, weight, highlightMarker);
    } else {
      const layer = this.featureGroup.getLayers()[event.index];
      if (event.eventType === TripEventType.TRIP && layer instanceof L.GeoJSON) {
        layer.setStyle({ fillColor: fillColor, weight: weight });
      } else if (layer instanceof L.Marker) {
        layer.getElement()?.classList.add('highlighted-marker');
      }
    }
  }

// Méthode refactorisée pour l'événement MouseLeave
  onTripEventMouseLeave(event: TripEventDTO): void {
    const fillColor = 'blue';
    const weight = 3;
    const highlightMarker = false;

    if (event.sourceIndexes && event.sourceIndexes.length > 0) {
      this.applyEventsHiglightedStyle(
        event.sourceIndexes,
        fillColor,
        weight,
        highlightMarker
      );
    } else {
      const layer = this.featureGroup.getLayers()[event.index];
      if (event.eventType === TripEventType.TRIP && layer instanceof L.GeoJSON) {
        layer.setStyle({ fillColor: fillColor, weight: weight });
      } else if (layer instanceof L.Marker) {
        layer.getElement()?.classList.remove('highlighted-marker');
      }
    }
  }


  onTripEventClick(event: TripEventDTO): void {
    const layer = this.featureGroup.getLayers()[event.index]
    if (layer instanceof L.Marker) {
      const latLng = layer.getLatLng();
      const zoom = this.map!.getZoom()
      const bounds = this.map!.getBounds();
      this.map!.flyTo(
        [
          latLng.lat,
          latLng.lng + (this.showSidePanel ? (bounds.getEast() - bounds.getWest()) * 0.175 : 0)
        ], zoom);
      layer.openPopup();
    }
  }

  private getIcon(eventType: TripEventType.STOP | TripEventType.VEHICLE_RUNNING | TripEventType.VEHICLE_IDLE, color: string | null, category: string): L.DivIcon {
    switch (eventType) {
      case TripEventType.STOP:
        return L.divIcon({
          html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="30px" height="45px" fill="${color || 'black'}">
                  <path fill-rule="evenodd" d="M24,4.5A14.82,14.82,0,0,0,9.18,19.32h0c0,.34,0,.68,0,1v.08C9.78,28.52,16.52,35.05,24,43.5,31.81,34.68,38.82,28,38.82,19.32h0A14.82,14.82,0,0,0,24,4.5Zm0,7.7a7.13,7.13,0,1,1-7.13,7.12A7.13,7.13,0,0,1,24,12.2Z" />
                </svg>`,
          /*iconSize: [30, 45],*/
          iconAnchor: [15, 45],
          className: 'custom-poi-icon',
        });
      case TripEventType.VEHICLE_RUNNING:
        return MarkerFactory.getVehicleIcon('DRIVING', category);
      case TripEventType.VEHICLE_IDLE:
        return MarkerFactory.getVehicleIcon('IDLE', category)
    }
  }

  protected readonly TripEventType = TripEventType;
}
