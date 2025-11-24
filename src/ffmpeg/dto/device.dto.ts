import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray } from 'class-validator';

export enum DeviceType {
  AUDIO_INPUT = 'audioinput',
  VIDEO_INPUT = 'videoinput',
}

export class DeviceDto {
  @ApiProperty({
    description:
      'Unique identifier for the device (e.g., /dev/video0, default, Microphone)',
  })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Human-readable name of the device' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: DeviceType,
    description: 'Type of the device (audioinput or videoinput)',
  })
  @IsEnum(DeviceType)
  type: DeviceType;
}

export class DevicesListDto {
  @ApiProperty({
    type: [DeviceDto],
    description: 'List of available audio input devices (microphones)',
  })
  @IsArray()
  audioInputDevices: DeviceDto[];

  @ApiProperty({
    type: [DeviceDto],
    description: 'List of available video input devices (cameras)',
  })
  @IsArray()
  videoInputDevices: DeviceDto[];
}
