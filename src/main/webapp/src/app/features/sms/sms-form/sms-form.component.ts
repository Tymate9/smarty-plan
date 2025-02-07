import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SmsApiService, SmsForm, SmsPackForm, SmsStatistics} from "../../../services/sms-api.service";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {ButtonDirective} from "primeng/button";
import {NgIf} from "@angular/common";
import {TableModule} from "primeng/table";
import {NotificationService} from "../../../commons/notification/notification.service";

@Component({
  selector: 'app-sms-form',
  template: `
    <div class="sms-form-container">
      <!-- (A) Affichage des statistiques SMS -->
      <h4>SMS disponible</h4>
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

      <!--      &lt;!&ndash; (B) Achat de pack SMS &ndash;&gt;
            <div class="sms-pack-form" style="margin-top: 1rem;">
              <h5>Achat de pack SMS</h5>
              <form [formGroup]="smsPackFormGroup" (ngSubmit)="buySmsPack()">
                <div class="p-field">
                  <label for="totalSms">Quantité à acheter :</label>
                  <input
                    id="totalSms"
                    type="number"
                    formControlName="totalSms"
                    class="p-inputtext"
                  />
                  <div
                    *ngIf="
                      smsPackFormGroup.get('totalSms')?.invalid &&
                      (smsPackFormGroup.get('totalSms')?.touched ||
                        smsPackFormGroup.get('totalSms')?.dirty)
                    "
                    class="error"
                  >
                    <small *ngIf="smsPackFormGroup.get('totalSms')?.errors?.['required']"
                      >Ce champ est requis.</small
                    >
                    <small *ngIf="smsPackFormGroup.get('totalSms')?.errors?.['min']"
                      >La quantité doit être >= 1</small
                    >
                  </div>
                </div>
                <button
                  pButton
                  type="submit"
                  label="Acheter"
                  [disabled]="smsPackFormGroup.invalid"
                  style="background-color: #aa001f; border: #aa001f;"
                ></button>
              </form>
            </div>-->

      <!-- (C) Formulaire d'envoi de SMS -->
      <div class="sms-send-form" style="margin-top: 2rem;">
        <h5 *ngIf="driverLabel">
          Envoyer un SMS à {{ driverLabel }}
        </h5>

        <form [formGroup]="smsFormGroup" (ngSubmit)="sendSms()">
          <div class="flex flex-row flex-wrap">
            <!-- Indicatif -->
            <div class="col-4">
              <div class="p-field">
                <label>Indicatif :</label>
                <input
                  id="callingCode"
                  type="text"
                  formControlName="callingCode"
                  class="p-inputtext"
                />
              </div>
            </div>
            <!-- Numéro de téléphone -->
            <div class="col-4">
              <div class="p-field">
                <label>Numéro de téléphone :</label>
                <input
                  id="phoneNumber"
                  type="text"
                  formControlName="phoneNumber"
                  class="p-inputtext"
                />
              </div>
            </div>
          </div>

          <!-- Contenu -->
          <div class="p-field">
            <label for="content">Message :</label>
            <br/>
            <textarea
              id="content"
              formControlName="content"
              rows="5"
              [style.width.px]="600"
            ></textarea>
            <div
              *ngIf="
                smsFormGroup.get('content')?.invalid &&
                (smsFormGroup.get('content')?.dirty ||
                  smsFormGroup.get('content')?.touched)
              "
              class="error"
            >
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

          <button
            pButton
            type="submit"
            label="Envoyer"
            [disabled]="smsFormGroup.invalid || isSmsExhausted"
            style="background-color: #aa001f; border: #aa001f;"
          >
          </button>
        </form>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    ButtonDirective,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    TableModule
  ],
  styles: [`
    .sms-form-container {
      color: #000; /* texte en noir */

      /* éventuellement centrer */
      margin: 0 auto;
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #fff;
    }

    .sms-form-container h2, .sms-form-container h3 {
      margin-top: 0;
      margin-bottom: 0.75rem;
    }

    .info-section {
      margin-bottom: 0.75rem;
    }

    .info-section label {
      font-weight: bold;
      display: block;
      margin-bottom: 4px;
    }

    .info-section span {
      /* texte du destinataire, etc. */
      font-style: italic;
      color: #333;
    }

    /* Style du <form> d’envoi de SMS */
    .sms-form, .sms-pack-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .sms-form label, .sms-pack-form label {
      font-weight: bold;
      margin-bottom: 4px;
    }

    .sms-form textarea, .sms-pack-form input {
      padding: 6px;
      border-radius: 4px;
      border: 1px solid #ccc;
      resize: none; /* pour textarea, pas de redimension */
      font-family: inherit;
      font-size: 14px;
      color: #333;
    }

    .error {
      color: red;
      font-size: 0.9rem;
    }

    /* style des boutons */
    .sms-form button, .sms-pack-form button {
      padding: 8px 12px;
      border-radius: 4px;
      border: none;
      background-color: #aa001f;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .sms-form button:hover, .sms-pack-form button:hover {
      background-color: #8e001b;
    }

    .sms-form button:disabled, .sms-pack-form button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class SmsFormComponent implements OnInit {

  @Input() driverLabel?: string;

  @Input() callingCode: string = '+33';

  @Input() phoneNumber: string = '';

  @Input() companyName: string = 'Normandie Manutention';

  smsStatistics: SmsStatistics | null = null;

  @Output() smsSent = new EventEmitter<void>();
  @Output() packPurchased = new EventEmitter<void>();

  // FormGroup pour acheter un pack
  smsPackFormGroup!: FormGroup;
  // FormGroup pour envoyer un SMS
  smsFormGroup!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private smsApiService: SmsApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Initialiser les formulaires
    this.initForms();

    // Charger automatiquement les stats SMS
    this.loadSmsStatistics();
  }

  get isSmsExhausted(): boolean {
    // Renvoie true si smsStatistics est défini ET que smsAvailable = 0
    return this.smsStatistics?.smsAvailable === 0;
  }

  private initForms() {
    // Achat de pack
    this.smsPackFormGroup = this.fb.group({
      totalSms: [null, [Validators.required, Validators.min(1)]]
    });

    // Envoi de SMS
    this.smsFormGroup = this.fb.group({
      callingCode: [this.callingCode],
      phoneNumber: [this.phoneNumber],
      content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(160)]]
    });
  }

  /**
   * Récupère les statistiques (total SMS, etc.)
   */
  private loadSmsStatistics() {
    this.smsApiService.getSmsStatistics().subscribe({
      next: (stats) => {
        this.smsStatistics = stats;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des stats SMS:', err);
      }
    });
  }

  /**
   * Achat d'un pack de SMS
   */
  buySmsPack(): void {
    if (this.smsPackFormGroup.invalid) {
      return;
    }
    const packForm: SmsPackForm = {
      companyName: this.companyName,
      totalSms: this.smsPackFormGroup.value.totalSms
    };
    this.smsApiService.buySmsPack(packForm).subscribe({
      next: (response) => {
        console.log('Pack SMS acheté avec succès:', response);
        // On recharge les stats
        this.loadSmsStatistics();
        // On reset le form
        this.smsPackFormGroup.reset();
        // Notifier le parent
        this.packPurchased.emit();
      },
      error: (err) => {
        console.error('Erreur lors de l\'achat du pack SMS:', err);
      }
    });
  }

  /**
   * Envoi d'un SMS
   */
  sendSms(): void {
    if (this.smsFormGroup.invalid) {
      return;
    }
    const val = this.smsFormGroup.value;
    const smsForm: SmsForm = {
      userName: '',
      callingCode: val.callingCode,
      phoneNumber: val.phoneNumber,
      content: val.content
    };

    this.smsApiService.sendSms(smsForm).subscribe({
      next: (resp) => {
        this.notificationService.success("SMS", "SMS transmis.")
        // On recharge les stats
        this.loadSmsStatistics();
        // Reset du champ content
        this.smsFormGroup.get('content')?.reset('');
        // Événement parent
        this.smsSent.emit();
      },
      error: (err) => {
        this.notificationService.error("SMS", "Une erreur est survenue lors de la transmission du SMS veuillez réessayé ulterieurement.")
        console.error('Erreur lors de l\'envoi du SMS:', err);
      }
    });
  }
}
