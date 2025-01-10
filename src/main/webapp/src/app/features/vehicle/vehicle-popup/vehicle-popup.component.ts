import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import {PoiService} from "../../poi/poi.service";
import {dto} from "../../../../habarta/dto";
import {LayerEvent, LayerEventType} from "../../../core/cartography/layer/layer.event";
import {PopUpConfig} from "../../../core/cartography/marker/pop-up-config";
import {EntityType} from "../../../core/cartography/marker/MarkerFactory";
import {SmsApiService, SmsForm, SmsPackForm, SmsStatistics} from "../../../services/sms-api.service";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-vehicle-popup',
  template: `
    <img *ngIf="entity.device.plugged == false"
      src="../../../../assets/icon/unplugged.svg"
      alt="unplugged"
      style="position: absolute; top: 10px; right: 10px; width: 40px; height: auto; padding: 0 5px;"
    />
    <div class="vehicle-popup">
      <p-tabView [(activeIndex)]="activeTabIndex" (onChange)="onTabChange($event)">
        <!-- Onglet Information -->
        <p-tabPanel header="Information" *ngIf="popUpConfig.isTabEnabled(entityType, 'information')">
          <div class="p-field">
            <label><strong>Conducteur:</strong></label>
            <span *ngIf="entity.driver; else noDriver">
                {{ entity.driver.firstName }} {{ entity.driver.lastName || 'Véhicule non attribué' }}
            </span>
            <ng-template #noDriver>
              <span>Véhicule non attribué</span>
            </ng-template>
          </div>
          <div class="p-field">
            <label><strong>Plaque d'immatriculation:</strong></label>
            <span>{{entity.licenseplate || "Aucune plaque d'immatriculation" }}</span>
          </div>
          <div class="p-field">
            <label><strong>Équipe:</strong></label>
            <span>{{ entity.team.label }}</span>
          </div>
          <div class="p-field">
            <label><strong>Catégorie:</strong></label>
            <span>{{ entity.category.label }}</span>
          </div>
          <div class="p-field">
            <label><strong>Dernière communication:</strong></label>
            <span>{{ entity.device.lastCommunicationDate | date:'short' }}</span>
          </div>
        </p-tabPanel>

        <!-- Onglet POI -->
        <p-tabPanel header="POI" *ngIf="popUpConfig.isTabEnabled(entityType, 'poi')">
          <h4>Liste des POIs les plus proches :</h4>
          <p-progressSpinner *ngIf="loadingNearbyPOIs" styleClass="custom-spinner"></p-progressSpinner>
          <p *ngIf="!loadingNearbyPOIs && nearbyPOIs.length === 0">
            Aucun POI trouvé à proximité.
          </p>
          <div *ngIf="!loadingNearbyPOIs && nearbyPOIs.length > 0">
            <div *ngFor="let poi of nearbyPOIs" class="poi-item">
              <div>
                <strong>{{ (poi.poi.client_code?? '0000') + "" + poi.poi.client_label }}</strong> - {{ poi.poi.category.label }} - Distance
                : {{ poi.distance | number:'1.0-2' }} km
              </div>
              <div class="poi-actions">
                <button pButton label="Centrer sur ce POI" icon="pi pi-search-plus"
                        (click)="centerMapOnPOI(poi.poi)"
                        style="background-color: #aa001f; border: #aa001f;"></button>
                <button
                  pButton
                  [label]="isMarkerHighlighted('poi-' + poi.poi.id) ? 'Désactiver surbrillance' : 'Mettre en surbrillance'"
                  [icon]="isMarkerHighlighted('poi-' + poi.poi.id) ? 'pi pi-eye-slash' : 'pi pi-eye'"
                  (click)="toggleHighlightMarker('poi-' + poi.poi.id)"
                  style="background-color: #515151; border: #515151;"
                ></button>
              </div>
            </div>
          </div>
        </p-tabPanel>

        <!-- Onglet Envoyer un SMS -->
        <p-tabPanel *ngIf="entity.driver != null" header="Envoyer un SMS">
          <app-sms-form
            [driverLabel]="entity.driver?.firstName + ' ' + entity.driver?.lastName"
            [phoneNumber]="entity.driver?.phoneNumber || ''"
            [callingCode]="'+33'"
            [companyName]="'Normandie Manutention'"
            (smsSent)="onSmsSent()"
            (packPurchased)="onPackPurchased()"
          >
          </app-sms-form>
        </p-tabPanel>

      </p-tabView>
    </div>
  `,
  styles: [`
    .p-grid > .p-col-6 {
      padding: 0 0.5rem;
    }

    .p-field label {
      display: block;
      margin-bottom: 0.5rem;
    }

    .error {
      color: red;
      font-size: 0.8em;
    }

    .p-field.p-grid {
      align-items: center;
    }

    .p-field.p-grid label {
      margin-bottom: 0;
    }

    .vehicle-popup {
    }
    .p-field {
      margin-bottom: 1rem;
    }
    .poi-item {
      border: 1px solid #ccc;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 5px;
    }
    .poi-actions {
      margin-top: 10px;
      display: flex;
      gap: 5px;
    }
    .custom-spinner {
      display: block;
      margin: 0 auto;
    }
  `]
})
export class VehiclePopupComponent implements OnInit {
  @Input() popUpConfig: PopUpConfig;
  entityType: EntityType = EntityType.VEHICLE;
  @Input() entity: dto.VehicleSummaryDTO;
  @Output() layerEvent = new EventEmitter<LayerEvent>();
  nearbyPOIs: any[] = [];
  loadingNearbyPOIs: boolean = false;
  smsStatistics: SmsStatistics | null = null;
  smsPackFormGroup: FormGroup;
  smsFormGroup: FormGroup;
  smsForm: SmsForm
  activeTabIndex: number = 0;
  tabNames: string[] = ['information', 'poi'];
  highlightedStates: { [markerId: string]: boolean } = {};

