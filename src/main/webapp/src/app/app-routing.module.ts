import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CartographyComponent } from './features/cartography/cartography.component';
import {TripListComponent} from "./features/trips/trip-list.component";
import {TripMapComponent} from "./features/trips/trip-map.component";
import {PoiManagerComponent} from "./features/poi/poi-manager/poi-manager.component";
import {TripsComponent} from "./features/trips/trips.component";
import {PoiMapComponent} from "./features/poi/workInProgress/poi-map/poi-map.component";

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {path:'work-in-progress', component:PoiManagerComponent},
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
