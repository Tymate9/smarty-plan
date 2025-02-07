// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import {importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import { AppComponent } from './app/app.component';
import {
  AutoRefreshTokenService,
  createInterceptorCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG, IncludeBearerTokenCondition,
  includeBearerTokenInterceptor,
  KeycloakAngularModule,
  KeycloakService,
  provideKeycloak,
  UserActivityService,
  withAutoRefreshToken
} from 'keycloak-angular';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';
import {HTTP_INTERCEPTORS, withInterceptors} from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

// Modules Angular et PrimeNG utilisés dans votre application
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {AppRoutingModule, routes} from './app/app-routing.module';
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

// S
// ervices et interceptors
import { CacheInterceptor } from './app/core/cache/cache.interceptor';


// Classe utilitaire pour stocker la configuration globale
import {AppConfig} from "./app/app.config";
import {provideRouter} from "@angular/router";


const urlCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: /^(http:\/\/localhost:45180)(\/.*)?$/i,
  bearerPrefix: 'Bearer'
});

// ---------------------------------------------------------------------
// Charge la configuration depuis le back-end AVANT de démarrer Angular
// ---------------------------------------------------------------------
fetch('/api/config')
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement de la config : ${response.statusText}`);
    }
    return response.json();
  })
  .then((config) => {
    // Stocke la config dans la classe statique pour un accès global
    AppConfig.config = config;

    // Démarre l'application Angular en passant les providers nécessaires,
    // dont celui de Keycloak qui utilise la config chargée.
    bootstrapApplication(AppComponent, {
      providers: [
        importProvidersFrom(
          BrowserModule,
          FormsModule,
          ReactiveFormsModule,
          AppRoutingModule,
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
          SidebarModule,
          KeycloakAngularModule,
          KeycloakService
        ),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        MessageService,
        // Fourniture de Keycloak avec la configuration chargée
        provideKeycloak({
          config: {
            url: AppConfig.config.keycloakConfig.authServerUrl,
            realm: AppConfig.config.keycloakConfig.realmName,
            clientId: AppConfig.config.keycloakConfig.frontendClientId,
          },
          initOptions: {
            onLoad: 'login-required', // ou 'check-sso' selon vos besoins
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
          // Vous pouvez ajouter ici les propriétés 'providers' et 'features' si nécessaire
        }),
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
