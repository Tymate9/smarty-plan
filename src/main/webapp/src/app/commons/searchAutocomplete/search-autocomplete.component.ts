 import {Component, Input, Output, EventEmitter, SimpleChanges} from '@angular/core';
//Original
@Component({
  selector: 'app-search-autocomplete',
  template: `
    <div class="search-autocomplete">
      <div class="input-container">
        <div class="tags">
          <span *ngFor="let tag of selectedTags" class="tag">
            {{ tag }} <button (click)="removeTag(tag)">x</button>
          </span>
          <input
            type="text"
            [(ngModel)]="searchText"
            (input)="onSearch()"
            placeholder="Filtrer {{ label }}..."
            [ngStyle]="{'background-color': 'white'}"
          />
          <button class="dropdown-button" (click)="toggleDropdown()">&#9662;</button> <!-- Bouton pour afficher les options -->
        </div>
      </div>
      <ul *ngIf="dropdownVisible && filteredOptions.length > 0" class="autocomplete-list">
        <li *ngFor="let option of filteredOptions" (click)="selectOption(option)">
          {{ option }}
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .search-autocomplete {
      position: relative;
      width: 300px;
    }

    .input-container {
      border: 1px solid #ccc;
      padding: 5px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      background-color: white;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      flex-grow: 1;
      background-color: white;
    }

    .tag {
      background-color: #e0e0e0;
      border-radius: 5px;
      padding: 5px;
      margin-right: 5px;
      display: flex;
      align-items: center;
    }

    .input-container input {
      border: none;
      outline: none;
      flex-grow: 1;
      min-width: 150px;
      background-color: white;
    }

    .dropdown-button {
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 16px;
      padding: 0 5px;
    }

    .autocomplete-list {
      position: absolute;
      background-color: white;
      border: 1px solid #ccc;
      width: 100%;
      max-height: 150px;
      overflow-y: auto;
      z-index: 10;
    }

    .autocomplete-list li {
      padding: 5px;
      cursor: pointer;
    }

    .autocomplete-list li:hover {
      background-color: #f0f0f0;
    }
  `]
})
export class SearchAutocompleteComponent {
  @Input() label: string = '';
  @Input() options: string[] = [];
  @Input() selectedItems: string[] = [];
  @Output() selectedTagsChange = new EventEmitter<string[]>();  // Émet les étiquettes sélectionnées

  searchText = '';
  selectedTags: string[] = [];
  filteredOptions: string[] = [];
  dropdownVisible: boolean = false;

  // Filtre les options et exclut celles déjà sélectionnées
  onSearch() {
    this.filterOptions();
  }


  ngOnChanges(changes: SimpleChanges) {
    // Detect changes in selectedItems and update selectedTags accordingly
    if (changes['selectedItems'] && changes['selectedItems'].currentValue !== this.selectedTags) {
      this.selectedTags = [...this.selectedItems]; // Reset selectedTags from parent
      this.filterOptions(); // Reapply filter to exclude selected items
    }
  }

  filterOptions() {
    if (this.searchText) {
      this.filteredOptions = this.options.filter(option =>
        option.toLowerCase().includes(this.searchText.toLowerCase()) &&
        !this.selectedTags.includes(option)
      );
    } else {
      this.filteredOptions = this.options.filter(option => !this.selectedTags.includes(option));
    }
  }

  // Ajoute une option aux tags sélectionnés
  selectOption(option: string) {
    if (!this.selectedTags.includes(option)) {
      this.selectedTags.push(option);
      this.selectedTagsChange.emit(this.selectedTags);  // Émet les tags sélectionnés
    }
    this.searchText = '';
    this.dropdownVisible = false;
    this.filterOptions();
  }

  // Retire une étiquette
  removeTag(tag: string) {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
    this.selectedTagsChange.emit(this.selectedTags);  // Réémission après suppression
    this.filterOptions();
  }

  // Bascule l'affichage de la liste déroulante
  toggleDropdown() {
    this.dropdownVisible = !this.dropdownVisible;
    if (this.dropdownVisible) {
      this.filterOptions();
    }
  }
}

