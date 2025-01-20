import {EntityValidator} from "./entity-validator";

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class DriverValidator extends EntityValidator {

  static firstNameRequired(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return { firstNameRequired: 'First Name est obligatoire.' };
      }
      return null;
    };
  }

  static lastNameRequired(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return { lastNameRequired: 'Last Name est obligatoire.' };
      }
      return null;
    };
  }

  static phoneNumber10Digits(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(value)) {
        return { invalidPhoneNumber: 'Phone Number doit être composé de 10 chiffres.' };
      }
      return null;
    };
  }
}

