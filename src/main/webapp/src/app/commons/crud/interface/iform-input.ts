import {ValidatorFn} from "@angular/forms";


export class FormInputUtils {
  public static isAutocompleteFormInput(input: IFormInput): input is AutocompleteFormInput {
    return input.type === 'autocomplete' && !!(input as AutocompleteFormInput).options;
  }
}

export interface IFormInput {
  name: string;
  type: string;
  label: string;
  validators: ValidatorFn[];
  value?: any;
  showErrors?: boolean;
  placeholder?: string;
}

export class FormInput implements IFormInput {
  name: string;
  type: string;
  label: string;
  validators: ValidatorFn[];
  value?: any;
  showErrors?: boolean;
  placeholder?: string;

  constructor(
    name: string,
    type: string,
    label: string,
    validators: ValidatorFn[],
    value?: any,
    placeholder?: string,
    showErrors?: boolean
  ) {
    this.name = name;
    this.type = type;
    this.label = label;
    this.validators = validators;
    this.value = value;
    this.placeholder = placeholder;
    this.showErrors = showErrors ?? false;
  }
}

export class AutocompleteFormInput extends FormInput {
  options: any[];
  displayFn?: (obj: any) => string;

  constructor(
    name: string,
    label: string,
    validators: ValidatorFn[],
    options: any[],
    displayFn?: (obj: any) => string,
    value?: any,
    placeholder?: string
  ) {
    super(name, 'autocomplete', label, validators, value, placeholder);
    this.options = options;
    this.displayFn = displayFn;
  }
}
