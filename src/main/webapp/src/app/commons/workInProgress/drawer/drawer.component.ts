import {
  Component,
  Input,
  AfterViewInit,
  Type,
  ViewChild,
  ViewContainerRef,
  OnDestroy
} from '@angular/core';
import { PrimeTemplate } from 'primeng/api';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NgIf } from '@angular/common';
import { Drawer } from 'primeng/drawer';
import {DrawerService} from "../service/component/drawer.service";

/**
 * Interface pour la configuration d'un composant enfant dynamique
 */
export interface DynamicChildConfig {
  compClass: Type<any>;
  inputs?: { [key: string]: any };
}

/**
 * Interface pour les options du Drawer
 */
export interface DrawerOptions {
  headerTitle?: string;
  styleClass?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  showCloseIcon?: boolean;
  closeConfirmationMessage?: string;
  child?: DynamicChildConfig;
}

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [
    PrimeTemplate,
    NgIf,
    Drawer
  ],
  providers: [
    MessageService
  ],
  template: `
    <p-drawer
      [(visible)]="visible"
      [modal]="true"
      [autoZIndex]="true"
      [dismissible]="true"
      [position]="position"
      [closable]="showCloseIcon"
      (onShow)="onSidebarShow()"
      (onHide)="onSideBarHide()"
      [styleClass]="styleClass"
    >
      <!-- Header -->
      <ng-template pTemplate="header">
        <div class="drawer-header">
          <span>{{ headerTitle }}</span>
        </div>
      </ng-template>

      <!-- Contenu : Affiche le composant dynamique si configuré, sinon affiche le contenu statique via ng-content -->
      <ng-template pTemplate="content">
        <ng-container *ngIf="child; else staticContent">
          <ng-container #childHost></ng-container>
        </ng-container>
        <ng-template #staticContent>
          <ng-content></ng-content>
        </ng-template>
      </ng-template>

      <!-- Footer -->
      <ng-template pTemplate="footer">
        <div class="drawer-footer">
          <!-- Ajouter ici le contenu du footer si nécessaire -->
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

  /** Propriétés de configuration du Drawer */
  @Input() headerTitle: string = 'Titre du Drawer';
  @Input() styleClass: string = '';
  @Input() position: 'left' | 'right' | 'top' | 'bottom' = 'right';
  @Input() showCloseIcon: boolean = true;
  @Input() closeConfirmationMessage?: string;

  /**
   * Configuration pour insérer un composant enfant dynamique
   * (Si non défini, le contenu statique passé via ng-content sera affiché)
   */
  @Input() child?: DynamicChildConfig;
  @ViewChild('childHost', { read: ViewContainerRef }) childHost!: ViewContainerRef;
  private childComponentRef: any;

  /** Contrôle interne de la visibilité */
  public visible: boolean = false;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private drawerService: DrawerService
  ) {
    // Enregistrement de cette instance dans le service pour y accéder globalement
    this.drawerService.registerDrawer(this);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
  }

  /**
   * Méthode appelée lors de l'affichage du Drawer.
   * Crée dynamiquement le composant enfant si nécessaire.
   */
  onSidebarShow(): void {
    if (this.child) {
      this.createChildComponent();
    }
  }

  /** Crée dynamiquement l'enfant dans le conteneur */
  private createChildComponent(): void {
    if (this.child && this.childHost) {
      this.childHost.clear(); // Nettoyage de tout composant précédent
      this.childComponentRef = this.childHost.createComponent(this.child.compClass);
      if (this.child.inputs) {
        Object.assign(this.childComponentRef.instance, this.child.inputs);
      }
    }
  }

  /**
   * Ouvre le Drawer en appliquant, le cas échéant, les options de configuration fournies.
   * @param options Options pour personnaliser l'affichage du Drawer
   */
  public openDrawer(options?: DrawerOptions): void {
    if (options) {
      if (options.headerTitle !== undefined) {
        this.headerTitle = options.headerTitle;
      }
      if (options.styleClass !== undefined) {
        this.styleClass = options.styleClass;
      }
      if (options.position !== undefined) {
        this.position = options.position;
      }
      if (options.showCloseIcon !== undefined) {
        this.showCloseIcon = options.showCloseIcon;
      }
      if (options.closeConfirmationMessage !== undefined) {
        this.closeConfirmationMessage = options.closeConfirmationMessage;
      }
      if (options.child !== undefined) {
        this.child = options.child;
      }
    }
    this.visible = true;
  }

  /**
   * Ferme le Drawer.
   */
  public closeDrawer(): void {
    this.visible = false;
  }

  onSideBarHide() {
      // Si aucune confirmation n'est requise, on ferme directement
      if (!this.closeConfirmationMessage) {
        this.visible = false;
      } else {
        // Sinon, on affiche le dialogue de confirmation
        this.confirmationService.confirm({
          message: this.closeConfirmationMessage,
          header: 'Confirmation',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
            this.visible = false;
          },
          reject: () => {
            // En cas de refus, on garde le Drawer ouvert
            this.visible = true;
          }
        });
      }
  }
}
