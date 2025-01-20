import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {dto} from "../../../habarta/dto";
import TeamDTO = dto.TeamDTO;
import {IEntityService} from "../../commons/workInProgress/CRUD/ientity-service";
import TeamCategoryDTO = dto.TeamCategoryDTO;


@Injectable({
  providedIn: 'root'
})
export class TeamService implements IEntityService<TeamDTO>{

  private apiUrl = '/api/teams';  // URL to the backend API

  constructor(private http: HttpClient) {}

  // Fetch agencies from the backend
  getAgencies(): Observable<TeamDTO[]> {
    return this.http.get<TeamDTO[]>(this.apiUrl);
  }

  // Fetch all teamCategory from the backend
  getTeamCategories(): Observable<TeamCategoryDTO[]> {
    return this.http.get<TeamCategoryDTO[]>(`${this.apiUrl}/category`)
  }

  getTeamTree(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(teams => this.buildTeamTree(teams))
    );
  }

  private buildTeamTree(teams: any[]): any[] {
    const teamMap = new Map<number, any>();
    teams.forEach(team => teamMap.set(team.id, { ...team, children: [] }));

    const teamTree: any[] = [];
    teams.forEach(team => {
      if (team.parent_id) {
        const parent = teamMap.get(team.parent_id);
        parent.children.push(teamMap.get(team.id));
      } else {
        teamTree.push(teamMap.get(team.id));
      }
    });
    return teamTree;
  }

  getTeamsInPause(time: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/pause`, {
      params: { time },
      responseType: 'text'
    });
  }

  /**
   * Récupère un Team particulier, si tu souhaites faire un "edit" côté front.
   * Pour cela, il faut avoir un @GET("/api/teams/{id}") côté Quarkus.
   * Si ce n'est pas encore créé, tu peux l'ajouter.
   */
  getById(id: number): Observable<TeamDTO> {
    return this.http.get<TeamDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée un nouveau Team (appelle @POST /api/teams)
   */
  create(team: TeamDTO): Observable<TeamDTO> {
    return this.http.post<TeamDTO>(this.apiUrl, team);
  }

  /**
   * Met à jour un Team existant (appelle @PUT /api/teams/{id})
   */
  update(team: TeamDTO): Observable<TeamDTO> {
    // On s’attend à ce que team.id soit déjà valorisé
    return this.http.put<TeamDTO>(`${this.apiUrl}/${team.id}`, team);
  }

  /**
   * Supprime un Team (appelle @DELETE /api/teams/{id})
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
