
export class EntityValidator {
  protected entity: any;
  protected errors: { field: string; message: string }[];

  constructor(entity: any) {
    this.entity = entity;
    this.errors = [];
  }

  validate(): void {
    throw new Error('validate() doit être implémentée par les sous-classes');
  }

  protected addError(field: string, message: string): void {
    this.errors.push({ field, message });
  }

  public getErrors(): { field: string; message: string }[] {
    return this.errors;
  }
}
