import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable()
export class LoadingService {

  // Stocke l'état actuel de chargement (true ou false)
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observable auquel s'abonnent les composants qui veulent connaître l'état de chargement
  loading$ = this.loadingSubject.asObservable();

  /**
   * Modifie l'état de chargement.
   * @param isLoading true = en cours de chargement, false = terminé
   */
  setLoading(isLoading: boolean): void {
    this.loadingSubject.next(isLoading);
  }

}
