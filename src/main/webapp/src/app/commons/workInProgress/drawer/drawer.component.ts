import {
  Component,
  Input,
  AfterViewInit,
  Type,
  ViewChild,
  ViewContainerRef,
  OnDestroy
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { PrimeTemplate } from 'primeng/api';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NgIf, NgClass } from '@angular/common';
import {Drawer} from "primeng/drawer";

/**
 * Interface pour la configuration d'un composant enfant dynamique
 */
export interface DynamicChildConfig {
  compClass: Type<any>;
  inputs?: { [key: string]: any };
}

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [
    ButtonDirective,
    PrimeTemplate,
    NgIf,
    NgClass,
    Drawer
  ],
  providers: [
    MessageService
  ],
  template: `
    <!-- Bouton déclencheur du drawer -->
    <button pButton type="button" (click)="openSidebar()" [label]="buttonText">
      <ng-container *ngIf="icon; else noIcon">
        <ng-container *ngIf="isIconClass(icon); else imgIcon">
          <i [ngClass]="icon" style="margin-right: 0.5em;"></i>
        </ng-container>
        <ng-template #imgIcon>
          <img [src]="icon" alt="Icon" style="height: 1em; margin-right: 0.5em;">
        </ng-template>
      </ng-container>
      <ng-template #noIcon></ng-template>
    </button>

    <!-- Sidebar PrimeNG -->
    <p-drawer
      [(visible)]="visible"
      [modal]="true"
      [autoZIndex]="true"
      [dismissible] = "true"
      [position]="position"
      [closable]="showCloseIcon"
      (onShow)="onSidebarShow()"
    >
      <!-- Header -->
      <ng-template pTemplate="header">
        <div class="drawer-header">
          <span>{{ headerTitle }}</span>
        </div>
      </ng-template>

      <!-- Contenu du drawer : Soit composant dynamique, soit ng-content -->
      <ng-template pTemplate="content" >
        <ng-container *ngIf="child; else staticContent">
          <ng-container #childHost></ng-container>
        </ng-container>
        <ng-template #staticContent>
          <ng-content ></ng-content>
        </ng-template>
      </ng-template>

      <!-- Footer -->
      <ng-template pTemplate="footer">
        <div class="drawer-footer">
        </div>
      </ng-template>
    </p-drawer>
  `,
  styles: [`
    .drawer-header {
      display: flex;
      align-items: center;
      font-weight: bold;
    }
    .drawer-footer {
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class DrawerComponent implements AfterViewInit, OnDestroy {

  /** Configuration pour insérer un composant enfant dynamiquement */
  @Input() child?: DynamicChildConfig;

  /** Référence sur l’ancre où on insère le composant enfant */
  @ViewChild('childHost', { read: ViewContainerRef }) childHost!: ViewContainerRef;

  /** Instance du composant enfant (si utilisé dynamiquement) */
  private childComponentRef: any;

  /**
   * Textes / propriétés pour personnaliser le Drawer
   */
  @Input() buttonText: string = 'Open Drawer';
  @Input() icon: string = '';
  @Input() headerTitle: string = 'Titre du Drawer';
  @Input() styleClass: string = '';
  @Input() position: 'left' | 'right' | 'top' | 'bottom' = 'right';
  @Input() showCloseIcon: boolean = true;

  /**
   * Message de confirmation lors de la fermeture du drawer (optionnel).
   * S’il est défini, on ouvre un confirmDialog PrimeNG quand on veut fermer.
   */
  @Input() closeConfirmationMessage?: string;

  /** Contrôle la visibilité du drawer */
  private _visible: boolean = false;
  public get visible() {
    return this._visible
  }

  public set visible(value : boolean) {
    if (!value){
      if (!this.closeConfirmationMessage) {
        this._visible = false;
        this.destroyChildComponent();
      }
      else {
        this.confirmationService.confirm({
          message: this.closeConfirmationMessage,
          header: 'Confirmation',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
            this._visible = false
            this.destroyChildComponent();
          },
          reject: () => {
            this._visible = true;
          }
        });
      }
    }
    else {
      this._visible = value;
    }
  }



  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroyChildComponent();
  }

  /** Ouvre le drawer */
  openSidebar(): void {
    this._visible = true;
  }

  /**
   * Méthode appelée lorsque le drawer s'affiche.
   * On recrée le composant enfant dynamique si nécessaire.
   */
  onSidebarShow(): void {
    if (this.child) {
      this.createChildComponent();
    }
  }

  /** Crée dynamiquement l'enfant dans `childHost` */
  private createChildComponent(): void {
    if (this.child && this.childHost) {
      this.childHost.clear(); // Nettoie le contenu précédent
      this.childComponentRef = this.childHost.createComponent(this.child.compClass);
      if (this.child.inputs) {
        Object.assign(this.childComponentRef.instance, this.child.inputs);
      }
    }
  }

  /** Détruit le composant enfant pour éviter qu'il reste en mémoire */
  private destroyChildComponent(): void {
    if (this.childComponentRef) {
      this.childComponentRef.destroy();
      this.childComponentRef = null;
    }
  }

  /** Vérifie si `icon` est une classe CSS ou une URL */
  isIconClass(iconValue: string): boolean {
    if (!iconValue) return false;
    return iconValue.startsWith('pi ')
      || iconValue.startsWith('pi-')
      || iconValue.startsWith('fa ')
      || iconValue.startsWith('fa-');
  }
}
