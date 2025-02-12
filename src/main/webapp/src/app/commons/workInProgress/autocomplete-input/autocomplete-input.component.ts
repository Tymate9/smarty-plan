import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {filter, Subscription} from 'rxjs';
import {JsonPipe, NgForOf, NgIf} from "@angular/common";

/**
 * Événement émis quand l’utilisateur sélectionne une option.
 */
export interface AutocompleteSelectedEvent {
  source: AutocompleteInputComponent;
  option: any;
}

/**
 * Composant autocomplete "custom" inspiré d’Angular Material,
 * s’intégrant dans un formulaire réactif via ControlValueAccessor.
 */
@Component({
  selector: 'app-autocomplete-input',
  template: `
    <div class="autocomplete-container">
      <!-- Champ texte -->
      <input
        #inputRef
        type="text"
        [placeholder]="placeholder"
        [value]="displayValue"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown)="onKeydown($event)"
        [attr.aria-expanded]="panelOpen"
        [attr.aria-owns]="panelOpen ? id : null"
      />

      <!-- Panneau de suggestions -->
      <div
        #panel
        class="autocomplete-panel"
        *ngIf="panelOpen"
        [id]="id"
        role="listbox"
      >
        <div
          class="autocomplete-option"
          *ngFor="let opt of filteredOptions; let i = index"
          [class.active]="i === activeOptionIndex"
          (click)="selectOption(opt)"
          role="option"
          [attr.aria-selected]="i === activeOptionIndex"
        >
          {{ displayFn ? displayFn(opt) : (opt?.label || (opt | json)) }}
        </div>

        <div class="autocomplete-no-results" *ngIf="filteredOptions.length === 0">
          Aucune suggestion
        </div>
      </div>
    </div>
  `,
  /**
   * CSS en inline, comme demandé.
   * Ajuste les classes et la mise en page à tes besoins (positions, animations, etc.).
   */
  styles: [`
    .autocomplete-container {
      position: relative;
      display: inline-block;
    }

    .autocomplete-container input {
      box-sizing: border-box;
    }

    .autocomplete-panel {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      border: 1px solid #ccc;
      background: #fff;
      z-index: 10;
      max-height: 200px;
      overflow-y: auto;
      box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      padding: 4px 0;
    }

    .autocomplete-option {
      padding: 6px 10px;
      cursor: pointer;
    }

    .autocomplete-option:hover,
    .autocomplete-option.active {
      background-color: #eee;
    }

    .autocomplete-no-results {
      font-style: italic;
      padding: 6px 10px;
      color: #999;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    JsonPipe,
    NgIf,
    NgForOf
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteInputComponent),
      multi: true
    }
  ]
})
export class AutocompleteInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @ViewChild('panel') panelRef!: ElementRef<HTMLDivElement>;

  /** Tableau d’options (objets quelconques). */
  @Input() options: any[] = [];

  /** Fonction d’affichage personnalisée : reçoit un objet, renvoie une string. */
  @Input() displayFn?: (option: any) => string;

  /** Placeholder du champ texte */
  @Input() placeholder: string = '';

  /** Active la première option automatiquement au filtrage. */
  @Input()
  get autoActiveFirstOption(): boolean { return this._autoActiveFirstOption; }
  set autoActiveFirstOption(val: boolean) {
    this._autoActiveFirstOption = coerceBooleanProperty(val);
  }
  private _autoActiveFirstOption = false;

  /** Événement quand une option est sélectionnée */
  @Output() optionSelected = new EventEmitter<AutocompleteSelectedEvent>();

  /** Identifiant du panel (pour aria-owns) */
  public id = `autocomplete-panel-${Math.random().toString(36).slice(2)}`;

  /** Panel ouvert ou non */
  public panelOpen = false;

  /** Liste filtrée selon la saisie */
  public filteredOptions: any[] = [];

  /** Index de l’option active (pour navigation au clavier) */
  public activeOptionIndex: number | null = null;

  /** Valeur interne sélectionnée */
  private _value: any = null;

  @ViewChild('inputRef', {static: true})
  private _inputRef!: ElementRef<HTMLInputElement>;

  /** Subscriptions éventuelles (si tu en as) */
  private _subs = new Subscription();

  // Callbacks ControlValueAccessor
  private onChangeFn: (val: any) => void = () => {};
  private onTouchedFn: () => void = () => {};

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initialiser filteredOptions
    this.filteredOptions = [...this.options];
  }

  ngOnDestroy() {
    this._subs.unsubscribe();
  }

  /** Contrat du ControlValueAccessor : on écrit la valeur du FormControl dans _value */
  writeValue(obj: any): void {
    this._value = obj;
    this._inputRef.nativeElement.value = this.displayValue;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (val: any) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this._inputRef.nativeElement.disabled = isDisabled;
  }

  /** Valeur text affichée dans l’input */
  get displayValue(): string {
    if (!this._value) {
      return '';
    }
    if (this.displayFn) {
      return this.displayFn(this._value);
    }
    return this._value?.label ?? String(this._value);
  }

  /** Ouverture du panel */
  openPanel() {
    if (!this.panelOpen) {
      this.panelOpen = true;
      this.filterOptions(this._inputRef.nativeElement.value);
      this.cdr.markForCheck();
    }
  }

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.openPanel();
    this.filterOptions(value);
  }

  onFocus() {
    this.openPanel();
  }

  onBlur() {
    setTimeout(() => {
      this.closePanel();
    }, 200);
  }

  onKeydown(event: KeyboardEvent) {
    if (!this.panelOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      this.openPanel();
      return;
    }
    if (this.panelOpen && this.filteredOptions.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.moveActiveOption(1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.moveActiveOption(-1);
          break;
        case 'Enter':
          event.preventDefault();
          if (this.activeOptionIndex == null) {
            if (this.filteredOptions.length === 1) {
              this.selectOption(this.filteredOptions[0]);
            } else {
              this._inputRef.nativeElement.value = this.displayValue;
            }
          } else {
            const opt = this.filteredOptions[this.activeOptionIndex];
            this.selectOption(opt);
          }
          break;
        case 'Escape':
          this.closePanel();
          break;
      }
    }
  }

  /** Filtre les options en fonction du texte saisi */
  private filterOptions(inputValue: string) {
    this.filteredOptions = this.options.filter(opt => {
      const label = this.displayFn ? this.displayFn(opt) : (opt?.label ?? String(opt));
      return label.toLowerCase().includes(inputValue.toLowerCase());
    });
    this.cdr.markForCheck();
  }

  /** Sélection de l’option */
  selectOption(opt: any) {
    this._value = opt;
    this._inputRef.nativeElement.value = this.displayValue;
    this.onChangeFn(this._value);
    this.optionSelected.emit({
      source: this,
      option: opt,
    });
    this.closePanelWithoutSelection();
  }

  closePanelWithoutSelection() {
    if (this.panelOpen) {
      this.panelOpen = false;
      this.activeOptionIndex = null;
      this.cdr.markForCheck();
    }
  }

  /** Fermeture du panel */
  closePanel() {
    if (this.panelOpen) {
      this.panelOpen = false;
      this.activeOptionIndex = null;
      let optSearch = this.options.find(
        (obj: any) => this.displayFn && this.displayFn(obj) == this._inputRef.nativeElement.value
      );
      if (optSearch != undefined)
      {
        this.selectOption(optSearch)
      }
      if(this._value == null || (this.displayFn && this.displayFn(this._value) != this._inputRef.nativeElement.value))
      {
        this.selectOption(null)
      }
      this.cdr.markForCheck();
    }
  }

  /** Navigation flèche haut/bas */
  private moveActiveOption(increment: number) {
    let newIndex = this.activeOptionIndex == null ? 0 : this.activeOptionIndex + increment;
    if (newIndex < 0) {
      newIndex = this.filteredOptions.length - 1;
    } else if (newIndex >= this.filteredOptions.length) {
      newIndex = 0;
    }
    this.activeOptionIndex = newIndex;
    this.cdr.markForCheck();
    this.scrollActiveOptionIntoView();  // Ajuste le défilement après mise à jour
  }

  private scrollActiveOptionIntoView(): void {
    if (this.panelRef && this.activeOptionIndex !== null) {
      const panelEl = this.panelRef.nativeElement;
      const options = panelEl.querySelectorAll('.autocomplete-option');
      const activeOption = options[this.activeOptionIndex] as HTMLElement;
      if (activeOption) {
        activeOption.scrollIntoView({ block: 'nearest' });
      }
    }
  }
}
