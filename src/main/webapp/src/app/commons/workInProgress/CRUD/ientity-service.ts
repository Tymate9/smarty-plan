import {Observable} from "rxjs";
import {dto} from "../../../../habarta/dto";

export interface IEntityService<D, R> {
  getAuthorizedData(): Observable<D[]>;
  getById(id: number): Observable<D>;
  create(entity: R): Observable<D>;
  update(entity: R): Observable<D>;
  delete(id: number): Observable<void>;
  getCount(): Observable<number>;
  getStats(): Observable<dto.TeamEntityStatsDTO>;
}
