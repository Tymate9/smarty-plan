import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {IEntityService} from "../../CRUD/ientity-service";
import {dto} from "../../../../habarta/dto";
import {DrawerComponent} from "../../drawer/drawer.component";
import {AsyncPipe, DatePipe, NgForOf, NgIf} from "@angular/common";
import {TeamFormComponent} from "../../CRUD/team-form/team-form.component";
import {LoadingService} from "../../service/loading.service";
import {ProgressSpinner} from "primeng/progressspinner";

@Component({
  selector: 'app-entity-stats',
  template: `
    <p-progressSpinner *ngIf="(loadingService.loading$ | async)"></p-progressSpinner>
    <div class="stats-container">
      <!-- Affichage du titre complet si pas en chargement/erreur -->
      <h4 *ngIf="!errorMsg">
        Statistiques pour {{ entityName }}
        calculées à la date de {{ statsDate | date:'medium' }}
      </h4>

      <!-- État : erreur -->
      <div *ngIf="errorMsg" class="error">
        {{ errorMsg }}
      </div>

      <!-- Affichage des "cards" si on a des stats -->
      <div class="cards-grid" *ngIf="!errorMsg">
        <div class="stat-card" *ngFor="let s of stats">
          <!-- Icône par défaut -->
          <i class="pi pi-chart-line stat-icon"></i>

          <!-- Valeur numérique -->
          <div class="stat-value">
            {{ s.value }}
          </div>

          <!-- Label -->
          <div class="stat-label">
            {{ s.label }}
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    DatePipe,
    NgIf,
    NgForOf,
    ProgressSpinner,
    AsyncPipe
  ],
  styles: [`
    .stats-container {
      background-color: #f9f9f9;
      padding: 16px;
      border: 1px solid #e3e3e3;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    h4 {
      margin-top: 0;
      margin-bottom: 16px;
      font-weight: normal;
    }

    .loading {
      font-style: italic;
      color: #666;
    }

    .error {
      color: #cc0000;
      font-weight: bold;
    }

    .cards-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .stat-card {
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 180px;
      min-height: 120px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
      font-size: 1.5rem;
      color: #999;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 1.4rem;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 0.95rem;
      color: #555;
    }
  `],
  providers: [LoadingService]
})
export class EntityStatsComponent implements OnInit, OnChanges {
  @Input() entityName: string = '';
  @Input() entityService?: IEntityService<any, any>;

  errorMsg: string | null = null;

  // Date extraite du DTO (ex. "2023-12-31T23:59:59")
  statsDate: Date = new Date();
  stats: Array<{ label: string; value: number; description: string }> = [];

  constructor(
    public loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loadData(); // => setLoading(true) dedans
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityService'] && !changes['entityService'].firstChange) {
      setTimeout(() => {
        this.loadData(); // => setLoading(true) dedans
      });
    }
  }

  loadData():void{

    if (!this.entityService) {
      this.errorMsg = 'Aucun service fourni pour charger les stats.';
      return;
    }
    this.loadingService.setLoading(true);

    // 1) Récupérer les stats (contient date + tableau d’objets stats)
    this.entityService.getStats().subscribe({
      next: (dto: dto.StatsDTO) => {
        if (dto) {
          // On suppose que dto = { date: '2023-12-31T23:59:59', stats: [...] }
          this.statsDate = dto.date ? new Date(dto.date) : new Date();
          this.stats = dto.stats || [];
        }
      },
      error: (err) => {
        console.error('Erreur getStats:', err);
        this.errorMsg = 'Erreur lors de la récupération des stats.';
      },
      complete: () => {
        this.loadingService.setLoading(false);
      }
    });
  }
}
