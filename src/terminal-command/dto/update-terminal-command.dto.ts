import { PartialType } from '@nestjs/swagger';
import { CreateTerminalCommandDto } from './create-terminal-command.dto';

export class UpdateTerminalCommandDto extends PartialType(
  CreateTerminalCommandDto,
) {}
