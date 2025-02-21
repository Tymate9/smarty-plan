import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from "@angular/core";
import {Button} from "primeng/button";
import {FormsModule} from "@angular/forms";
import {NgForOf, NgIf, NgStyle} from "@angular/common";
import {InputText} from "primeng/inputtext";

export interface Option {
  label: string;
  children?: Option[];
}
@Component({
  selector: 'app-team-tree',
  template: `
    <div class="search-autocomplete">
      <div class="input-container">
        <div class="tags">
          <span *ngFor="let tag of selectedTags" class="tag">
            {{ tag }}
            <p-button (click)="removeTag(tag)" icon="pi pi-times" styleClass="custom-button-close"></p-button>
          </span>
          <input
            type="text"
            [(ngModel)]="searchText"
            (input)="onSearch()"
            (focus)="openDropdown()"
            (blur)="onInputBlur()"
            placeholder="Filtrer {{ label }}..."
            [ngStyle]="{'background-color': 'white'}"
          />
        </div>
      </div>

      <!-- Display a flat list or hierarchical list based on data structure -->
      <ul id='dropdown' *ngIf="dropdownVisible && filteredOptions.length > 0" class="autocomplete-list">
        <ng-container *ngFor="let option of filteredOptions">
          <li>
            <div (click)="selectOption(option.label)" [class.selected]="isSelected(option.label)">
              {{ option.label }}
            </div>

            <!-- Check if option has children, if so display them -->
            <ul *ngIf="option.children && option.children.length > 0">
              <ng-container *ngFor="let child of option.children">
                <li>
                  <div (click)="selectOption(child.label)" [class.selected]="isSelected(child.label)">
                    {{ child.label }}
                  </div>
                  <ul *ngIf="child.children && child.children.length > 0">
                    <ng-container *ngFor="let subChild of child.children">
                      <li>
                        <div (click)="selectOption(subChild.label)" [class.selected]="isSelected(subChild.label)">
                          {{ subChild.label }}
                        </div>
                      </li>
                    </ng-container>
                  </ul>
                </li>
              </ng-container>
            </ul>
          </li>
        </ng-container>
      </ul>
    </div>
  `,
  standalone: true,
  imports: [
    Button,
    FormsModule,
    NgStyle,
    NgForOf,
    NgIf,
    InputText
  ],
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
      border-radius: 5px;

    }
    .input-container input {
      border: none;
      outline: none;
      flex-grow: 1;
      min-width: 120px;
      background-color: white;
      border-radius: 5px;
      color: black;
    }
    .input-container:hover,
    .input-container:focus-within {
      border-color: #aa001f;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      flex-grow: 1;
      background-color: white;
      max-height: 50px;
      overflow-y: auto;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tag {
      background-color: #e0e0e0;
      border-radius: 5px;
      padding: 5px;
      margin-right: 5px;
      display: flex;
      align-items: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .input-container input {
      border: none;
      outline: none;
      flex-grow: 1;
      min-width: 150px;
      background-color: white;
      border-radius: 5px;
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
      color: black;
      //z-index: 100000;
    }

    .autocomplete-list li {
      padding: 5px;
      cursor: pointer;
      margin-left: 10px;
      //z-index: 100000;
    }

    .autocomplete-list div.selected {
      background-color: #d0e8ff;
    }

    .autocomplete-list div:hover {
      background-color: #f0f0f0;
    }

    ::ng-deep .p-button.p-component.p-button-icon-only.custom-button-close {
      background-color: #aa001f !important;
      border-color: #aa001f !important;
      color: white !important;
      font-weight: 600;
      margin-left: 4px;
      width: 20px;
      height: 20px;
      font-size: 10px;
      padding: 2px;

    }

  `]
})
export class TeamTreeComponent implements OnChanges{
  @Input() label: string = '';
  @Input() options: Option[] = [];
  @Input() selectedItems: string[] = [];
  @Output() selectedTagsChange = new EventEmitter<string[]>();  // Emit selected tags


  searchText = '';
  selectedTags: string[] = [];
  filteredOptions: Option[] = [];
  dropdownVisible: boolean = false;

  // Filtrer les options et exclure celles déjà sélectionnées
  onSearch() {
    this.filterOptions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedItems']) {
      this.selectedTags = [...this.selectedItems]; // Copier les éléments sélectionnés
      this.filterOptions(); // Mettre à jour les options filtrées
    }
  }

  filterOptions() {
    if (this.searchText) {
      this.filteredOptions = this.options.filter(option =>
        option.label.toLowerCase().includes(this.searchText.toLowerCase()) &&
        !this.selectedTags.includes(option.label)
      );
    } else {
      this.filteredOptions = this.options.filter(option => !this.selectedTags.includes(option.label));
    }
  }

  // Add selected option to tags
  selectOption(option: string) {
    if (!this.selectedTags.includes(option)) {
      this.selectedTags.push(option);
      this.selectedTagsChange.emit(this.selectedTags);  // Emit selected tags
    }
    this.searchText = '';
    this.dropdownVisible = false;
    this.filterOptions();
  }

  // Remove selected tag
  removeTag(tag: string) {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
    this.selectedTagsChange.emit(this.selectedTags);  // Re-emit after removal
    this.filterOptions();
  }

  openDropdown() {
    this.dropdownVisible = true;
    //this.dropdown.focus()
    document.getElementById('dropdown')?.focus()

  }

  closeDropdown() {
    this.dropdownVisible = false;
  }

  // Toggle dropdown visibility
  toggleDropdown() {
    this.dropdownVisible = !this.dropdownVisible;
    if (this.dropdownVisible) {
      this.filterOptions();
      document.getElementById('dropdown')?.focus()
    }
  }

  // Check if option is selected
  isSelected(option: string): boolean {
    return this.selectedTags.includes(option);
  }
  onInputBlur(): void {
    // Delay the closing to give time for the click event to be handled
    setTimeout(() => {
      if (!this.isDropdownClicked) {
        this.closeDropdown();
      }
      this.isDropdownClicked = false;  // Reset after checking
    }, 300);
  }
  isDropdownClicked: boolean = false;
  onDropdownClick(): void {
    this.isDropdownClicked = true;
  }
}
