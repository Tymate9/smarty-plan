import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class VehicleValidator {
  /**
   * Valide que le champ 'energy' comporte entre 1 et 255 caractères.
   * Facultatif : null ou chaîne vide sont acceptés.
   */
  static energyLength(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value == null || value === '') {
        return null;
      }
      if (value.length < 1 || value.length > 255) {
        return { energyLength: "L'énergie doit comporter entre 1 et 255 caractères." };
      }
      return null;
    };
  }

  /**
   * Valide que le champ 'engine' comporte entre 1 et 255 caractères.
   * Facultatif : null ou chaîne vide sont acceptés.
   */
  static engineLength(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value == null || value === '') {
        return null;
      }
      if (value.length < 1 || value.length > 255) {
        return { engineLength: "Le moteur doit comporter entre 1 et 255 caractères." };
      }
      return null;
    };
  }

  /**
   * Valide que 'externalid' n'est pas null et comporte entre 1 et 255 caractères.
   */
  static requiredExternalId(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value == null || value === '') {
        return { requiredExternalId: "L'externalId ne doit pas être null." };
      }
      if (value.length < 1 || value.length > 255) {
        return { externalIdLength: "L'externalId doit comporter entre 1 et 255 caractères." };
      }
      return null;
    };
  }

  /**
   * Valide que 'licenseplate' n'est pas null et respecte le format AA123AA.
   */
  static requiredLicensePlate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value == null || value === '') {
        return { requiredLicensePlate: "La plaque d'immatriculation ne doit pas être null." };
      }
      const plateRegex = /^[A-Z]{2}\d{3}[A-Z]{2}$/;
      if (!plateRegex.test(value)) {
        return { invalidLicensePlate: "La plaque d'immatriculation doit être valide (format: AA123AA)." };
      }
      return null;
    };
  }

  /**
   * Valide que 'category' n'est pas null et que l'ID de la catégorie est strictement positif.
   * Note : L'existence de la catégorie en base sera vérifiée via un appel asynchrone ou en back.
   */
  static requiredCategory(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value == null || value === '') {
        return { requiredCategory: "La catégorie ne doit pas être null." };
      }
      // On suppose que la valeur est un objet avec une propriété "id" ou un nombre.
      let categoryId: number;
      if (typeof value === 'object' && value !== null) {
        categoryId = value.id;
      } else {
        categoryId = value;
      }
      if (categoryId == null || categoryId <= 0) {
        return { invalidCategory: "L'identifiant de la catégorie ne peut être négatif ou égal à zéro." };
      }
      return null;
    };
  }
}
