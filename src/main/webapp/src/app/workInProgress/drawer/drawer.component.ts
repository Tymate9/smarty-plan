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
import { DrawerService } from "../service/component/drawer.service";

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
      [dismissible]="false"
      [closeOnEscape]="false"
      [position]="position"
      [closable]="false"
      (onShow)="onSidebarShow()"
      (onHide)="onTryClose()"
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
        <!-- Bouton Close que l'on contrôle nous-même -->
        <button type="button" (click)="onTryClose()">
          Fermer le Drawer
        </button>
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

  /**
   * Si tu souhaites toujours afficher un bouton close en haut,
   * tu pourrais le faire via un Input, ex. showCloseIcon: boolean.
   */
  @Input() closeConfirmationMessage?: string;

  /**
   * Configuration pour insérer un composant enfant dynamique
   */
  @Input() child?: DynamicChildConfig;

  @ViewChild('childHost', { read: ViewContainerRef }) childHost!: ViewContainerRef;
  private childComponentRef: any;

  /** Contrôle interne de la visibilité */
  private _visible: boolean = false;

  public get visible(){
    return this._visible;
  }

  public set visible(value: boolean){
    this._visible = value;
  }

  constructor(
    private confirmationService: ConfirmationService,
    private drawerService: DrawerService
  ) {
    // Enregistrement de cette instance dans le service pour y accéder globalement
    this.drawerService.registerDrawer(this);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    // Optionnel: détruire le composant enfant si on souhaite libérer des ressources
    if (this.childComponentRef) {
      this.childComponentRef.destroy();
    }
  }

  /**
   * Méthode appelée lors de l'affichage effectif du Drawer.
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
      this.childHost.clear(); // Nettoyage
      this.childComponentRef = this.childHost.createComponent(this.child.compClass);
      if (this.child.inputs) {
        Object.assign(this.childComponentRef.instance, this.child.inputs);
      }
    }
  }

  /**
   * Ouvre le Drawer en appliquant, le cas échéant, les options de configuration fournies.
   */
  public openDrawer(options?: DrawerOptions): void {
    // Si un composant enfant existe déjà, on le détruit
    if (this.childComponentRef) {
      this.childComponentRef.destroy();
      this.childComponentRef = null;
    }

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
      if (options.closeConfirmationMessage !== undefined) {
        this.closeConfirmationMessage = options.closeConfirmationMessage;
      }
      if (options.child !== undefined) {
        this.child = options.child;
      }
    }

    // Rendre le Drawer visible => déclenche (onShow)
    this.visible = true;
  }

  /**
   * Ferme le Drawer (sans confirmation).
   * Si tu veux un "forçage" de fermeture, tu peux l'appeler directement.
   */
  public closeDrawer(): void {
    this.visible = false;
    // On détruit éventuellement le composant enfant
    if (this.childComponentRef) {
      this.childComponentRef.destroy();
      this.childComponentRef = null;
    }
  }

  /**
   * Méthode appelée par le bouton "Fermer le Drawer" : on demande confirmation.
   */
  public onTryClose(): void {
    // Si aucune confirmation n’est requise, on ferme directement.
    if (!this.closeConfirmationMessage) {
      this.closeDrawer();
      return;
    }

    // Sinon, on affiche le dialogue de confirmation.
    this.confirmationService.confirm({
      message: this.closeConfirmationMessage,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // L’utilisateur confirme => on ferme vraiment le Drawer
        this.closeDrawer();
      },
      reject: () => {
        // L’utilisateur annule => le Drawer reste ouvert, on ne détruit pas le composant
      }
    });
  }
}
