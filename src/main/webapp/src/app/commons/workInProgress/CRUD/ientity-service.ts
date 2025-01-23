import {Observable} from "rxjs";

export interface IEntityService<D, R> {
  getById(id: number): Observable<D>;
  create(entity: R): Observable<D>;
  update(entity: R): Observable<D>;
  delete(id: number): Observable<void>;
}
