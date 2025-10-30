import { ConfigService } from './config.service';

const configService = new ConfigService();

export const loadConfig = () => configService.getVariables();

export { ConfigService };
