import { Component, Input } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Button} from "primeng/button";

/**
 * Composant de navigation générique vers la page de création/édition de POI.
 * Permet de transmettre des coordonnées, adresses et labels via trois inputs distincts.
 */
@Component({
  selector: 'app-poi-navigation-button',
  template: `
    <!-- Bouton stylisé avec PrimeNG -->
    <p-button type="button" (click)="navigate()" [label]="buttonLabel"></p-button>
  `,
  standalone: true,
  imports: [
    Button
  ],
  styles: [`
    button {
      margin: 5px;
    }
  `]
})
export class PoiNavigationButtonComponent {
  @Input() buttonLabel: string = 'Naviguer vers POI';
  @Input() coords: string[] = [];
  @Input() addresses: string[] = [];
  @Input() labels: string[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {}

  navigate(): void {
    const queryParams: any = {};

    if (this.coords && this.coords.length > 0) {
      queryParams.coords = this.coords.join(';');
    }
    if (this.addresses && this.addresses.length > 0) {
      queryParams.addresses = this.addresses.join(',');
    }
    if (this.labels && this.labels.length > 0) {
      queryParams.labels = this.labels.join(',');
    }

    // Navigation absolue en utilisant le contexte racine
    this.router.navigate(['/poiedit'], { relativeTo: this.route.root, queryParams });
  }
}
