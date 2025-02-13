// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import {importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import { AppComponent } from './app/app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Nora from '@primeng/themes/nora'

import { MessageService } from 'primeng/api';
import {HTTP_INTERCEPTORS, withInterceptors} from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

// Modules Angular et PrimeNG utilisés dans votre application
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {routes} from './app/app-routing.module';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MenubarModule } from 'primeng/menubar';
import { CardModule } from 'primeng/card';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TimelineModule } from 'primeng/timeline';
import { CalendarModule } from 'primeng/calendar';
import { PanelModule } from 'primeng/panel';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { TreeModule } from 'primeng/tree';
import { SidebarModule } from 'primeng/sidebar';

// Services et interceptors
import { CacheInterceptor } from './app/core/cache/cache.interceptor';


// Classe utilitaire pour stocker la configuration globale
import {provideRouter} from "@angular/router";


// Importation des fonctions et types de Keycloak Angular (v19)
import {
  provideKeycloak,
  withAutoRefreshToken,
  AutoRefreshTokenService,
  UserActivityService,
  createInterceptorCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  includeBearerTokenInterceptor
} from 'keycloak-angular';

// Importation de la configuration globale
import {AppConfig} from "./app/app.config"
import NmPreset from "./presets/nm-presets";
import {frenchTranslation} from "./presets/translation/french";

const urlCondition = createInterceptorCondition({
  urlPattern: /^\/api\//i,
  bearerPrefix: 'Bearer'
});

fetch('/api/config')
  .then((response) => {
    console.log("Preset de base :", Nora)
    console.log("Preset NmPreset chargé :", NmPreset);
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement de la config : ${response.statusText}`);
    }
    return response.json();
  })
  .then((config) => {
    // Stocke la configuration dans la classe statique pour un accès global
    AppConfig.config = config;

    // Démarrage de l'application Angular avec bootstrapApplication et configuration des providers
    bootstrapApplication(AppComponent, {
      providers: [
        // Importation des modules Angular nécessaires
        importProvidersFrom(
          BrowserModule,
          FormsModule,
          ReactiveFormsModule,
          ButtonModule,
          TableModule,
          TreeTableModule,
          DropdownModule,
          TabViewModule,
          ProgressSpinnerModule,
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
          TreeModule,
          SidebarModule
        ),
        provideRouter(routes),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: NmPreset }, ripple:true, translation:frenchTranslation}),
        MessageService,
        // Fourniture de Keycloak avec la configuration chargée
        provideKeycloak({
          config: {
            url: AppConfig.config.keycloakConfig.authServerUrl,
            realm: AppConfig.config.keycloakConfig.realmName,
            clientId: AppConfig.config.keycloakConfig.frontendClientId,
          },
          initOptions: {
            onLoad: 'login-required',
            checkLoginIframe: false,
            enableLogging: true,
            pkceMethod: 'S256',
            flow: 'standard',
          },
          features: [
            withAutoRefreshToken({
              onInactivityTimeout: 'logout',
              sessionTimeout: 60000
            })
          ],
          providers: [AutoRefreshTokenService, UserActivityService]
        }),
        // Configuration de l'intercepteur pour ajouter le token Bearer aux requêtes ciblées
        {
          provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
          useValue: [urlCondition]
        },
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: CacheInterceptor,
          multi: true,
        },
        provideHttpClient(withInterceptorsFromDi())
      ]
    }).catch((err) => console.error(err));
  })
  .catch((err) => console.error('Erreur lors du chargement de la configuration:', err));
