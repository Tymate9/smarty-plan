import {Injectable} from '@angular/core';
import {CrudEvent, CrudEventType, IEntityService} from "../commons/crud/interface/ientity-service";
import {dto} from "../../habarta/dto";
import {Observable, of, Subject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {DrawerOptions} from "../commons/drawer/drawer.component";
import {TreeNode} from "primeng/api";
import AffectationDTO = dto.AffectationDTO;
import AffectationForm = dto.AffectationForm;
import DriverDTO = dto.DriverDTO;
import TeamDTO = dto.TeamDTO;
import VehicleDTO = dto.VehicleDTO;

/**
 * Service générique d'affectation.
 * Paramétré par S (type du sujet) et T (type de la cible).
 */
@Injectable({
  providedIn: 'root'
})
export abstract class AffectationService<S, T> implements IEntityService<AffectationDTO<S, T>, AffectationForm> {
  protected baseUrl: string = '/api/affectations';

  protected constructor(protected readonly http: HttpClient) {}

  private _crudEvents: Subject<CrudEvent<AffectationDTO<S, T>>> = new Subject<CrudEvent<AffectationDTO<S, T>>>();
  public crudEvents$: Observable<CrudEvent<AffectationDTO<S, T>>> = this._crudEvents.asObservable();
  notifyCrudEvent(event: CrudEvent<AffectationDTO<S, T>>): void {
    this._crudEvents.next(event);
  }

  getById(id: string): Observable<AffectationDTO<S, T>> {
    return this.http.get<AffectationDTO<S, T>>(`${this.baseUrl}/${id}`);
  }

  getDrawerOptions(id: any | null): DrawerOptions {
    if (!id) {
      return {
        headerTitle: 'Créer une affectation',
        closeConfirmationMessage: 'Voulez-vous fermer ce panneau ?',
        child: {
          compClass: AffectationForm,
          inputs: {
            vehicleId: '',
          }
        }
      };
    } else {
      return {
        headerTitle: `Édition une affectation`,
        closeConfirmationMessage: 'Voulez-vous fermer ce panneau ?',
        child: {
          compClass: AffectationForm,
          inputs: {
            vehicleId: id
          }
        }
      };
    }
  }

  create(entity: AffectationForm): Observable<AffectationDTO<S, T>> {
    return this.http.post<AffectationDTO<S, T>>(this.baseUrl, entity);
  }

  update(entity: AffectationForm): Observable<AffectationDTO<S, T>> {
    const affectationId = (entity as any).id;
    if (!affectationId) {
      throw new Error("AffectationService.update() : l'id de l'affectation est manquant.");
    }
    return this.http.put<AffectationDTO<S, T>>(`${this.baseUrl}/${affectationId}`, entity)
  }

  delete(id: string): Observable<AffectationDTO<S, T>> {
    return this.http.delete<AffectationDTO<S, T>>(`${this.baseUrl}/${id}`);
  }

  getAuthorizedData(): Observable<AffectationDTO<S, T>[]> {
    return this.http.get<AffectationDTO<S, T>[]>(`${this.baseUrl}/list`);
  }

  // Nouvelle méthode pour récupérer les affectations filtrées par subject
  listBySubject(subjectId: string): Observable<AffectationDTO<S, T>[]> {
    return this.http.get<AffectationDTO<S, T>[]>(`${this.baseUrl}/list/subject`, { params: { subjectId } });
  }

  // Nouvelle méthode pour récupérer les affectations filtrées par target
  listByTarget(targetId: string): Observable<AffectationDTO<S, T>[]> {
    return this.http.get<AffectationDTO<S, T>[]>(`${this.baseUrl}/list/target`, { params: { targetId } });
  }

  // TODO(Toute ces méthode sont vide il faut prendre le temps de les développer et de leur trouver une utilisation correct ou alors de modifier l'interface pour la séparer en plusieurs interfaces/factory)
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

  buildTreeLeaf(entity: dto.AffectationDTO<S, T>): TreeNode {
    return {} as TreeNode;
  }
}

/**
 * Sous-classe pour les affectations de type DRIVER_TEAM.
 */
@Injectable({
  providedIn: 'root'
})
export class DriverTeamAffectationService extends AffectationService<DriverDTO, TeamDTO> {
  constructor(http: HttpClient) {
    super(http);
    this.baseUrl = '/api/affectations/DRIVER_TEAM';
  }
}

@Injectable({
  providedIn: 'root'
})
export class VehicleTeamAffectationService extends AffectationService<VehicleDTO, TeamDTO> {
  constructor(http: HttpClient) {
    super(http);
    this.baseUrl = '/api/affectations/VEHICLE_TEAM';
  }
}

@Injectable({
  providedIn: 'root'
})
export class DriverVehicleAffectationService extends AffectationService<DriverDTO, VehicleDTO> {
  constructor(http: HttpClient) {
    super(http);
    this.baseUrl = '/api/affectations/DRIVER_VEHICLE';
  }
}