  constructor(
    private smsApiService: SmsApiService,
    private poiService: PoiService,
    private formBuilder: FormBuilder
  ) {

    // Initialisation du formulaire d'achats de pack de SMS
    this.smsPackFormGroup = this.formBuilder.group({
      totalSms: [null, [Validators.required, Validators.min(1)]]
    });

    // Initialisation du formulaire d'envoi de SMS
    this.smsFormGroup = this.formBuilder.group({
      callingCode: [{ value: '+33', disabled: true }], // Indicatif téléphonique désactivé
      phoneNumber: [{ value: '', disabled: true }],    // Numéro de téléphone désactivé
      content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(160)]]
    });
  }

  ngOnInit() {
    // Initialiser l'onglet actif
    this.activeTabIndex = this.tabNames.indexOf('information');
    // Charger les POIs si l'onglet POI est activé par défaut
    if (this.activeTabIndex === this.tabNames.indexOf('poi')) {
      this.loadNearbyPOIs();
    }
    this.smsForm = {
      userName: '',
      callingCode: '+33',
      phoneNumber: this.entity.driver?.phoneNumber ?? null,
      content: ''
    };

    this.loadSmsStatistics();
    this.smsFormGroup.patchValue({
      phoneNumber: this.entity.driver?.phoneNumber || '',
      callingCode: '+33'
    });
    console.log(this.entity)
  }

  loadSmsStatistics(): void {
    this.smsApiService.getSmsStatistics().subscribe({
      next: (response) => {
        this.smsStatistics = response;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des statistiques des SMS:', err);
      }
    });
  }

  onTabChange(event: any) {
    this.activeTabIndex = event.index;
    const tabName = this.tabNames[this.activeTabIndex];
    this.selectTab(tabName);
  }

  selectTab(tab: string) {
    this.activeTabIndex = this.tabNames.indexOf(tab);
    if (tab === 'poi' && this.nearbyPOIs.length === 0 && !this.loadingNearbyPOIs) {
      this.loadNearbyPOIs();
    }
  }

  loadNearbyPOIs() {
    this.loadingNearbyPOIs = true;
    const latitude = this.entity.device.coordinate?.coordinates[1] ?? 0.0;
    const longitude = this.entity.device.coordinate?.coordinates[0] ?? 0.0;
    this.poiService.getNearestPOIsWithDistance(latitude, longitude, 3).subscribe({
      next: (response) => {
        this.nearbyPOIs = response.map((pair: any) => {
          return {
            distance: pair.first,
            poi: pair.second,
          };
        });
        this.loadingNearbyPOIs = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des POIs les plus proches:', error);
        this.loadingNearbyPOIs = false;
      },
    });
  }

  centerMapOnPOI(poi: any) {
    const coordinates = poi.coordinate.coordinates;
    this.layerEvent.emit({
      type: LayerEventType.ZoomToCoordinates,
      payload: { coordinates }
    });
  }

  toggleHighlightMarker(markerId: string) {
    this.highlightedStates[markerId] = !this.highlightedStates[markerId];
    const eventType = this.highlightedStates[markerId]
      ? LayerEventType.HighlightMarker
      : LayerEventType.RemoveHighlightMarker;
    this.layerEvent.emit({
      type: eventType,
      payload: { markerID: markerId }
    });
    this.showAllHighlightedMarkers();
  }

  isMarkerHighlighted(markerId: string): boolean {
    return this.highlightedStates[markerId] || false;
  }

  showAllHighlightedMarkers() {
    this.layerEvent.emit({
      type: LayerEventType.ZoomToHighlightedMarkersIncludingCoords,
      payload: {
        lat: this.entity.device.coordinate?.coordinates[1] ?? 0.0,
        lng: this.entity.device.coordinate?.coordinates[0] ?? 0.0,
      }
    });
  }

  onSmsSent() {
    console.log('SMS envoyé.');
  }

  onPackPurchased() {
    console.log('Pack SMS acheté.');
  }
}

