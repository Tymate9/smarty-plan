import {APP_INITIALIZER, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HelloWorldComponent } from './features/hello-world/hello-world.component';

import keycloakConfig from "./keycloak.config";
import { initializeKeycloak } from './keycloak-init';
import {KeycloakAngularModule, KeycloakService} from "keycloak-angular";

import { HttpClientModule } from '@angular/common/http';
import { LandingPageComponent } from './features/auth/landing-page/landing-page.component';
import {AdminComponent} from './features/auth/admin/admin.component';
import { MapComponent } from './features/map/map.component';

@NgModule({
  declarations: [
    AppComponent,
    HelloWorldComponent,
    LandingPageComponent,
    AdminComponent,
    MapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    KeycloakAngularModule,
    HttpClientModule,
  ],
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: initializeKeycloak,
    multi: true,
    deps: [KeycloakService],
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
