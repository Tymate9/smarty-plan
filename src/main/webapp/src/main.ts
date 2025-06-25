// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom, APP_INITIALIZER, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';

import { AppComponent }      from './app/app.component';
import { ConfigService }     from './app/core/config/config.service';
import { ThemeService }      from './app/theme.service';
import { CacheInterceptor }  from './app/core/cache/cache.interceptor';
import { MessageService }    from 'primeng/api';
import { routes }            from './app/app-routing.module';

import { BrowserModule }                   from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule }                    from 'primeng/button';
import { TableModule }                     from 'primeng/table';
import { TreeTableModule }                 from 'primeng/treetable';
import { DropdownModule }                  from 'primeng/dropdown';
import { TabViewModule }                   from 'primeng/tabview';
import { ProgressSpinnerModule }           from 'primeng/progressspinner';
import { ToastModule }                     from 'primeng/toast';
import { MenubarModule }                   from 'primeng/menubar';
import { CardModule }                      from 'primeng/card';
import { ToggleButtonModule }              from 'primeng/togglebutton';
import { TimelineModule }                  from 'primeng/timeline';
import { CalendarModule }                  from 'primeng/calendar';
import { PanelModule }                     from 'primeng/panel';
import { InputTextModule }                 from 'primeng/inputtext';
import { AutoCompleteModule }              from 'primeng/autocomplete';
import { InputNumberModule }               from 'primeng/inputnumber';
import { SelectButtonModule }              from 'primeng/selectbutton';
import { DialogModule }                    from 'primeng/dialog';
import { TreeModule }                      from 'primeng/tree';
import { SidebarModule }                   from 'primeng/sidebar';

import NmPreset                   from './presets/nm-presets/index';
import { frenchTranslation }      from './presets/translation/french';

import { tap, catchError, of } from 'rxjs';

/**
 * APP_INITIALIZER : charge /api/config, initialise le thème,
 * puis autorise le bootstrap de l’app.
 */
export function initAppFactory(
  cfg: ConfigService,
  theme: ThemeService
) {
  return () =>
    cfg.loadConfig().pipe(
      tap(c => theme.init(c.defaultTheme, c.availableThemes)),
      tap(c => theme.setTheme(c.defaultTheme)),
      catchError(err => {
        console.error('💥 Impossible de charger /api/config :', err);
        // fallback minimal pour que l’app démarre quand même
        theme.init('light', ['light']);
        theme.setTheme('light');
        return of(null);
      })
    ).toPromise();
}

bootstrapApplication(AppComponent, {
  providers: [
    // a) Angular core + PrimeNG modules (via importProvidersFrom)
    (importProvidersFrom(
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
    ) as unknown as Provider),

    // b) Routing + animations + configuration PrimeNG
    (provideRouter(routes) as unknown as Provider),
    (provideAnimationsAsync() as unknown as Provider),
    (providePrimeNG({
      theme: {
        preset: NmPreset,
        options: { darkModeSelector: '[data-theme="dark"]' }
      },
      ripple: true,
      translation: frenchTranslation
    }) as unknown as Provider),

    // c) Services principaux + APP_INITIALIZER
    ConfigService,           // doit être @Injectable({providedIn:'root'}) ou listé ici
    ThemeService,            // idem
    {
      provide: APP_INITIALIZER,
      useFactory: initAppFactory,
      deps: [ConfigService, ThemeService],
      multi: true
    },

    // d) HTTP client + CacheInterceptor
    (provideHttpClient(withInterceptorsFromDi()) as unknown as Provider),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,  // CacheInterceptor doit être décoré @Injectable()
      multi: true
    },

    // e) MessageService pour PrimeNG (s’il est injecté dans un composant ou interceptor)
    MessageService
  ]
}).catch(err => console.error('Erreur bootstrap :', err));
