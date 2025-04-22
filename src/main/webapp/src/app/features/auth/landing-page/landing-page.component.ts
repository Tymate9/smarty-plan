import { Component } from '@angular/core';
import {KeycloakService} from "keycloak-angular";

@Component({
  selector: 'app-landing-page',
  template: `
    <div class="landing-page">
      <h1>Bienvenue dans l'Application</h1>
      <p>Vous êtes connecter</p>
      <button (click)="logout()">Se déconnecter</button>
    </div>
  `,
  standalone: true,
  styles: []
})
export class LandingPageComponent {

  constructor(private keycloakService: KeycloakService) { }

  logout() {
    this.keycloakService.logout();
  }
}
