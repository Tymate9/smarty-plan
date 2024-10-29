/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 3.2.1263 on 2024-10-28 19:56:47.

import * as custom from "../habarta/custom";

export namespace dto {

    export class PointOfInterestEntity implements PanacheEntityBase {
        id: number;
        category: PointOfInterestCategoryEntity;
        label: string;
        coordinate: custom.GeoPoint;
        area: custom.GeoPolygon;
    }

    export class PointOfInterestCategoryEntity implements PanacheEntityBase {
        id: number;
        label: string;
        color: string;
    }

    export interface PanacheEntityBase {
    }

}
