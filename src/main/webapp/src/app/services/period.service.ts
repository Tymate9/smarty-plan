import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import {CrudEvent, IEntityService} from "../commons/crud/interface/ientity-service";
import {dto} from "../../habarta/dto";
import PeriodDTO = dto.PeriodDTO;
import PeriodForm = dto.PeriodForm;
import {DrawerOptions} from "../commons/drawer/drawer.component";
import {TreeNode} from "primeng/api";
import DriverDTO = dto.DriverDTO;
import VehicleDTO = dto.VehicleDTO;

@Injectable({
  providedIn: 'root'
})
export abstract class PeriodService<R> implements IEntityService<PeriodDTO<R>, PeriodForm> {
  protected baseUrl: string = '/api/periods';

  protected constructor(protected readonly http: HttpClient) {}

  private _crudEvents: Subject<CrudEvent<PeriodDTO<R>>> = new Subject<CrudEvent<PeriodDTO<R>>>();
  public crudEvents$: Observable<CrudEvent<PeriodDTO<R>>> = this._crudEvents.asObservable();

  notifyCrudEvent(event: CrudEvent<PeriodDTO<R>>): void {
    this._crudEvents.next(event);
  }

  getById(id: string): Observable<PeriodDTO<R>> {
    return this.http.get<PeriodDTO<R>>(`${this.baseUrl}/${id}`);
  }

  getDrawerOptions(id: any | null): DrawerOptions {
    if (!id) {
      return {
        headerTitle: 'Créer une période',
        closeConfirmationMessage: 'Voulez-vous fermer ce panneau ?',
        child: {
          compClass: PeriodForm,
          inputs: {
            resourceId: '',
          }
        }
      };
    } else {
      return {
        headerTitle: `Édition d'une période`,
        closeConfirmationMessage: 'Voulez-vous fermer ce panneau ?',
        child: {
          compClass: PeriodForm,
          inputs: {
            resourceId: id
          }
        }
      };
    }
  }

  create(entity: PeriodForm): Observable<PeriodDTO<R>> {
    return this.http.post<PeriodDTO<R>>(this.baseUrl, entity);
  }

  update(entity: PeriodForm): Observable<PeriodDTO<R>> {
    const periodId = (entity as any).id;
    if (!periodId) {
      throw new Error("PeriodService.update() : l'id de la période est manquant.");
    }
    return this.http.put<PeriodDTO<R>>(`${this.baseUrl}/${periodId}`, entity);
  }

  delete(id: string): Observable<PeriodDTO<R>> {
    return this.http.delete<PeriodDTO<R>>(`${this.baseUrl}/${id}`);
  }

  getAuthorizedData(): Observable<PeriodDTO<R>[]> {
    return this.http.get<PeriodDTO<R>[]>(`${this.baseUrl}/list`);
  }

  // Méthode pour récupérer les périodes filtrées par resource
  listByResource(resourceId: string): Observable<PeriodDTO<R>[]> {
    return this.http.get<PeriodDTO<R>[]>(`${this.baseUrl}/list/resource`, { params: { resourceId } });
  }

  getCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }

  getTreeColumns(): Observable<any[]> {
    return of([]);
  }

  getTreeNodes(): Observable<any[]> {
    return of([]);
  }

  buildTreeLeaf(entity: PeriodDTO<R>): TreeNode {
    return {} as TreeNode;
  }

  getCsvHeaders(): string[] {
    return [
      'ID',
      'Date de début',
      'Date de fin',
      'Ressource'
    ];
  }

  //TODO(Implémentation non complète à compléter)
  convertToCsv(item: PeriodDTO<R>): string {
    const values = [
      item.id,
      item.startDate ? item.startDate.toString() : '',
      item.endDate ? item.endDate.toString() : '',
      item.resource ? item.resource.toString() : ''
    ];
    return values.map(value => `"${value !== null && value !== undefined ? value : ''}"`).join(';');
  }

}

@Injectable({
  providedIn: 'root'
})
export class DriverUpPeriodService extends PeriodService<DriverDTO> {
  constructor(http: HttpClient) {
    super(http);
    this.baseUrl = '/api/periods/DRIVER_UP';
  }
}

@Injectable({
  providedIn: 'root'
})
export class VehicleUpPeriodService extends PeriodService<VehicleDTO> {
  constructor(http: HttpClient) {
    super(http);
    this.baseUrl = '/api/periods/VEHICLE_UP';
  }
}
