/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 3.2.1263 on 2024-10-22 09:02:31.

export namespace dto {

    export class PointOfInterestEntity implements PanacheEntityBase {
        id: number;
        category: PointOfInterestCategoryEntity;
        label: string;
        latitude: number;
        longitude: number;
        radius: number;
    }

    export class PointOfInterestCategoryEntity implements PanacheEntityBase {
        id: number;
        label: string;
        color: string;
    }

    export interface PanacheEntityBase {
    }

}
