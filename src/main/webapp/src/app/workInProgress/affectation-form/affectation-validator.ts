import {AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from "@angular/forms";

export class AffectationValidator {

  /**
   * Vérifie que la date de début est renseignée et, si la date de fin est renseignée,
   * que la date de début est strictement inférieure à la date de fin.
   */
  static checkDatesConstraint(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      if (!(group instanceof FormGroup)) {
        return null;
      }
      const startControl = group.get('startDate');
      const endControl = group.get('endDate');

      if (!startControl || !startControl.value) {
        return null;
      }

      const startDate = new Date(startControl.value);
      const endDate = endControl && endControl.value ? new Date(endControl.value) : null;

      if (endDate && startDate >= endDate) {
        return { dateOrder: 'La date de début doit être strictement inférieure à la date de fin.' };
      }
      return null;
    };
  }

  static requiredValue(controlName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        const error: ValidationErrors = {};
        error[controlName + 'Required'] = `${controlName} est obligatoire.`;
        return error;
      }
      return null;
    };
  }
}
