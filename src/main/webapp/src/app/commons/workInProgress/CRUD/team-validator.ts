import {AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';

export class TeamValidator {
  /**
   * Vérifie les contraintes entre le champ "category" et "parent_id".
   * Par exemple, si la catégorie est "Agence", parent_id doit être null,
   * sinon parent_id doit être renseigné.
   */
  static checkCategoryParentConstraint(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      if (!(group instanceof FormGroup)) {
        return null;
      }
      const categoryControl = group.get('category');
      const parentControl = group.get('parentTeam');

      if (!categoryControl || !parentControl) {
        return null;
      }

      const categoryValue = categoryControl.value;
      const parentValue = parentControl.value;

      if (!categoryValue) {
        return null;
      }
      if (categoryValue.label === 'Agence' && parentValue != null) {
        return { categoryParentConstraint: 'Une agence ne peut pas avoir de groupe parent.' };
      }
      if (categoryValue.label !== 'Agence' && (parentValue == null || parentValue === '')) {
        return { categoryParentConstraint: 'Veuillez sélectionner un groupe parents.' };
      }
      return null;
    };
  }

  static requiredLabel(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return { requiredLabel: 'Label est obligatoire.' };
      }
      return null;
    };
  }

  /**
   * Valide qu'une valeur autocomplete n'est pas nulle et qu'elle figure dans la liste des options.
   * @param options Liste des options valides pour le champ autocomplete.
   */
  static requiredAutocomplete(options: any[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return { requiredAutocomplete: 'Ce champ est obligatoire.' };
      }
      // Vérifie si la valeur existe dans la liste d'options.
      // On suppose ici que chaque objet option possède une propriété 'id'.
      const exists = options.some(opt => opt.id === value.id);
      if (!exists) {
        return { invalidOption: 'La valeur sélectionnée n\'est pas valide.' };
      }
      return null;
    };
  }

  /**
   * Validator simple pour vérifier qu'une valeur autocomplete n'est pas nulle.
   */
  static requiredValue(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return control.value ? null : { requiredValue: 'Ce champ est obligatoire.' };
    };
  }

  /**
   * Validator pour vérifier si la valeur figure dans une liste d'options.
   * Nécessite la liste des options et une fonction de comparaison.
   */
  static valueInList(options: any[], compareFn?: (opt: any, value: any) => boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null; // Laissez le validator required s'en charger.
      }
      const isValid = options.some(opt => compareFn ? compareFn(opt, value) : opt.id === value.id);
      return isValid ? null : { invalidOption: 'La valeur sélectionnée n\'est pas dans la liste.' };
    };
  }
}
