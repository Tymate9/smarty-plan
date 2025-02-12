
import { Routes } from '@angular/router';
import {canActivateAuth} from "./auth.guard";
import {MainLayoutComponent} from "./layout/main-layout/main-layout.component";
import {DashboardComponent} from "./features/dashboard/dashboard.component";
import {CartographyComponent} from "./features/cartography/cartography.component";
import {PoiMapComponent} from "./features/poi/poi-manager/poi-map/poi-map.component";
import {TripsComponent} from "./features/trips/trips.component";
import {EntityAdminComponent} from "./commons/workInProgress/entityAdminModule/entity-admin/entity-admin.component";

export const routes: Routes = [
  {
    path: '',
    canActivate: [canActivateAuth],
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'cartography', component: CartographyComponent },
      { path: 'poiedit', component: PoiMapComponent },
      { path: 'trip/:vehicleId/:date', component: TripsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'workinprogress', component: EntityAdminComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
