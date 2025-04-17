import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {dto} from "../../../habarta/dto";
import GGDiagramDTO = dto.GGDiagramDTO;

@Injectable({
  providedIn: 'root'
})
export class AccelerationService {

  private baseUrl = '/api/acceleration';

  constructor(private http: HttpClient) {}

  computeGGDiagram(id: number, beginDate: string, endDate: string): Observable<GGDiagramDTO[]> {
    let httpParams = {'beginDate': beginDate, 'endDate': endDate}
    return this.http.get<GGDiagramDTO[]>(`${this.baseUrl}/${id}/gg-diagram`, { params: httpParams });
  }
}