////////////////////////////////////////////////////working but discu!!
// @Component({
//   selector: 'app-search-autocomplete',
//   template: `
//     <div class="search-autocomplete">
//       <div class="input-container">
//         <div class="tags">
//           <span *ngFor="let tag of selectedTags" class="tag">
//             {{ tag }} <button (click)="removeTag(tag)">x</button>
//           </span>
//           <input
//             type="text"
//             [(ngModel)]="searchText"
//             (input)="onSearch()"
//             placeholder="Filtrer {{ label }}..."
//             [ngStyle]="{'background-color': 'white'}"
//           />
//           <button class="dropdown-button" (click)="toggleDropdown()">&#9662;</button>
//         </div>
//       </div>
//       <ul *ngIf="dropdownVisible && filteredOptions.length > 0" class="autocomplete-list">
//         <ng-container *ngFor="let option of filteredOptions">
//           <li>
//             <div (click)="selectOption(option.label)" [class.selected]="isSelected(option.label)">
//               {{ option.label }}
//             </div>
//             <!-- Recursively display children -->
//             <ul *ngIf="option.children && option.children.length > 0">
//               <ng-container *ngFor="let child of option.children">
//                 <li>
//                   <div (click)="selectOption(child.label)" [class.selected]="isSelected(child.label)">
//                     {{ child.label }}
//                   </div>
//                   <ul *ngIf="child.children && child.children.length > 0">
//                     <ng-container *ngFor="let subChild of child.children">
//                       <li>
//                         <div (click)="selectOption(subChild.label)" [class.selected]="isSelected(subChild.label)">
//                           {{ subChild.label }}
//                         </div>
//                       </li>
//                     </ng-container>
//                   </ul>
//                 </li>
//               </ng-container>
//             </ul>
//           </li>
//         </ng-container>
//       </ul>
//     </div>
//   `,
//   styles: [`
//     /* Styles for hierarchical dropdown */
//     .autocomplete-list ul {
//       margin-left: 10px;
//       padding-left: 10px;
//       border-left: 1px dashed #ccc;
//     }
//     .selected {
//       font-weight: bold;
//       color: blue;
//     }
//   `]
// })
// export class SearchAutocompleteComponent {
//   @Input() label: string = '';
//   @Input() options: any[] = []; // Hierarchical options
//   @Input() selectedItems: string[] = [];
//   @Output() selectedTagsChange = new EventEmitter<string[]>();
//
//   searchText = '';
//   selectedTags: string[] = [];
//   filteredOptions: any[] = [];
//   dropdownVisible: boolean = false;
//
//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['selectedItems'] && changes['selectedItems'].currentValue !== this.selectedTags) {
//       this.selectedTags = [...this.selectedItems];
//       this.filterOptions();
//     }
//   }
//
//   onSearch() {
//     this.filterOptions();
//   }
//
//   filterOptions() {
//     const filterTree = (nodes: any[]): any[] =>
//       nodes
//         .filter(node =>
//           node.label.toLowerCase().includes(this.searchText.toLowerCase()) ||
//           (node.children && filterTree(node.children).length > 0)
//         )
//         .map(node => ({
//           ...node,
//           children: filterTree(node.children || []),
//         }));
//
//     this.filteredOptions = this.searchText ? filterTree(this.options) : this.options;
//   }
//
//   selectOption(label: string) {
//     if (!this.selectedTags.includes(label)) {
//       this.selectedTags.push(label);
//       this.selectedTagsChange.emit(this.selectedTags);
//     }
//     this.searchText = '';
//     this.dropdownVisible = false;
//     this.filterOptions();
//   }
//
//   removeTag(tag: string) {
//     this.selectedTags = this.selectedTags.filter(t => t !== tag);
//     this.selectedTagsChange.emit(this.selectedTags);
//     this.filterOptions();
//   }
//
//   toggleDropdown() {
//     this.dropdownVisible = !this.dropdownVisible;
//     if (this.dropdownVisible) {
//       this.filterOptions();
//     }
//   }
//
//   isSelected(label: string): boolean {
//     return this.selectedTags.includes(label);
//   }
// }
//////////////////////////////////////


