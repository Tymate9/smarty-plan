import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CartographyComponent } from './features/cartography/cartography.component';
import {TripsComponent} from "./features/trips/trips.component";
import {TripComponent} from "./features/trips/trip.component";
import {PoiManagerComponent} from "./features/poi/poi-manager/poi-manager.component";

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'cartography', component: CartographyComponent },
      { path: 'poiedit/:label', component: PoiManagerComponent},
      { path: 'poiedit', component: PoiManagerComponent},
      { path: 'trips/:vehicleId', component: TripsComponent },
      { path: 'trip/:tripId', component: TripComponent },
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
