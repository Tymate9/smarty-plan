import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {dto} from "../../../habarta/dto";
import GGDiagramDTO = dto.GGDiagramDTO;
import VehicleAccelPeriodsDTO = dto.VehicleAccelPeriodsDTO;
import AnglesForm = dto.AnglesForm;
import DeviceAccelAnglesDTO = dto.DeviceAccelAnglesDTO;

@Injectable({
  providedIn: 'root'
})
export class AccelerationService {

  private baseUrl = '/api/acceleration';

  constructor(private http: HttpClient) {}

  computeGGDiagram(id: number, beginDate: Date, proj: string, phi: number, theta: number, psi: number): Observable<GGDiagramDTO[]> {
    let httpParams = {'proj': proj, 'phi': phi, 'theta': theta, 'psi': psi};
    return this.http.get<GGDiagramDTO[]>(`${this.baseUrl}/${id}/${beginDate}/gg-diagram`, { params: httpParams });
  }

  listCalibrationPeriods(): Observable<VehicleAccelPeriodsDTO[]>{
    return this.http.get<VehicleAccelPeriodsDTO[]>(this.baseUrl);
  }

  saveAngles(id: number, beginDate: Date, phi: number, theta: number, psi: number): Observable<DeviceAccelAnglesDTO> {
    let body: AnglesForm = {'phi': phi, 'theta': theta, 'psi': psi};
    return this.http.post<DeviceAccelAnglesDTO>(`${this.baseUrl}/${id}/${beginDate}`, body);
  }

}
