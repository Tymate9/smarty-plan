import { Routes } from '@angular/router';
import {canActivateAuth} from "./auth.guard";
import {MainLayoutComponent} from "./layout/main-layout/main-layout.component";
import {DashboardComponent} from "./features/dashboard/dashboard.component";
import {CartographyComponent} from "./features/cartography/cartography.component";
import {PoiMapComponent} from "./features/poi/poi-manager/poi-map/poi-map.component";
import {TripsComponent} from "./features/trips/trips.component";
import {EntityAdminComponent} from "./workInProgress/entityAdminModule/entity-admin/entity-admin.component";
import {ReportComponent} from "./features/report/report.component";
import {QseReportComponent} from "./features/report/qse.report.component";

export const routes: Routes = [
  {
    path: '',
    canActivate: [canActivateAuth],
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'dashboard-non-geoloc', component: DashboardComponent },
      { path: 'cartography', component: CartographyComponent },
      { path: 'poiedit', component: PoiMapComponent},
      { path: 'report', component: ReportComponent },
      { path: 'qse-report', component: QseReportComponent },
      { path: 'trip/:vehicleId/:date', component: TripsComponent },
      { path: 'trip-non-geoloc/:vehicleId/:date', component: TripsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'admin', component: EntityAdminComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
