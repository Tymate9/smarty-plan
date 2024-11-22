import {APP_INITIALIZER, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HelloWorldComponent } from './features/hello-world/hello-world.component';

import { initializeKeycloak } from './keycloak-init';
import {KeycloakAngularModule, KeycloakService} from "keycloak-angular";

import { HttpClientModule } from '@angular/common/http';
import { LandingPageComponent } from './features/auth/landing-page/landing-page.component';
import {AdminComponent} from './features/auth/admin/admin.component';
import { MapComponent } from './features/map/map.component';
import { NavbarComponent } from './commons/navbar/navbar.component';
import { SearchAutocompleteComponent } from './commons/searchAutocomplete/search-autocomplete.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CartographyComponent } from './features/cartography/cartography.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { CacheInterceptor } from "./core/cache/cache.interceptor";
import { MapPopupComponent } from './features/map/popUp/map-popup.component';
import { PoiPopupComponent } from './features/poi/poi-popup/poi-popup.component';
import { VehiclePopupComponent } from './features/vehicle/vehicle-popup/vehicle-popup.component';
import {TeamTreeComponent} from "./commons/searchAutocomplete/team.tree.component";

import { PoiManagerComponent } from './features/poi/poi-manager/poi-manager.component';
import { ButtonModule } from 'primeng/button';
import {DropdownModule} from "primeng/dropdown";
import {TabViewModule} from "primeng/tabview";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {TripsComponent} from "./features/trips/trips.component";
import {TripComponent} from "./features/trips/trip.component";

@NgModule({
  declarations: [
    AppComponent,
    HelloWorldComponent,
    LandingPageComponent,
    AdminComponent,
    MapComponent,
    NavbarComponent,
    SearchAutocompleteComponent,
    DashboardComponent,
    CartographyComponent,
    MainLayoutComponent,
    MapPopupComponent,
    PoiPopupComponent,
    VehiclePopupComponent,
    PoiManagerComponent,
    TeamTreeComponent,
    PoiManagerComponent,
    TripsComponent,
    TripComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    KeycloakAngularModule,
    HttpClientModule,
    ButtonModule,
    DropdownModule,
    TabViewModule,
    ProgressSpinnerModule,
  ],
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: initializeKeycloak,
    multi: true,
    deps: [KeycloakService],
  }, {
    provide: HTTP_INTERCEPTORS,
    useClass: CacheInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
