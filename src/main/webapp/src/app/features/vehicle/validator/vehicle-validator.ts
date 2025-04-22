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

  /**
   * Valide que 'theoreticalConsumption' est un nombre >= 0.
   * Optionnel : Si le champ est vide ou null, pas d'erreur.
   */
  static theoreticalConsumption(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value == null || value === '') {
        // Champ facultatif
        return null;
      }

      // Tenter de parser la valeur en nombre
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        return { invalidTheoreticalConsumption: "La consommation théorique doit être un nombre valide." };
      }

      if (numericValue < 0) {
        return { negativeTheoreticalConsumption: "La consommation théorique ne doit pas être négative." };
      }

      //Vérifier max 2 décimales via regex :
       if (!/^\d+(\.\d{1,2})?$/.test(value)) {
         return { decimalPrecision: "La consommation théorique ne doit pas dépasser 2 décimales." };
       }

      return null;
    };
  }

  /**
   * Valide que 'mileage' est un nombre >= 0.
   * Optionnel : Si le champ est vide ou null, pas d'erreur.
   */
  static mileage(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value == null || value === '') {
        // Champ facultatif
        return null;
      }

      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        return { invalidMileage: "Le kilométrage doit être un nombre valide." };
      }

      if (numericValue < 0) {
        return { negativeMileage: "Le kilométrage ne doit pas être négatif." };
      }

      return null;
    };
  }

  /**
   * Valide que 'serviceDate' (optionnel) respecte un format YYYY-MM-DD si renseigné.
   */
  static serviceDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }

      // Vérification par expression régulière
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return { invalidServiceDate: "La date de mise en service doit être au format YYYY-MM-DD." };
      }

      const parsedDate = new Date(value);
      if (isNaN(parsedDate.getTime())) {
         return { invalidServiceDate: "Date invalide." };
      }

      return null;
    };
  }
}
