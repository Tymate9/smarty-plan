import {IFormDependency, IFormDescription} from "./iform-description";
import {AbstractControl, FormGroup, ValidatorFn} from "@angular/forms";
import {IFormInput} from "./iform-input";
import {Subscription} from "rxjs";

export class FormDescription implements IFormDescription {
  title: string;
  formValidator?: ValidatorFn;
  formInputs: IFormInput[];
  dependencies?: IFormDependency[];

  constructor(
    title: string,
    formInputs: IFormInput[],
    formValidator?: ValidatorFn,
    dependencies?: IFormDependency[]
  ) {
    this.title = title;
    this.formInputs = formInputs;
    this.formValidator = formValidator;
    this.dependencies = dependencies;
  }

  applyDisableDependency(
    group: FormGroup,
    conditionFn: (group: FormGroup) => boolean,
    controlNames: string[]
  ): Subscription {
    return group.valueChanges.subscribe(() => {
      if (conditionFn(group)) {
        controlNames.forEach(name => {
          const ctrl: AbstractControl | null = group.get(name);
          if (ctrl && !ctrl.disabled) {
            ctrl.disable({ emitEvent: false });
            ctrl.setValue(null, { emitEvent: false });
          }
        });
      } else {
        controlNames.forEach(name => {
          const ctrl: AbstractControl | null = group.get(name);
          if (ctrl && ctrl.disabled) {
            ctrl.enable({ emitEvent: false });
          }
        });
      }
    });
  }

  applyDependencies(group: FormGroup): Subscription[] {
    const subs: Subscription[] = [];
    if (this.dependencies) {
      this.dependencies.forEach(dep => {
        const sub = this.applyDisableDependency(
          group,
          dep.condition,
          dep.controlsToDisable
        );
        subs.push(sub);
      });
    }
    return subs;
  }
}
