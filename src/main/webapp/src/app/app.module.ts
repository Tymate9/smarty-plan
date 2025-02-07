import {ConfigService} from "./core/config/config.service";
import {firstValueFrom} from "rxjs";

// Définition de loadConfigFactory
export function loadConfigFactory(configService: ConfigService) {
  return () => firstValueFrom(configService.loadConfig());
}


