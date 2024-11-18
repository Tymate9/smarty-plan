import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {dto} from "../../../habarta/dto";
import TeamDTO = dto.TeamDTO;


@Injectable({
  providedIn: 'root'
})
export class TeamService {

  private apiUrl = '/api/teams';  // URL to the backend API

  constructor(private http: HttpClient) {}

  // Fetch agencies from the backend
  getAgencies(): Observable<TeamDTO[]> {
    return this.http.get<TeamDTO[]>(this.apiUrl);
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
    console.log(teamTree)
    return teamTree;
  }
}
