import { Injectable } from '@angular/core';
import {DrawerComponent, DrawerOptions} from "../../drawer/drawer.component";

@Injectable({
  providedIn: 'root'
})
export class DrawerService {
  // Référence unique vers l'instance du DrawerComponent enregistrée dans l'application
  private drawerComponent: DrawerComponent | null = null;

  /**
   * Enregistre l'instance du DrawerComponent.
   * Cette méthode est appelée dans le constructeur du DrawerComponent afin que le service
   * puisse interagir avec cette instance unique pour ouvrir ou fermer le Drawer.
   * @param drawer L'instance du DrawerComponent à enregistrer.
   */
  public registerDrawer(drawer: DrawerComponent): void {
    this.drawerComponent = drawer;
  }

  /**
   * Ouvre le Drawer avec les options de configuration fournies.
   * Si aucune instance de DrawerComponent n'est enregistrée, un message d'erreur est affiché.
   * @param options Options de configuration pour personnaliser l'affichage du Drawer.
   */
  public open(options?: DrawerOptions): void {
    if (!this.drawerComponent) {
      console.error("Aucun DrawerComponent n'est enregistré.");
      return;
    }
    this.drawerComponent.openDrawer(options);
  }

  /**
   * Ferme le Drawer.
   */
  public close(): void {
    if (this.drawerComponent) {
      this.drawerComponent.closeDrawer();
    }
  }
}
