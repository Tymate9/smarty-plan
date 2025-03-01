import {ConfigService} from "./core/config/config.service";
import {firstValueFrom} from "rxjs";

// Définition de loadConfigFactory
export function loadConfigFactory(configService: ConfigService) {
  return () => firstValueFrom(configService.loadConfig());
}

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
import {DashboardNonGeolocComponent} from "./features/dashboard/dashboard-non-geoloc.component";

