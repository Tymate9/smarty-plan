import {Component, Input} from '@angular/core';
import * as L from 'leaflet';
import {TripsService} from './trips.service';
import {dto} from "../../../habarta/dto";
import {parse as WKTParse} from "wellknown";
import {CustomMarkerImpl, MarkerFactory} from "../../core/cartography/marker/MarkerFactory";
import {TilesService} from "../../services/tiles.service";
import {GeoUtils} from "../../commons/geo/geo-utils";
import {TimelineEventDTO, TimelineEventsDTO, TimelineEventType} from "./timeline-events.dto";
import TripEventsDTO = dto.TripEventsDTO;
import TripStatus = dto.TripStatus;
import TripEventType = dto.TripEventType;
import {NgForOf, NgIf, NgStyle} from "@angular/common";
import {PrimeTemplate} from "primeng/api";
import {Timeline} from "primeng/timeline";
import {TabPanel, TabView} from "primeng/tabview";
import {Card} from "primeng/card";
import {ToggleButton} from "primeng/togglebutton";
import {FormsModule} from "@angular/forms";
import {PoiNavigationButtonComponent} from "../poi/poi-navigation-button/poi-navigation-button.component";


@Component({
  selector: 'app-trip-map',
  template: `
    <div id="trip-container">
      <div id="map" [style.visibility]="isMapVisible ? 'visible' : 'hidden'"></div>
      <div id="map-non-geoloc" *ngIf="non_geoloc">Trajets non géolocalisés pour ce véhicule et ce jour.</div>
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
              <p>{{ Math.max(1, Math.ceil(tripData!.drivingDistance)) }} Km</p>
            </p-card>
            <p-card header="Nb de POI visités">
              <p>{{ tripData!.poiAmount }}</p>
            </p-card>
          </div>
          <p-tabView>
            <p-tabPanel header="Résumé">
              <p-timeline [value]="timelineEvents!.compactedTripEvents" id="trips-timeline" *ngIf="showTimeline">
                <ng-template pTemplate="marker" let-event>
                  <span *ngIf="[
                    TimelineEventType.STOP,
                    TimelineEventType.LUNCH_STOP,
                    TimelineEventType.VEHICLE_PARKED,
                    TimelineEventType.STOP_LUNCH_BREAKING,
                    TimelineEventType.LUNCH_STOP_BEFORE_START,
                    TimelineEventType.LUNCH_STOP_AFTER_START,
                    TimelineEventType.LUNCH_STOP_BEFORE_STOP,
                    TimelineEventType.LUNCH_STOP_AFTER_STOP
                  ].includes(event.type) && event.originalEvent.eventType !== TripEventType.VEHICLE_RUNNING && event.originalEvent.eventType !== TripEventType.VEHICLE_IDLE"
                        class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
                        [style]="{ 'background-color': event.originalEvent.color }">
                          <i class="pi pi-map-marker"></i>
                  </span>
                  <span *ngIf="event.originalEvent.eventType === TripEventType.VEHICLE_RUNNING">
                    <img src="../../../assets/icon/jd-{{timelineEvents!.vehicleCategory.toLowerCase()}}-vert.svg"
                         alt="{{ timelineEvents!.driverName ?? 'Véhicule non attribué'}}"
                         style="width: 50px;height: 50px"/>
                  </span>
                  <span *ngIf="event.originalEvent.eventType === TripEventType.VEHICLE_IDLE">
                <img src="../../../assets/icon/jd-{{timelineEvents!.vehicleCategory.toLowerCase()}}-orange.svg"
                     alt="{{ timelineEvents!.driverName ?? 'Véhicule non attribué'}}" style="width: 50px;height: 50px"/>
              </span>
                </ng-template>
                <ng-template pTemplate="content" let-event>
                  <div
                    *ngIf="event.type === TimelineEventType.LUNCH_START_SEPARATOR || event.type === TimelineEventType.LUNCH_STOP_SEPARATOR"
                    [class]="event.type === TimelineEventType.LUNCH_START_SEPARATOR ? 'start-separator' : 'end-separator'">
                    <div *ngIf="event.type === TimelineEventType.LUNCH_START_SEPARATOR">
                      PAUSE DEJEUNER A {{ event.time }}
                    </div>
                    <div *ngIf="event.type === TimelineEventType.LUNCH_STOP_SEPARATOR">
                      {{ event.time }}
                    </div>
                  </div>
                  <div
                    *ngIf="event.originalEvent.eventType === TripEventType.TRIP && event.type !== TimelineEventType.LUNCH_START_SEPARATOR && event.type !== TimelineEventType.LUNCH_STOP_SEPARATOR"
                    (mouseenter)="onTripEventMouseEnter(event)"
                    (mouseleave)="onTripEventMouseLeave(event)"
                    class="trip-event"
                    style="margin: 10px 0;"
                    [style]="{marginLeft: event.type === TimelineEventType.TRIP_LUNCH_BREAKING || event.type === TimelineEventType.LUNCH_TRIP_AFTER_START || event.type === TimelineEventType.LUNCH_TRIP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_TRIP ? '2rem' : '0'}"
                  >
                    <div>
                      <div class="trip-dot" [style]="{ 'background-color': event.originalEvent.color }"></div>
                      <span
                        *ngIf="event.type !== TimelineEventType.LUNCH_TRIP_BEFORE_START && event.type !== TimelineEventType.LUNCH_TRIP_BEFORE_STOP && event.type !== TimelineEventType.LUNCH_TRIP">
                        <span *ngIf="event.originalEvent.tripStatus === TripStatus.COMPLETED">
                            Trajet de <strong>{{ (tripsService.formatDuration(event.originalEvent.duration)) }}</strong>
                        </span>
                        <span *ngIf="event.originalEvent.tripStatus !== TripStatus.COMPLETED">
                          Trajet en cours
                        </span>
                      </span>
                      <span
                        *ngIf="event.type === TimelineEventType.LUNCH_TRIP_BEFORE_START || event.type === TimelineEventType.LUNCH_TRIP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_TRIP">Trajet</span>
                      <!-- Affichage des subTripEvent descriptions -->
                      <div *ngIf="event.originalEvent.subTripEvents?.length">
                        <div *ngFor="let subEvent of event.originalEvent.subTripEvents">
                          {{ subEvent.description }}
                        </div>
                      </div>
                    </div>


                    <div
                      *ngIf="event.type !== TimelineEventType.LUNCH_TRIP_AFTER_START && event.type !== TimelineEventType.LUNCH_TRIP_AFTER_STOP && event.type !== TimelineEventType.LUNCH_TRIP"
                      class="time-oval">
                      {{ tripsService.formatDateToMinutes(event.originalEvent.start) }}
                    </div>
                    <span
                      *ngIf="event.type === TimelineEventType.LUNCH_TRIP_AFTER_START || event.type === TimelineEventType.LUNCH_TRIP_AFTER_STOP || event.type === TimelineEventType.LUNCH_TRIP">
                      ...
                    </span>
                    <i class="pi pi-caret-right"></i>
                    <div
                      *ngIf="event.originalEvent.tripStatus === TripStatus.COMPLETED && event.type !== TimelineEventType.LUNCH_TRIP_BEFORE_START && event.type !== TimelineEventType.LUNCH_TRIP_BEFORE_STOP && event.type !== TimelineEventType.LUNCH_TRIP"
                      class="time-oval">
                      {{ tripsService.formatDateToMinutes(event.originalEvent.end) }}
                    </div>
                    <span
                      *ngIf="event.originalEvent.tripStatus !== TripStatus.COMPLETED || event.type === TimelineEventType.LUNCH_TRIP_BEFORE_START || event.type === TimelineEventType.LUNCH_TRIP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_TRIP">
                      ...
                    </span>

                    <div class="distance-rectangle small-right" style="position: relative">
                      <p
                        style="position: absolute; top:-0.6rem; left:0.2rem;">{{ Math.max(1, Math.ceil(event.originalEvent.distance)) }}
                        Km</p>
                      <i *ngIf="event.originalEvent.sourceIndexes?.length > 0" class="pi pi-star-fill"
                         style="bottom:0.4rem; right:0rem; position: absolute; color: darkred;"></i>
                    </div>
                  </div>
                  <div
                    class="p-3 bg-black-alpha-20 border-round cursor-pointer"
                    *ngIf="event.originalEvent.eventType !== TripEventType.TRIP && event.originalEvent.eventType !== TripEventType.TRIP_EXPECTATION && event.type !== TimelineEventType.LUNCH_START_SEPARATOR && event.type !== TimelineEventType.LUNCH_STOP_SEPARATOR"
                    (mouseenter)="onTripEventMouseEnter(event)"
                    (mouseleave)="onTripEventMouseLeave(event)"
                    (click)="onTripEventClick(event)"
                    [style]="{position: 'relative', marginLeft: event.type === TimelineEventType.STOP_LUNCH_BREAKING || event.type === TimelineEventType.LUNCH_STOP_AFTER_START || event.type === TimelineEventType.LUNCH_STOP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_STOP ? '2rem' : '0'}"
                  >
                    <div style="width: calc(100% - 5.8rem); white-space: normal; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; hyphens: auto;"
                      *ngIf="event.type !== TimelineEventType.LUNCH_STOP_AFTER_START && event.type !== TimelineEventType.LUNCH_STOP_BEFORE_STOP && event.type !== TimelineEventType.LUNCH_STOP">
                      {{ event.originalEvent.poiLabel ? event.originalEvent.poiLabel + ' ' + event.originalEvent.address : event.originalEvent.address }}
                    </div>
                    <div
                      *ngIf="event.type === TimelineEventType.LUNCH_STOP_AFTER_START || event.type === TimelineEventType.LUNCH_STOP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_STOP">
                      Pause déjeuner
                    </div>
                    <div
                      *ngIf="event.originalEvent.eventType !== TripEventType.VEHICLE_RUNNING && event.originalEvent.eventType !== TripEventType.VEHICLE_IDLE">
                      <span
                        *ngIf="event.type !== TimelineEventType.LUNCH_STOP_AFTER_START && event.type !== TimelineEventType.LUNCH_STOP_AFTER_STOP && event.type !== TimelineEventType.LUNCH_STOP">
                        {{ tripsService.formatDateToMinutes(event.originalEvent.start) }}
                      </span>
                      <span
                        *ngIf="event.type === TimelineEventType.LUNCH_STOP_AFTER_START || event.type === TimelineEventType.LUNCH_STOP_AFTER_STOP || event.type === TimelineEventType.LUNCH_STOP">
                        ...
                      </span>
                      <i class="pi pi-caret-right"></i>
                      <span
                        *ngIf="event.originalEvent.eventType !== TripEventType.VEHICLE_PARKED && event.type !== TimelineEventType.LUNCH_STOP_BEFORE_START && event.type !== TimelineEventType.LUNCH_STOP_BEFORE_STOP && event.type !== TimelineEventType.LUNCH_STOP">
                        {{ tripsService.formatDateToMinutes(event.originalEvent.end) }}
                      </span>
                      <span
                        *ngIf="event.originalEvent.eventType === TripEventType.VEHICLE_PARKED || event.type === TimelineEventType.LUNCH_STOP_BEFORE_START || event.type === TimelineEventType.LUNCH_STOP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_STOP">
                        ...
                      </span>
                      <strong
                        *ngIf="event.originalEvent.duration !== null && event.type !== TimelineEventType.LUNCH_STOP_BEFORE_START && event.type !== TimelineEventType.LUNCH_STOP_BEFORE_STOP && event.type !== TimelineEventType.LUNCH_STOP"> {{ tripsService.formatDuration(event.originalEvent.duration) }}</strong>
                    </div>
                    <!-- Affichage des subTripEvent descriptions -->
                    <div *ngIf="event.originalEvent.subTripEvents?.length">
                      <div *ngFor="let subEvent of event.originalEvent.subTripEvents">
                        {{ subEvent.description }}
                      </div>
                    </div>
                    <!-- Ajout du bouton pour les événements STOP sans POI existant -->
                    <div  *ngIf="!event.originalEvent.poiLabel && !non_geoloc && (event.type === TimelineEventType.STOP || event.type === TimelineEventType.VEHICLE_PARKED || event.type === TimelineEventType.LUNCH_STOP_BEFORE_START || event.type === TimelineEventType.LUNCH_STOP_AFTER_STOP)"
                         style="max-width: 8rem; position: absolute; transform: scale(0.8); transform-origin: top right; margin: 0.2rem; top: 0; right: 0;"
                    >
                      <app-poi-navigation-button
                        [buttonLabel]="'Créer POI'"
                        [coords]="[event.originalEvent.lat + ',' + event.originalEvent.lng]">
                      </app-poi-navigation-button>
                    </div>
                  </div>
                </ng-template>
              </p-timeline>
            </p-tabPanel>
            <p-tabPanel header="Détaillé">
              <p-timeline [value]="timelineEvents!.tripEvents" id="trips-timeline" *ngIf="showTimeline">
                <ng-template pTemplate="marker" let-event>
                  <span *ngIf="[
                    TimelineEventType.STOP,
                    TimelineEventType.VEHICLE_PARKED,
                    TimelineEventType.LUNCH_STOP,
                    TimelineEventType.STOP_LUNCH_BREAKING,
                    TimelineEventType.LUNCH_STOP_BEFORE_START,
                    TimelineEventType.LUNCH_STOP_AFTER_START,
                    TimelineEventType.LUNCH_STOP_BEFORE_STOP,
                    TimelineEventType.LUNCH_STOP_AFTER_STOP
                  ].includes(event.type) && event.originalEvent.eventType !== TripEventType.VEHICLE_RUNNING && event.originalEvent.eventType !== TripEventType.VEHICLE_IDLE"
                        class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
                        [style]="{ 'background-color': event.originalEvent.color }">
                          <i class="pi pi-map-marker"></i>
                  </span>
                  <span *ngIf="event.originalEvent.eventType === TripEventType.VEHICLE_RUNNING">
                    <img src="../../../assets/icon/jd-{{timelineEvents!.vehicleCategory.toLowerCase()}}-vert.svg"
                         alt="{{ timelineEvents!.driverName ?? 'Véhicule non attribué'}}"
                         style="width: 50px;height: 50px"/>
                  </span>
                  <span *ngIf="event.originalEvent.eventType === TripEventType.VEHICLE_IDLE">
                <img src="../../../assets/icon/jd-{{timelineEvents!.vehicleCategory.toLowerCase()}}-orange.svg"
                     alt="{{ timelineEvents!.driverName ?? 'Véhicule non attribué'}}" style="width: 50px;height: 50px"/>
              </span>
                </ng-template>
                <ng-template pTemplate="content" let-event>
                  <div
                    *ngIf="event.type === TimelineEventType.LUNCH_START_SEPARATOR || event.type === TimelineEventType.LUNCH_STOP_SEPARATOR"
                    [class]="event.type === TimelineEventType.LUNCH_START_SEPARATOR ? 'start-separator' : 'end-separator'">
                    <div *ngIf="event.type === TimelineEventType.LUNCH_START_SEPARATOR">
                      PAUSE DEJEUNER A {{ event.time }}
                    </div>
                    <div *ngIf="event.type === TimelineEventType.LUNCH_STOP_SEPARATOR">
                      {{ event.time }}
                    </div>
                  </div>
                  <div
                    *ngIf="event.originalEvent.eventType === TripEventType.TRIP && event.type !== TimelineEventType.LUNCH_START_SEPARATOR && event.type !== TimelineEventType.LUNCH_STOP_SEPARATOR"
                    (mouseenter)="onTripEventMouseEnter(event)"
                    (mouseleave)="onTripEventMouseLeave(event)"
                    class="trip-event"
                    style="margin: 10px 0;"
                    [style]="{marginLeft: event.type === TimelineEventType.TRIP_LUNCH_BREAKING || event.type === TimelineEventType.LUNCH_TRIP_AFTER_START || event.type === TimelineEventType.LUNCH_TRIP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_TRIP ? '2rem' : '0'}"
                  >
                    <div>
                      <div class="trip-dot" [style]="{ 'background-color': event.originalEvent.color }"></div>
                      <span
                        *ngIf="event.type !== TimelineEventType.LUNCH_TRIP_BEFORE_START && event.type !== TimelineEventType.LUNCH_TRIP_BEFORE_STOP && event.type !== TimelineEventType.LUNCH_TRIP">
                        <span *ngIf="event.originalEvent.tripStatus === TripStatus.COMPLETED">
                            Trajet de <strong>{{ (tripsService.formatDuration(event.originalEvent.duration)) }}</strong>
                        </span>
                        <span *ngIf="event.originalEvent.tripStatus !== TripStatus.COMPLETED">
                          Trajet en cours
                        </span>
                      </span>
                      <span
                        *ngIf="event.type === TimelineEventType.LUNCH_TRIP_BEFORE_START || event.type === TimelineEventType.LUNCH_TRIP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_TRIP">Trajet</span>
                      <!-- Affichage des subTripEvent descriptions -->
                      <div *ngIf="event.originalEvent.subTripEvents?.length">
                        <div *ngFor="let subEvent of event.originalEvent.subTripEvents">
                          {{ subEvent.description }}
                        </div>
                      </div>
                    </div>
                    <div
                      *ngIf="event.type !== TimelineEventType.LUNCH_TRIP_AFTER_START && event.type !== TimelineEventType.LUNCH_TRIP_AFTER_STOP && event.type !== TimelineEventType.LUNCH_TRIP"
                      class="time-oval">
                      {{ tripsService.formatDateToMinutes(event.originalEvent.start) }}
                    </div>
                    <span
                      *ngIf="event.type === TimelineEventType.LUNCH_TRIP_AFTER_START || event.type === TimelineEventType.LUNCH_TRIP_AFTER_STOP || event.type === TimelineEventType.LUNCH_TRIP">
                      ...
                    </span>
                    <i class="pi pi-caret-right"></i>
                    <div
                      *ngIf="event.originalEvent.tripStatus === TripStatus.COMPLETED && event.type !== TimelineEventType.LUNCH_TRIP_BEFORE_START && event.type !== TimelineEventType.LUNCH_TRIP_BEFORE_STOP && event.type !== TimelineEventType.LUNCH_TRIP"
                      class="time-oval">
                      {{ tripsService.formatDateToMinutes(event.originalEvent.end) }}
                    </div>
                    <span
                      *ngIf="event.originalEvent.tripStatus !== TripStatus.COMPLETED || event.type === TimelineEventType.LUNCH_TRIP_BEFORE_START || event.type === TimelineEventType.LUNCH_TRIP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_TRIP">
                      ...
                    </span>

                    <div class="distance-rectangle small-right" style="position: relative">
                      <p
                        style="position: absolute; top:-0.6rem; left:0.2rem;">{{ Math.max(1, Math.ceil(event.originalEvent.distance)) }} Km</p>
                    </div>
                  </div>
                  <div
                    class="p-3 bg-black-alpha-20 border-round cursor-pointer"
                    *ngIf="event.originalEvent.eventType !== TripEventType.TRIP && event.originalEvent.eventType !== TripEventType.TRIP_EXPECTATION && event.type !== TimelineEventType.LUNCH_START_SEPARATOR && event.type !== TimelineEventType.LUNCH_STOP_SEPARATOR"
                    (mouseenter)="onTripEventMouseEnter(event)"
                    (mouseleave)="onTripEventMouseLeave(event)"
                    (click)="onTripEventClick(event)"
                    [style]="{position: 'relative', marginLeft: event.type === TimelineEventType.STOP_LUNCH_BREAKING || event.type === TimelineEventType.LUNCH_STOP_AFTER_START || event.type === TimelineEventType.LUNCH_STOP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_STOP ? '2rem' : '0'}"
                  >
                    <div style="width: calc(100% - 5.8rem); white-space: normal; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; hyphens: auto;"
                      *ngIf="event.type !== TimelineEventType.LUNCH_STOP_AFTER_START && event.type !== TimelineEventType.LUNCH_STOP_BEFORE_STOP && event.type !== TimelineEventType.LUNCH_STOP">
                      {{ event.originalEvent.poiLabel ? event.originalEvent.poiLabel + ' ' + event.originalEvent.address : event.originalEvent.address }}
                    </div>
                    <div
                      *ngIf="event.type === TimelineEventType.LUNCH_STOP_AFTER_START || event.type === TimelineEventType.LUNCH_STOP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_STOP">
                      Pause déjeuner
                    </div>
                    <div
                      *ngIf="event.originalEvent.eventType !== TripEventType.VEHICLE_RUNNING && event.originalEvent.eventType !== TripEventType.VEHICLE_IDLE">
                      <span
                        *ngIf="event.type !== TimelineEventType.LUNCH_STOP_AFTER_START && event.type !== TimelineEventType.LUNCH_STOP_AFTER_STOP && event.type !== TimelineEventType.LUNCH_STOP">
                        {{ tripsService.formatDateToMinutes(event.originalEvent.start) }}
                      </span>
                      <span
                        *ngIf="event.type === TimelineEventType.LUNCH_STOP_AFTER_START || event.type === TimelineEventType.LUNCH_STOP_AFTER_STOP || event.type === TimelineEventType.LUNCH_STOP">
                        ...
                      </span>
                      <i
                        *ngIf="event.originalEvent.eventType !== TripEventType.VEHICLE_RUNNING && event.originalEvent.eventType !== TripEventType.VEHICLE_IDLE"
                        class="pi pi-caret-right"></i>
                      <span
                        *ngIf="event.originalEvent.eventType !== TripEventType.VEHICLE_PARKED && event.type !== TimelineEventType.LUNCH_STOP_BEFORE_START && event.type !== TimelineEventType.LUNCH_STOP_BEFORE_STOP && event.type !== TimelineEventType.LUNCH_STOP">
                        {{ tripsService.formatDateToMinutes(event.originalEvent.end) }}
                      </span>
                      <span
                        *ngIf="event.originalEvent.eventType === TripEventType.VEHICLE_PARKED || event.type === TimelineEventType.LUNCH_STOP_BEFORE_START || event.type === TimelineEventType.LUNCH_STOP_BEFORE_STOP || event.type === TimelineEventType.LUNCH_STOP">
                        ...
                      </span>
                      <strong
                        *ngIf="event.originalEvent.duration !== null && event.type !== TimelineEventType.LUNCH_STOP_BEFORE_START && event.type !== TimelineEventType.LUNCH_STOP_BEFORE_STOP && event.type !== TimelineEventType.LUNCH_STOP"> {{ tripsService.formatDuration(event.originalEvent.duration) }}</strong>
                    </div>
                    <!-- Affichage des subTripEvent descriptions -->
                    <div *ngIf="event.originalEvent.subTripEvents?.length">
                      <div *ngFor="let subEvent of event.originalEventsubTripEvents">
                        {{ subEvent.description }}
                      </div>
                    </div>
                    <!-- Ajout du bouton pour les événements STOP sans POI existant -->
                    <div *ngIf="!event.originalEvent.poiLabel && !non_geoloc && (event.type === TimelineEventType.STOP || event.type === TimelineEventType.VEHICLE_PARKED || event.type === TimelineEventType.LUNCH_STOP_BEFORE_START || event.type === TimelineEventType.LUNCH_STOP_AFTER_STOP)"
                         style="max-width: 8rem; position: absolute; transform: scale(0.8); transform-origin: top right; margin: 0.2rem; top: 0; right: 0;"
                    >
                      <app-poi-navigation-button
                        [buttonLabel]="'Créer POI'"
                        [coords]="[event.originalEvent.lat + ',' + event.originalEvent.lng]">
                      </app-poi-navigation-button>
                    </div>
                  </div>
                </ng-template>
              </p-timeline>
            </p-tabPanel>
          </p-tabView>
          <div class="timeline-bottom-times">
            <div *ngIf="lastTripPositionTime">
              Actualisation de la fiche journalière à {{ lastTripPositionTime }}
            </div>
            <div *ngIf="lastPositionTime">
              Dernière position connue à {{ lastPositionTime }}
            </div>
          </div>
          <div *ngIf="!showTimeline">
            <p>Chargement du détail des trajets...</p>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    NgIf,
    PrimeTemplate,
    Timeline,
    TabPanel,
    Card,
    ToggleButton,
    FormsModule,
    TabView,
    NgForOf,
    PoiNavigationButtonComponent
  ],
  styles: [`
    #trip-container {
      overflow-x: hidden;
      overflow-y: hidden;
      width: 100%;
      position: absolute;
      top: 0;
    }

    #map {
      height: calc(100vh - 75px);

      ::ng-deep {
        .leaflet-control-zoom {
          margin-top: 70px;
        }
      }
    }

    #map-non-geoloc {
      height: 80vh;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

      text-align: center;
      padding-top: 20%;
      padding-right: 20%;
      font-size: x-large;
      color: grey;
      z-index: 2;
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
        margin-left: -3rem;
      }

      &.show {
        margin-left: -35%;
      }

      #side-panel-toggle {
        width: 2rem;

        ::ng-deep .p-togglebutton-label {
          display:none;
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

      .timeline-bottom-times {
        float: right;
        text-align: right;
        font-style: italic;
        padding: 1rem 0;
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

        .p-card {
          height: 15vh;
        }

        .p-card-title {
          background-color: lightgray;
          margin: -1.25rem;
          padding: .5rem 0;
          border-radius: 5px 5px 0 0;
          height: 2.5rem;
        }
      }
    }

    #trips-timeline {
      overflow-y: auto;
      height: 60%;
      padding-left:15px;

      ::ng-deep {
        .p-timeline-event-content .trip-event>div:first-child {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .p-timeline-event-opposite {
          display: none;
        }

        .p-timeline-event-separator {
          min-width: 32px;
        }

        .p-timeline-event-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
      }

      .start-separator {
        border-top: 2px solid #000;
        margin-left: calc(-1rem - 32px);
        padding-left: calc(1rem + 32px);
      }

      .end-separator {
        border-bottom: 2px solid #000;
        margin-left: calc(-1rem - 32px);
        padding-left: calc(1rem + 32px);
      }
    }
  `]
})
export class TripMapComponent {
  private _tripData: TripEventsDTO | null = null;
  protected timelineEvents: TimelineEventsDTO | null = null;

  protected showSidePanel = true;
  protected showTimeline = false;

  protected lastTripPositionTime: string | null = null;
  protected lastPositionTime: string | null = null;

  private map: L.Map | null = null;
  private featureGroup: L.FeatureGroup = L.featureGroup();

  protected isMapVisible = true

  non_geoloc : boolean = false;
  constructor(
    protected tripsService: TripsService,
    protected tilesService: TilesService
  ) {
    this.non_geoloc = location.pathname.indexOf('-non-geoloc')>0
    console.log("=== trip-map.component.ts constructor")
  }

  @Input() set tripGeoloc(geoloc : boolean | null){
    if(geoloc == null){
      return;
    }
    this.isMapVisible = geoloc
  }

  @Input() set tripData(tripEventsDTO: TripEventsDTO | null) {
    if (!tripEventsDTO) {
      return;
    }
    this._tripData = tripEventsDTO;
    this.timelineEvents = this.tripsService.tripEventsToTimelineEventsDTO(tripEventsDTO);
    console.log(this.timelineEvents);

    // Set last position times if they should be displayed
    const beforeLastEvent = this.timelineEvents.tripEvents.at(-2);
    if (beforeLastEvent?.originalEvent?.eventType === TripEventType.TRIP_EXPECTATION) {
      this.lastTripPositionTime = this.tripsService.formatDateToMinutes(
        beforeLastEvent!.originalEvent.start
      );
    } else {
      this.lastTripPositionTime = null;
    }
    const lastEvent = this.timelineEvents.tripEvents.at(-1);
    if (lastEvent && [TripEventType.VEHICLE_RUNNING, TripEventType.VEHICLE_IDLE, TripEventType.VEHICLE_PARKED].includes(lastEvent.originalEvent.eventType)) {
      this.lastPositionTime = this.tripsService.formatDateToMinutes(
        lastEvent.originalEvent.eventType === TripEventType.VEHICLE_PARKED ? lastEvent.originalEvent.end : lastEvent.originalEvent.start
      );
      if (this.lastTripPositionTime === null) this.lastTripPositionTime = this.lastPositionTime;
    } else {
      this.lastPositionTime = null;
    }

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
        const poiMarker = new CustomMarkerImpl([tripEvent.lat, tripEvent.lng])
          .setIcon(this.getIcon(tripEvent.eventType, tripEvent.color, tripEventsDTO.vehicleCategory.toLowerCase()));

        // Ajout de la propriété personnalisée pour associer l'index du TripEventDTO
        (<any>poiMarker.options).tripEventIndex = tripEvent.index;

        poiMarker
          .addTo(this.featureGroup)
          .bindPopup(
            `<b>${popupLabel}</b><br>${tripEvent.address}<br>${tripEvent.start?.toLocaleTimeString() ?? ''} - ${tripEvent.end?.toLocaleTimeString() ?? ''}`
          );
      }
      // add trace to map
      if ([TripEventType.TRIP, TripEventType.TRIP_EXPECTATION].includes(tripEvent.eventType) && tripEvent.trace) {
        // Si trace est un tableau, on itère sur chaque segment
        tripEvent.trace.forEach(segment => {
          if (segment) {
            const geoJSON = WKTParse(segment);
            if (geoJSON === null || geoJSON.type !== 'LineString') {
              alert('Erreur lors de la récupération de la trace');
              return;
            }
            const geoLayer = L.geoJson(geoJSON, {
              style: {
                color: tripEvent.color || 'blue',
                dashArray: tripEvent.eventType === TripEventType.TRIP_EXPECTATION ? '4' : undefined
              }
            });
            // Ajout de la propriété personnalisée pour associer l'index du TripEventDTO
            (<any>geoLayer.options).tripEventIndex = tripEvent.index;
            geoLayer.addTo(this.featureGroup);
          }
        });
      }
    });
    const allSubTripEvents: { timestamp: Date, lat: number, lng: number, type: string }[] = [];

    this._tripData?.tripEvents.forEach(event => {
      if (event.tripEventDetails && event.tripEventDetails.length > 0) {
        event.tripEventDetails.forEach(sub => {
          if (sub.timestamp && sub.lat != null && sub.lng != null) {
            allSubTripEvents.push({
              timestamp: new Date(sub.timestamp),
              lat: sub.lat,
              lng: sub.lng,
              type: sub.type
            });
          }
        });
      }
    });

    // Trier les subTripEvents par timestamp
    allSubTripEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Parcourir la liste pour former des paires START puis END
    for (let i = 0; i < allSubTripEvents.length; i++) {
      const subEvent = allSubTripEvents[i];
      if (subEvent.type === 'START_LUNCH_BREAK') {
        // Chercher le prochain END_LUNCH_BREAK
        const endEvent = allSubTripEvents.find((s, j) => j > i && s.type === 'END_LUNCH_BREAK');
        if (endEvent) {
          // Créer une polyline reliant ces deux points
          const polyline = L.polyline(
            [
              [subEvent.lat, subEvent.lng],
              [endEvent.lat, endEvent.lng]
            ],
            {
              color: 'green',
              dashArray: '5, 10',
              weight: 3
            }
          );
          polyline.addTo(this.featureGroup);
        }
      }
    }

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

  private applyEventsHiglightedStyle( indexes: number[], fillColor: string, weight: number, highlightMarker: boolean ): void {
    indexes.forEach(index => {
      const layers = this.getLayersByTripEventIndex(index);
      if (layers.length === 0) {
        console.warn(`applyEventsHiglightedStyle: Aucun layer trouvé pour tripEventIndex ${index}`);
      }
      layers.forEach(layer => {
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
    });
  }

// Fonction utilitaire pour retrouver tous les layers par tripEventIndex
  private getLayersByTripEventIndex(eventIndex: number): L.Layer[] {
    const layers = this.featureGroup.getLayers();
    return layers.filter(layer => (<any>layer.options).tripEventIndex === eventIndex);
  }

// Méthode refactorisée pour l'événement MouseEnter
  onTripEventMouseEnter(event: TimelineEventDTO): void {
    if (![
      TimelineEventType.TRIP,
      TimelineEventType.TRIP_EXPECTATION,
      TimelineEventType.VEHICLE_IDLE,
      TimelineEventType.VEHICLE_RUNNING,
      TimelineEventType.VEHICLE_PARKED,
      TimelineEventType.STOP,
      TimelineEventType.LUNCH_TRIP_BEFORE_START,
      TimelineEventType.LUNCH_TRIP_AFTER_STOP,
      TimelineEventType.LUNCH_STOP_BEFORE_START,
      TimelineEventType.LUNCH_STOP_AFTER_STOP,
    ].includes(event.type)) return;

    const fillColor = 'blue';
    const weight = 5;
    const highlightMarker = true;

    if (event.originalEvent.sourceIndexes && event.originalEvent.sourceIndexes.length > 0) {
      this.applyEventsHiglightedStyle(event.originalEvent.sourceIndexes, fillColor, weight, highlightMarker);
    } else {
      // Récupérer tous les layers correspondant à event.originalEvent.index
      const layers = this.getLayersByTripEventIndex(event.originalEvent.index);
      if (layers.length === 0) {
        console.warn(`onTripEventMouseEnter: No layer found with tripEventIndex ${event.originalEvent.index}`);
        return;
      }
      layers.forEach(layer => {
        if (event.originalEvent.eventType === TripEventType.TRIP && layer instanceof L.GeoJSON) {
          layer.setStyle({ fillColor: fillColor, weight: weight });
        } else if (layer instanceof L.Marker) {
          const element = layer.getElement();
          if (element) {
            element.classList.add('highlighted-marker');
          } else {
            console.warn("onTripEventMouseEnter: No DOM element found for Marker with tripEventIndex", event.originalEvent.index);
          }
        }
      });
    }
  }

// Méthode refactorisée pour l'événement MouseLeave
  onTripEventMouseLeave(event: TimelineEventDTO): void {
    if (![
      TimelineEventType.TRIP,
      TimelineEventType.TRIP_EXPECTATION,
      TimelineEventType.VEHICLE_IDLE,
      TimelineEventType.VEHICLE_RUNNING,
      TimelineEventType.VEHICLE_PARKED,
      TimelineEventType.STOP,
      TimelineEventType.LUNCH_TRIP_BEFORE_START,
      TimelineEventType.LUNCH_TRIP_AFTER_STOP,
      TimelineEventType.LUNCH_STOP_BEFORE_START,
      TimelineEventType.LUNCH_STOP_AFTER_STOP,
    ].includes(event.type)) return;

    const fillColor = 'blue';
    const weight = 3;
    const highlightMarker = false;

    if (event.originalEvent.sourceIndexes && event.originalEvent.sourceIndexes.length > 0) {
      this.applyEventsHiglightedStyle(event.originalEvent.sourceIndexes, fillColor, weight, highlightMarker);
    } else {
      // Récupérer tous les layers correspondant à event.originalEvent.index
      const layers = this.getLayersByTripEventIndex(event.originalEvent.index);
      if (layers.length === 0) {
        console.warn(`onTripEventMouseLeave: No layer found with tripEventIndex ${event.originalEvent.index}`);
        return;
      }
      layers.forEach(layer => {
        if (event.originalEvent.eventType === TripEventType.TRIP && layer instanceof L.GeoJSON) {
          layer.setStyle({ fillColor: fillColor, weight: weight });
        } else if (layer instanceof L.Marker) {
          const element = layer.getElement();
          if (element) {
            element.classList.remove('highlighted-marker');
          } else {
            console.warn("onTripEventMouseLeave: No DOM element found for Marker with tripEventIndex", event.originalEvent.index);
          }
        }
      });
    }
  }

  onTripEventClick(event: TimelineEventDTO): void {
    if (![
      TimelineEventType.VEHICLE_IDLE,
      TimelineEventType.VEHICLE_RUNNING,
      TimelineEventType.VEHICLE_PARKED,
      TimelineEventType.STOP,
      TimelineEventType.LUNCH_STOP_BEFORE_START,
      TimelineEventType.LUNCH_STOP_AFTER_STOP,
    ].includes(event.type)) return;

    // Récupérer tous les layers associés à l'index de l'événement
    const layers = this.getLayersByTripEventIndex(event.originalEvent.index);

    // Sélectionner le premier layer qui est un Marker
    const targetLayer = layers.find(layer => layer instanceof L.Marker) as L.Marker | undefined;

    if (targetLayer) {
      const latLng = targetLayer.getLatLng();
      const zoom = this.map!.getZoom();
      const bounds = this.map!.getBounds();
      this.map!.flyTo(
        [
          latLng.lat,
          latLng.lng + (this.showSidePanel ? (bounds.getEast() - bounds.getWest()) * 0.175 : 0)
        ],
        zoom
      );
      targetLayer.openPopup();
    } else {
      console.warn(`onTripEventClick: Aucun Marker trouvé pour tripEventIndex ${event.originalEvent.index}`);
    }
  }

  private getIcon(eventType: TripEventType.STOP | TripEventType.VEHICLE_RUNNING | TripEventType.VEHICLE_IDLE | TripEventType.VEHICLE_PARKED, color: string | null, category: string): L.DivIcon {
    switch (eventType) {
      case TripEventType.STOP:
      case TripEventType.VEHICLE_PARKED:
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
  protected readonly TimelineEventType = TimelineEventType;
  protected readonly TripStatus = TripStatus;
  protected readonly Math = Math;
}
