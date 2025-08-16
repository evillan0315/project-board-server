import { PartialType } from '@nestjs/swagger';
import { CreateTerminalSessionDto } from './create-terminal-session.dto';

export class UpdateTerminalSessionDto extends PartialType(CreateTerminalSessionDto) {}

