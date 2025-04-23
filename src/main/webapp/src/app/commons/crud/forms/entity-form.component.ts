import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule} from '@angular/forms';
import {FormInputUtils, IFormInput} from "../interface/iform-input";
import {CrudEventType, IEntityService} from "../interface/ientity-service";
import {IFormDescription} from "../interface/iform-description";
import {Observable, Subscription} from "rxjs";
import {NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault} from "@angular/common";
import {AutocompleteInputComponent} from "../../inputs/autocomplete-input.component";
import {InputText} from "primeng/inputtext";
import {Button} from "primeng/button";
import {Calendar} from "primeng/calendar";
import {DatePicker} from "primeng/datepicker";

@Component({
  selector: 'app-entity-form',
  template: `
    <h2 *ngIf="formDescription.title != undefined">{{  formDescription.title }}</h2>
    <form [formGroup]="entityForm" (ngSubmit)="onSubmit()">
      <div *ngFor="let input of formDescription.formInputs" class="form-group">
        <label
          [for]="input.name"
          (mouseenter)="showErrors(input.name)"
          (mouseleave)="hideErrors(input.name)"
        >
          {{ input.label }}
          <div *ngIf="input.showErrors && hasFieldErrors(input.name)" class="error-list">
            <span *ngFor="let errorMsg of getFieldErrors(input.name)" class="error">
              {{ errorMsg }}
            </span>
          </div>
        </label>

        <ng-container [ngSwitch]="input.type">
          <input
            pInputText
            *ngSwitchCase="'text'"
            [id]="input.name"
            [placeholder]="input.placeholder"
            [formControlName]="input.name"
            [type]="input.type"
            [ngClass]="{ 'invalid': hasFieldErrors(input.name) }"
          />
          <input
            pInputText
            *ngSwitchCase="'number'"
            [id]="input.name"
            [placeholder]="input.placeholder"
            [formControlName]="input.name"
            [type]="input.type"
            [ngClass]="{ 'invalid': hasFieldErrors(input.name) }"
          />
          <ng-container *ngSwitchCase="'autocomplete'">
            <app-autocomplete-input
              *ngIf="FormInputUtils.isAutocompleteFormInput(input)"
              [options]="input.options"
              [displayFn]="input.displayFn"
              [placeholder]="input.placeholder || ''"
              [autoActiveFirstOption]="true"
              formControlName="{{ input.name }}"
              (optionSelected)="onOptionSelected($event)"
              [ngClass]="{ 'invalid': hasFieldErrors(input.name) }"
            ></app-autocomplete-input>
          </ng-container>
<!--          <ng-container *ngSwitchCase="'date'">-->
<!--            <p-datepicker-->
<!--              [id]="input.name"-->
<!--              [placeholder]="input.placeholder"-->
<!--              formControlName="{{ input.name }}"-->
<!--              [ngClass]="{ 'invalid': hasFieldErrors(input.name) }"-->
<!--              [showOtherMonths]="true"-->
<!--              [selectOtherMonths]="true"-->
<!--              [showButtonBar]="true"-->
<!--              [showIcon]="true"-->
<!--              [readonlyInput]="true"-->
<!--              appendTo="body"-->
<!--            >-->
<!--            </p-datepicker>-->
<!--          </ng-container>-->
          <input
            pInputText
            *ngSwitchDefault
            [id]="input.name"
            [placeholder]="input.placeholder"
            [formControlName]="input.name"
            [type]="input.type"
            [ngClass]="{ 'invalid': hasFieldErrors(input.name) }"
          />
        </ng-container>
      </div>

      <div *ngIf="entityForm.errors">
        <span class="global-error" *ngFor="let errorKey of getGroupErrorKeys()">
            {{ entityForm.errors[errorKey] }}
        </span>
      </div>

      <p-button type="submit"  label="Soumettre" [disabled]="!entityForm.valid"></p-button>
    </form>
  `,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgSwitch,
    NgForOf,
    NgIf,
    NgSwitchCase,
    NgSwitchDefault,
    InputText,
    Button,
    AutocompleteInputComponent,
    Calendar,
    DatePicker
  ],
  styles: [`

    .form-group {
      margin-bottom: 1rem;
    }
    .error {
      color: #aa001f;
      font-size: 0.9em;
    }
    .error-list {
      display: block;
      position: absolute;
      background-color: white;
      border: 1px solid #aa001f;
      padding: 5px;
      color: #aa001f;
      z-index: 10;
    }

    label {
      position: relative;
      display: block;
      margin-bottom: 15px;
    }

    input.invalid, select.invalid {
      border-color: #aa001f;
      outline: none;
    }
  `]
})
export class EntityFormComponent implements OnInit, OnChanges {
  @Input() formDescription!: IFormDescription;
  @Input() entityService?: IEntityService<any, any>;
  @Input() entity?: any;
  @Input() mode: 'create' | 'update' = 'create';
  @Output() receiveResponse = new EventEmitter<any>();

