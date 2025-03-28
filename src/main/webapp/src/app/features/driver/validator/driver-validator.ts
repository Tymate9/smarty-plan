import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class DriverValidator {
  /**
   * Valide que le champ first_name n'est pas vide.
   */
  static requiredFirstName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value || value.trim() === '') {
        return { requiredFirstName: 'Le prénom est obligatoire.' };
      }
      return null;
    };
  }

  /**
   * Valide que le champ last_name n'est pas vide.
   */
  static requiredLastName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value || value.trim() === '') {
        return { requiredLastName: 'Le nom est obligatoire.' };
      }
      return null;
    };
  }

  /**
   * Valide que le champ phone_number, s'il est renseigné, correspond à un numéro de téléphone valide.
   * Ici, le numéro est attendu sous forme de 10 chiffres, éventuellement précédé d'un indicatif international.
   */
  static validPhoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      // Si aucune valeur n'est renseignée, le contrôle est valide (le champ est optionnel)
      if (!value || value.trim() === '') {
        return null;
      }
      // Exemple de regex simple pour un numéro de téléphone (ex: +1-1234567890 ou 1234567890)
      const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
      if (!phoneRegex.test(value)) {
        return { invalidPhoneNumber: 'Le numéro de téléphone n\'est pas valide.' };
      }
      return null;
    };
  }
}
