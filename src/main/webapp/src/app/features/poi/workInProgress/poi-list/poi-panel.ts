import {dto} from "../../../../../habarta/dto";
import PointOfInterestEntity = dto.PointOfInterestEntity;

export class PoiPanel {
  public selectedCategoryId: number;
  public isModified: boolean = false;

  private originalAddress: string;
  private originalLatitude: number;
  private originalLongitude: number;

  constructor(
    public poi: PointOfInterestEntity,
    public expanded: boolean = false,
    public address?: string,
    private _inputType: string = 'adresse'
  ) {
    this.poi.client_code = this.poi.client_code == null ? "0000" : this.poi.client_code;
    this.selectedCategoryId = this.poi.category.id;
    this.originalAddress = this.poi.address;
    this.originalLatitude = this.poi.coordinate.coordinates[1];
    this.originalLongitude = this.poi.coordinate.coordinates[0];
  }

  get inputType(): string {
    return this._inputType;
  }

  set inputType(value: string) {
    if (value !== this._inputType) {
      // Réinitialiser l'adresse et les coordonnées aux valeurs originales
      this.poi.address = this.originalAddress;
      this.poi.coordinate.coordinates = [this.originalLongitude, this.originalLatitude];
      this.isModified = true;
    }
    this._inputType = value;
  }

  resetModifiedValues() {
    this.isModified = false;
    // Mettre à jour les valeurs originales avec l'état actuel du poi
    this.originalAddress = this.poi.address;
    this.originalLatitude = this.poi.coordinate.coordinates[1];
    this.originalLongitude = this.poi.coordinate.coordinates[0];
  }

  public hasLocationChanged(): boolean {
    // Vérifie si l'adresse ou les coordonnées ont changé par rapport à l'original
    const addressChanged = this.poi.address.trim() !== this.originalAddress.trim();
    const coordsChanged = (this.poi.coordinate.coordinates[1] !== this.originalLatitude) ||
      (this.poi.coordinate.coordinates[0] !== this.originalLongitude);
    return addressChanged || coordsChanged;
  }
}
