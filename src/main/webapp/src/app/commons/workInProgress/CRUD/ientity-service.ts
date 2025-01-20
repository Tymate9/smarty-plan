import {Observable} from "rxjs";

export interface IEntityService<T> {
  getById(id: number): Observable<T>;
  create(entity: T): Observable<T>;
  update(entity: T): Observable<T>;
  delete(id: number): Observable<void>;
}
