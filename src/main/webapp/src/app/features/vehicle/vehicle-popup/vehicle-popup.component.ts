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
    <div class="vehicle-popup">
      <p-tabView [(activeIndex)]="activeTabIndex" (onChange)="onTabChange($event)">
        <!-- Onglet Information -->
        <p-tabPanel header="Information" *ngIf="popUpConfig.isTabEnabled(entityType, 'information')">
          <div class="p-field">
            <label><strong>Conducteur:</strong></label>
            <span>{{ entity.driver?.firstName + ' ' + (entity.driver?.lastName || 'Aucun conducteur') }}</span>
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
        <p-tabPanel header="Envoyer un SMS">
            <h4>Forfait SMS Enovea</h4>

            <p-table [value]="[smsStatistics]" *ngIf="smsStatistics">
              <ng-template pTemplate="header">
                <tr>
                  <th>Total SMS achetés</th>
                  <th>Total SMS envoyés</th>
                  <th>SMS disponibles</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-stat>
                <tr>
                  <td>{{ stat.totalPurchasedSms }}</td>
                  <td>{{ stat.totalSentSms }}</td>
                  <td>{{ stat.smsAvailable }}</td>
                </tr>
              </ng-template>
            </p-table>
          <h4>Envoyer un SMS à {{ entity.driver?.firstName + " " + entity.driver?.lastName }}</h4>
          <form [formGroup]="smsFormGroup" (ngSubmit)="sendSms()">
            <!-- Ligne pour l'indicatif et le numéro de téléphone -->
            <div class="flex flex-row flex-wrap">
              <!-- Champ Indicatif -->
              <div class="col-4">
                <div class="p-field">
                  <label for="callingCode">Indicatif :</label>
                  <input id="callingCode" type="text" formControlName="callingCode" [disabled]="true"
                         class="p-inputtext"/>
                </div>
              </div>
              <!-- Champ Numéro de téléphone -->
              <div class="col-4">
                <div class="p-field">
                  <label for="phoneNumber">Numéro de téléphone :</label>
                  <input id="phoneNumber" type="text" formControlName="phoneNumber" [disabled]="true"
                         class="p-inputtext"/>
                </div>
              </div>
            </div>
            <!-- Champ Message -->
            <div class="p-field">
              <label for="content">Message :</label>
              <textarea id="content" formControlName="content" rows="5" [style.width.px]=600></textarea>
              <div
                *ngIf="smsFormGroup.get('content')?.invalid && (smsFormGroup.get('content')?.dirty || smsFormGroup.get('content')?.touched)"
                class="error">
                <div *ngIf="smsFormGroup.get('content')?.errors?.['required']">
                  Le message est requis.
                </div>
                <div *ngIf="smsFormGroup.get('content')?.errors?.['minlength']">
                  Le message doit contenir au moins 1 caractère.
                </div>
                <div *ngIf="smsFormGroup.get('content')?.errors?.['maxlength']">
                  Le message ne doit pas dépasser 160 caractères.
                </div>
              </div>
            </div>
            <button pButton type="submit" label="Envoyer" [disabled]="smsFormGroup.invalid" style="background-color: #aa001f; border: #aa001f;"></button>
          </form>
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
      phoneNumber: this.entity.driver!.phoneNumber!,
      content: ''
    };
    this.loadSmsStatistics();
    this.smsFormGroup.patchValue({
      phoneNumber: this.entity.driver?.phoneNumber || '',
      callingCode: '+33' // Vous pouvez ajuster si nécessaire
    });
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

  buySmsPack(): void {
    if (this.smsPackFormGroup.invalid) {
      return;
    }

    const packForm: SmsPackForm = {
      companyName: 'Normandie Manutention',
      totalSms: this.smsPackFormGroup.value.totalSms
    };

    this.smsApiService.buySmsPack(packForm).subscribe({
      next: (response) => {
        console.log('Pack de SMS acheté avec succès:', response);
        this.loadSmsStatistics();
        this.smsPackFormGroup.reset();
      },
      error: (err) => {
        console.error('Erreur lors de l\'achat du pack SMS:', err);
      }
    });
  }

  sendSms(): void {
    if (this.smsFormGroup.invalid) {
      return;
    }

    const smsForm: SmsForm = {
      userName: '', //TODO(Ajouter le nom d'utilisateur provenant de Keycloak)
      callingCode: this.smsFormGroup.get('callingCode')?.value,
      phoneNumber: this.smsFormGroup.get('phoneNumber')?.value,
      content: this.smsFormGroup.get('content')?.value
    };

    this.smsApiService.sendSms(smsForm).subscribe({
      next: (response) => {
        console.log('SMS envoyé avec succès:', response);
        // Réinitialiser le champ de contenu après envoi
        this.smsFormGroup.get('content')?.reset();
      },
      error: (err) => {
        console.error('Erreur lors de l\'envoi du SMS:', err);
      }
    });
    this.loadSmsStatistics();
  }
}

