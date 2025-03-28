import {AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';

export class TeamValidator {
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

}
