/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 3.2.1263 on 2024-10-30 16:41:36.

import * as custom from "../habarta/custom";

export namespace dto {

    export class PointOfInterestEntity implements PanacheEntityBase {
        id: number;
        category: PointOfInterestCategoryEntity;
        label: string;
        coordinate: custom.GeoPoint;
        area: custom.GeoPolygon;
    }

    export class DeviceDTO {
        id: number;
        imei: string;
        label: string | null;
        manufacturer: string | null;
        model: string | null;
        serialNumber: string | null;
        simNumber: string | null;
        gatewayEnabled: boolean;
        lastDataDate: Date | null;
        comment: string | null;
        lastCommunicationDate: Date | null;
        active: boolean;
        coordinate: custom.GeoPoint | null;
    }

    export class DeviceSummaryDTO {
        id: number;
        lastCommunicationDate: Date | null;
        active: boolean;
        coordinate: custom.GeoPoint | null;
    }

    export class DeviceVehicleInstallDTO {
        id: DeviceVehicleInstallId;
        endDate: Date | null;
        fitmentOdometer: number | null;
        fitmentOperator: string | null;
        fitmentDeviceLocation: string | null;
        fitmentSupplyLocation: string | null;
        fitmentSupplyType: string | null;
        device: DeviceEntity | null;
        vehicle: VehicleEntity | null;
    }

    export class DriverDTO {
        id: number;
        firstName: string;
        lastName: string;
        phoneNumber: string | null;
    }

    export class TeamCategoryDTO {
        id: number;
        label: string;
    }

    export class TeamDTO {
        id: number;
        label: string;
        path: string | null;
        parentTeam: TeamDTO | null;
        category: TeamCategoryDTO;
    }

    export class TeamSummaryDTO {
        id: number;
        label: string;
        path: string | null;
        category: TeamCategoryDTO;
    }

    export class VehicleCategoryDTO {
        id: number;
        label: string;
    }

    export class VehicleDTO {
        id: string;
        energy: string | null;
        engine: string | null;
        externalId: string | null;
        licenseplate: string;
        validated: boolean;
        category: VehicleCategoryDTO;
        drivers: { [index: string]: DriverDTO } | null;
        devices: { [index: string]: DeviceDTO } | null;
        teams: { [index: string]: TeamDTO } | null;
    }

    export class VehicleSummaryDTO {
        id: string;
        licenseplate: string;
        category: VehicleCategoryDTO;
        driver: DriverDTO | null;
        device: DeviceSummaryDTO;
        team: TeamSummaryDTO;
    }

    export class PointOfInterestCategoryEntity implements PanacheEntityBase {
        id: number;
        label: string;
        color: string;
    }

    export interface PanacheEntityBase {
    }

    export class DeviceVehicleInstallId implements Serializable {
        vehicleId: string;
        deviceId: number;
        startDate: Date;
    }

    export class DeviceEntity implements PanacheEntityBase {
        id: number;
        imei: string;
        label: string | null;
        manufacturer: string | null;
        model: string | null;
        serialNumber: string | null;
        simNumber: string | null;
        gatewayEnabled: boolean | null;
        lastDataDate: Date | null;
        comment: string | null;
        lastCommunicationDate: Date | null;
        active: boolean | null;
        coordinate: custom.GeoPoint;
    }

    export class VehicleEntity implements PanacheEntityBase {
        id: string | null;
        energy: string | null;
        engine: string | null;
        externalId: string | null;
        licenseplate: string;
        validated: boolean;
        vehicleDevices: DeviceVehicleInstallEntity[];
        vehicleDrivers: VehicleDriverEntity[];
        vehicleTeams: VehicleTeamEntity[];
        category: VehicleCategoryEntity | null;
    }

    export interface Serializable {
    }

    export class DeviceVehicleInstallEntity implements PanacheEntityBase {
        id: DeviceVehicleInstallId;
        endDate: Date;
        fitmentOdometer: number | null;
        fitmentOperator: string | null;
        fitmentDeviceLocation: string | null;
        fitmentSupplyLocation: string | null;
        fitmentSupplyType: string | null;
        vehicle: VehicleEntity | null;
        device: DeviceEntity | null;
    }

    export class VehicleDriverEntity implements PanacheEntityBase {
        id: VehicleDriverId;
        endDate: Date;
        vehicle: VehicleEntity | null;
        driver: DriverEntity | null;
    }

    export class VehicleTeamEntity implements PanacheEntityBase {
        id: VehicleTeamId;
        endDate: Date;
        vehicle: VehicleEntity | null;
        team: TeamEntity | null;
    }

    export class VehicleCategoryEntity implements PanacheEntityBase {
        id: number | null;
        label: string;
    }

    export class VehicleDriverId implements Serializable {
        vehicleId: string;
        driverId: number;
        startDate: Date;
    }

    export class DriverEntity implements PanacheEntityBase {
        id: number;
        firstName: string;
        lastName: string;
        phoneNumber: string | null;
        vehicleDrivers: VehicleDriverEntity[];
    }

    export class VehicleTeamId implements Serializable {
        vehicleId: string;
        teamId: number;
        startDate: Date;
    }

    export class TeamEntity implements Serializable, PanacheEntityBase {
        id: number;
        label: string;
        path: string | null;
        parentTeam: TeamEntity | null;
        category: TeamCategoryEntity | null;
        vehicleTeams: VehicleTeamEntity[];
    }

    export class TeamCategoryEntity implements PanacheEntityBase {
        id: number | null;
        label: string;
    }

}
