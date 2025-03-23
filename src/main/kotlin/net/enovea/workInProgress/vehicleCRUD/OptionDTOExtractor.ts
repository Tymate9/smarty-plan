import {dto} from "../../../../../webapp/src/habarta/dto";
import TeamDTO = dto.TeamDTO;
import DriverDTO = dto.DriverDTO;

export interface OptionExtractor<T> {
    getId(option: T): any;
    getLabel(option: T): string;
}

export const teamOptionExtractor: OptionExtractor<TeamDTO> = {
    getId: (team: TeamDTO) => team.id,
    getLabel: (team: TeamDTO) => team.label
};

export const driverOptionExtractor: OptionExtractor<DriverDTO> = {
    getId: (driver: DriverDTO) => driver.id,
    getLabel: (driver: DriverDTO) => driver.firstName + ' ' + driver.lastName
};