  public entityForm!: FormGroup;
  private dependencySubs: Subscription[] = [];
  protected readonly FormInputUtils = FormInputUtils;

  ngOnInit(): void {
    console.log(this.formDescription)
    this.initializeReactiveForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['formDescription'] && !changes['formDescription'].firstChange) ||
      (changes['entity'] && !changes['entity'].firstChange) ||
      (changes['mode'] && !changes['mode'].firstChange)
    ) {
      console.log(this.formDescription)
      this.initializeReactiveForm();
    }
  }

  private initializeReactiveForm(): void {
    const controls: { [key: string]: FormControl } = {};

    console.log(controls)
    this.formDescription.formInputs.forEach(input => {
      controls[input.name] = new FormControl();
      controls[input.name].setValue(input.value);
      controls[input.name].setValidators(input.validators);
      if (input.showErrors === undefined) {
        input.showErrors = false;
      }
    });

    this.entityForm = new FormGroup(controls, {
      validators: this.formDescription.formValidator ? [this.formDescription.formValidator] : []
    });

    this.dependencySubs.forEach(sub => sub.unsubscribe());
    this.dependencySubs = this.formDescription.applyDependencies(this.entityForm);
  }

  public getFieldErrors(fieldName: string): string[] {
    const control = this.entityForm.get(fieldName);
    if (!control || !control.errors) return [];
    return Object.values(control.errors).map(msg => String(msg));
  }

  public hasFieldErrors(fieldName: string): boolean {
    return this.getFieldErrors(fieldName).length > 0;
  }

  public showErrors(fieldName: string): void {
    const input = this.formDescription.formInputs.find(i => i.name === fieldName);
    if (input) input.showErrors = true;
  }

  public hideErrors(fieldName: string): void {
    const input = this.formDescription.formInputs.find(i => i.name === fieldName);
    if (input) input.showErrors = false;
  }

  public onSubmit(): void {
    if (this.entityForm.valid) {
      // En mode update, sauvegarder une copie de l'entité d'origine
      const originalEntity = this.mode === 'update' ? { ...this.entity } : null;

      const updatedEntity: any = { ...(this.entity || {}) };
      for (const input of this.formDescription.formInputs) {
        updatedEntity[input.name] = this.entityForm.get(input.name)?.value;
      }

      // Appliquer la fonction de transformation si elle est définie
      let finalEntity = updatedEntity;
      if (this.formDescription.transformToForm) {
        finalEntity = this.formDescription.transformToForm(updatedEntity);
        if (this.mode === 'create') {
          // En mode création, forcer l'id à null
          finalEntity.id = null;
        }
      }

      if (this.entityService) {
        let request: Observable<any>;
        if (this.mode === 'update') {
          request = this.entityService.update(finalEntity);
        } else {
          request = this.entityService.create(finalEntity);
        }

        request.subscribe({
          next: response => {
            // Notification uniquement en cas de succès
            if (this.mode === 'update') {
              this.entityService?.notifyCrudEvent({
                type: CrudEventType.UPDATE,
                oldData: originalEntity,
                newData: response
              });
            } else {
              this.entityService?.notifyCrudEvent({
                type: CrudEventType.CREATE,
                oldData: null,
                newData: response
              });
            }
            this.receiveResponse.emit(response);
          },
          error: err => this.receiveResponse.emit({ error: err })
        });
      } else {
        this.receiveResponse.emit(finalEntity);
      }
    } else {
      console.error('Formulaire invalide :', this.entityForm.errors);
    }
  }

  public onOptionSelected(event: any) {
  }

  public getGroupErrorKeys(): string[] {
    return this.entityForm && this.entityForm.errors
      ? Object.keys(this.entityForm.errors)
      : [];
  }
  filterOptions(event: any, input: any) {
    const query = event.query.toLowerCase();
    input.filteredOptions = (input.allOptions || []).filter((option: any) =>
      input.displayFn(option).toLowerCase().includes(query)
    );
  }
}
