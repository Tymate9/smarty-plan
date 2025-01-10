import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HelloWorldComponent} from './features/hello-world/hello-world.component';

import {initializeKeycloak} from './keycloak-init';
import {KeycloakAngularModule, KeycloakService} from "keycloak-angular";

import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {LandingPageComponent} from './features/auth/landing-page/landing-page.component';
import {AdminComponent} from './features/auth/admin/admin.component';
import {MapComponent} from './features/map/map.component';
import {NavbarComponent} from './commons/navbar/navbar.component';
import {SearchAutocompleteComponent} from './commons/searchAutocomplete/search-autocomplete.component';
import {DashboardComponent} from './features/dashboard/dashboard.component';
import {CartographyComponent} from './features/cartography/cartography.component';
import {MainLayoutComponent} from './layout/main-layout/main-layout.component';
import {CacheInterceptor} from "./core/cache/cache.interceptor";
import {MapPopupComponent} from './features/map/popUp/map-popup.component';
import {PoiPopupComponent} from './features/poi/poi-popup/poi-popup.component';
import {VehiclePopupComponent} from './features/vehicle/vehicle-popup/vehicle-popup.component';
import {TeamTreeComponent} from "./commons/searchAutocomplete/team.tree.component";

import {ButtonModule} from 'primeng/button';
import {TreeTableModule} from 'primeng/treetable';
import {DropdownModule} from "primeng/dropdown";
import {TabViewModule} from "primeng/tabview";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {ConfigService} from "./core/config/config.service";
import {TableModule} from "primeng/table";

import {ToastModule} from "primeng/toast";
import {MessageService} from 'primeng/api';
import {MenubarModule} from "primeng/menubar";

import {TripListComponent} from "./features/trips/trip-list.component";
import {TripMapComponent} from "./features/trips/trip-map.component";
import {CardModule} from "primeng/card";
import {ToggleButtonModule} from "primeng/togglebutton";
import {TimelineModule} from "primeng/timeline";
import {TripsComponent} from "./features/trips/trips.component";
import {CalendarModule} from "primeng/calendar";
import {PanelModule} from "primeng/panel";
import {InputTextModule} from 'primeng/inputtext';
import {PoiMapComponent} from './features/poi/poi-manager/poi-map/poi-map.component';
import {PoiSearchComponent} from './features/poi/poi-manager/poi-search/poi-search.component';
import {PoiListComponent} from './features/poi/poi-manager/poi-list/poi-list.component';
import {AutoCompleteModule} from "primeng/autocomplete";
import {InputNumberModule} from "primeng/inputnumber";
import {SelectButtonModule} from "primeng/selectbutton";
import {LogoComponent} from "./commons/logo/logo.component";
import {TestBannerComponent} from "./commons/testBanner/testBanner.component";
import {DialogModule} from "primeng/dialog";
import { SmsFormComponent } from './features/sms/sms-form/sms-form.component';
import {NgOptimizedImage} from "@angular/common";

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
    TeamTreeComponent,
    TripsComponent,
    TripListComponent,
    TripMapComponent,
    PoiMapComponent,
    PoiSearchComponent,
    PoiListComponent,
    LogoComponent,
    TestBannerComponent,
    SmsFormComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    KeycloakAngularModule,
    HttpClientModule,
    ButtonModule,
    TableModule,
    TreeTableModule,
    DropdownModule,
    TabViewModule,
    ProgressSpinnerModule,
    ReactiveFormsModule,
    ToastModule,
    MenubarModule,
    CardModule,
    ToggleButtonModule,
    TimelineModule,
    CalendarModule,
    PanelModule,
    InputTextModule,
    AutoCompleteModule,
    InputNumberModule,
    SelectButtonModule,
    DialogModule,
    NgOptimizedImage,
  ],
  providers: [
    MessageService,
    ConfigService,
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      deps: [KeycloakService, ConfigService],
      multi: true
    }, {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,
      multi: true
    }],
  bootstrap: [AppComponent]
})
export class AppModule {
}
