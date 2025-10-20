import { registerAs } from '@nestjs/config';
import { ViewConfigType } from './view-config.type';
import { IsString } from 'class-validator';
import validateConfig from 'src/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  ACTIVE_THEME: string;
}

export default registerAs<ViewConfigType>('view', (): ViewConfigType => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    activeTheme: process.env.ACTIVE_THEME || 'default',
  };
});