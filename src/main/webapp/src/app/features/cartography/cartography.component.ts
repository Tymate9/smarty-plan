import {Component, OnInit} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";

@Component({
  selector: 'app-cartography',
  template: `
    <div>
      <app-map></app-map>
    </div>
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
