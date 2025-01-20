import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import {FormInputUtils, IFormInput} from "../iform-input";
import { IEntityService } from "../ientity-service";
import {IFormDescription} from "../iform-description";
import {Subscription} from "rxjs";


@Component({
  selector: 'app-entity-form',
  template: `
    <h2>{{ formDescription.title }}</h2>
    <form [formGroup]="entityForm" (ngSubmit)="onSubmit()">
      <div *ngFor="let input of formDescription.formInputs">
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
            *ngSwitchCase="'text'"
            [id]="input.name"
            [placeholder]="input.placeholder"
            [formControlName]="input.name"
            [type]="input.type"
            [ngClass]="{ 'invalid': hasFieldErrors(input.name) }"
          />
          <input
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
          <input
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
        <span class="global-error" *ngIf="entityForm.errors['categoryParentConstraint']">
          {{ entityForm.errors['categoryParentConstraint'] }}
        </span>
      </div>

      <button type="submit" [disabled]="!entityForm.valid">Soumettre</button>
    </form>
  `,
  styles: [`
    .error { color: red; font-size: 0.9em; }
    .error-list { display: block; position: absolute; background-color: white; border: 1px solid red; padding: 5px; color: red; z-index: 10; }
    label { position: relative; display: block; margin-bottom: 15px; }
    input.invalid, select.invalid { border-color: red; outline: none; }
  `]
})
export class EntityFormComponent implements OnInit, OnChanges {
  @Input() formDescription!: IFormDescription;
  @Input() entityService?: IEntityService<any>;
  @Input() entity?: any;
  @Input() mode: 'create' | 'update' = 'create';
  @Output() receiveResponse = new EventEmitter<any>();

  public entityForm!: FormGroup;
  private dependencySubs: Subscription[] = [];
  protected readonly FormInputUtils = FormInputUtils;

  ngOnInit(): void {
    console.log(this.formDescription);
    this.initializeReactiveForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['formDescription'] && !changes['formDescription'].firstChange) ||
      (changes['entity'] && !changes['entity'].firstChange) ||
      (changes['mode'] && !changes['mode'].firstChange)
    ) {
      this.initializeReactiveForm();
    }
  }

  private initializeReactiveForm(): void {
    const controls: { [key: string]: FormControl } = {};

    this.formDescription.formInputs.forEach(input => {
      controls[input.name] = new FormControl(input.value, input.validators);
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
      const updatedEntity = { ...(this.entity || {}) };
      for (const input of this.formDescription.formInputs) {
        updatedEntity[input.name] = this.entityForm.get(input.name)?.value;
      }

      // Si en mode création, forcer l'id à null
      if (this.mode === 'create') {
        updatedEntity.id = null;
      }

      if (this.entityService) {
        const request = this.mode === 'update'
          ? this.entityService.update(updatedEntity)
          : this.entityService.create(updatedEntity);

        request.subscribe({
          next: response => this.receiveResponse.emit(response),
          error: err => this.receiveResponse.emit({ error: err })
        });
      } else {
        this.receiveResponse.emit(updatedEntity);
      }
    } else {
      console.log('Formulaire invalide :', this.entityForm.errors);
    }
  }

  public onOptionSelected(event: any) {
    console.log('Option choisie :', event.option);
    console.log(this.entityForm.errors);
  }
}
