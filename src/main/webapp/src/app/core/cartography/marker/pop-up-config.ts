import {EntityType} from "./MarkerFactory";

export type PoiPopupTab = 'information' | 'proximite' | 'dessus' | 'editer';
export type VehiclePopupTab = 'information' | 'poi';

export class PopUpConfig {
  poiPopupTabs: Set<PoiPopupTab>;
  vehiclePopupTabs: Set<VehiclePopupTab>;
  isAreaDynamic: boolean;

  constructor(config?: Partial<PopUpConfig>) {
    this.poiPopupTabs = config?.poiPopupTabs? config.poiPopupTabs : new Set(['information', 'proximite', 'dessus', 'editer']);
    this.vehiclePopupTabs = config?.vehiclePopupTabs? config.vehiclePopupTabs : new Set(['information', 'poi']);
    this.isAreaDynamic = config?.isAreaDynamic? config.isAreaDynamic : true;
  }

  isTabEnabled(entityType: EntityType, tab: string): boolean {
    if (entityType === EntityType.POI && this.poiPopupTabs.has(tab as PoiPopupTab)) {
      return true;
    }
    if (entityType === EntityType.VEHICLE && this.vehiclePopupTabs.has(tab as VehiclePopupTab)) {
      return true;
    }
    return false;
  }
}
