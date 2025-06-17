import {Observable} from "rxjs";
import {dto} from "../../../../habarta/dto";
import {EntityColumn} from "../../admin/entity-tree/entity-tree.component";
import {TreeNode} from "primeng/api";
import {Type} from "@angular/core";
import {DrawerOptions} from "../../drawer/drawer.component";

export enum CrudEventType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export interface CrudEvent<D> {
  type: CrudEventType;
  oldData: D | null;
  newData: D | null;
}

export interface IEntityService<D, R> {
  getDrawerOptions(id: any | null): DrawerOptions;
  getAuthorizedData(): Observable<D[]>;
  getById(id: any): Observable<D>;
  create(entity: R): Observable<D>;
  update(entity: R): Observable<D>;
  delete(id: any): Observable<D>;
  getCount(): Observable<number>;
  getStats(): Observable<dto.StatsDTO>;
  getTreeColumns():Observable<EntityColumn[]>;
  getTreeNodes():Observable<TreeNode[]>;
  crudEvents$: Observable<CrudEvent<D>>;
  notifyCrudEvent(event: CrudEvent<D>): void;
  buildTreeLeaf(entity: D): TreeNode;
  getCsvHeaders(): string[];
  convertToCsv(item: D): (string | number)[];
}
