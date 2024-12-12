import {Component, OnInit} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";

@Component({
  selector: 'app-cartography',
  template: `
<!--    <h1>Cartographie</h1>-->
<!--    <div>-->
<!--      <p><strong>Agences sélectionnées :</strong> {{ selectedTags['agencies'].join(', ') || 'Aucune' }}</p>-->
<!--      <p><strong>Véhicules sélectionnés :</strong> {{ selectedTags['vehicles'].join(', ') || 'Aucune' }}</p>-->
<!--      <p><strong>Conducteurs sélectionnés :</strong> {{ selectedTags['drivers'].join(', ') || 'Aucune' }}</p>-->
<!--      <app-map></app-map>-->
<!--    </div>-->
  `,
  styles: [`
    h1 {
      margin-bottom: 20px;
    }
  `]
})
export class CartographyComponent implements OnInit {
  selectedTags: { [key: string]: string[] } = {};

  constructor(private filterService: FilterService) {
  }

  ngOnInit() {
    // S'abonner aux filtres partagés
    this.filterService.filters$.subscribe(filters => {
      this.selectedTags = filters;
    });
  }
}
