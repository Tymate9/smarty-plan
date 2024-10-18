import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './features/auth/landing-page/landing-page.component';
import { AdminComponent } from './features/auth/admin/admin.component';
import { authGuard } from './auth.guard';
import {MapComponent} from "./features/map/map.component";

const routes: Routes = [
  { path: '', component: LandingPageComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'map', component: MapComponent, canActivate:[authGuard]}
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
