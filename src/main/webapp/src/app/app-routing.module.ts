import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CartographyComponent } from './features/cartography/cartography.component';
import {TripListComponent} from "./features/trips/trip-list.component";
import {TripMapComponent} from "./features/trips/trip-map.component";
import {TripsComponent} from "./features/trips/trips.component";
import {PoiMapComponent} from "./features/poi/poi-manager/poi-map/poi-map.component";
import {authGuard} from "./auth.guard";

const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'cartography', component: CartographyComponent },
      { path: 'poiedit', component: PoiMapComponent},
      { path: 'trip/:vehicleId/:date', component: TripsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { bindToComponentInputs: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
