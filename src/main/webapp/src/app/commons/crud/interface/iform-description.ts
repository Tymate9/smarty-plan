import {FormGroup, ValidatorFn} from "@angular/forms";
import {IFormInput} from "./iform-input";
import {Subscription} from "rxjs";

export interface IFormDependency {
  condition: (group: FormGroup) => boolean;
  controlsToDisable: string[];
}

export interface IFormDescription {
  title: string | undefined;
  formValidator?: ValidatorFn;
  formInputs: IFormInput[];
  dependencies?: IFormDependency[];
  transformToForm?: (rawEntity: any) => any;  // Nouvelle propriété

  applyDisableDependency(
    group: FormGroup,
    conditionFn: (group: FormGroup) => boolean,
    controlNames: string[]
  ): Subscription

  applyDependencies(group: FormGroup): Subscription[]
}
