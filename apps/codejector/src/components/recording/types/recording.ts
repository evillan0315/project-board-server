export interface IRecorderSettings {
  namePrefix: string;
  screenResolution: string;
  screenFramerate: number;
  cameraResolution: string;
  cameraFramerate: number;
  cameraVideoDevice: string;
  cameraAudioDevice: string;
}

export type RecordingType = 'screenRecord' | 'screenShot' | 'cameraRecord';

export interface RecordingItem {
  id: string;
  name: string;
  createdAt: string;
  sizeBytes: number;
  type: RecordingType; // Use the specific RecordingType union
  status: string;
  path: string;
  createdById: string;
  data: {
    duration?: number;
    fileSize?: number;
    animatedGif?: string;
    [key: string]: any;
  };
}

export type SortOrder = 'asc' | 'desc';
export type SortField = 'name' | 'createdAt' | 'type' | 'sizeBytes';

export interface PaginationRecordingQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  type?: string; // This can remain 'string' for API queries if the backend is flexible
  pageSize?: number;
}

export interface PaginationRecordingResultDto {
  items: RecordingResultDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface RecordingStartResponse {
  id: string;
  path: string;
}
export interface RecordingStopResponse extends RecordingStartResponse {
  status: string;
}
export interface RecordingStatusDto {
  id: string;
  recording: boolean;
  file: string | null;
  startedAt: string | null;
}
export interface RecordingResultDto extends RecordingStartResponse {
  type: RecordingType; // Use the specific RecordingType union
  pid: string;
  status: string;
  data: RecordingDataDto;
  createdAt: string;
  createdById: string;
}

export interface RecordingDataDto {
  duration?: number;
  fileSize?: number;
  startedAt?: string;
  stoppedAt?: string;
  capturedAt?: string;
  animatedGif?: string;
}
export interface TranscodeToGifDto {
  inputFilename: string;
  fps?: number;
  width?: number;
  loop?: number;
}
export interface TranscodeToGifResult {
  message: string;
  outputFilename: string;
  fullPath: string;
}

export interface StartCameraRecordingDto {
  audioDevice?: string;
  cameraDevice?: string;
  resolution?: string;
  framerate?: number;
  duration?: number;
  name?: string;
}

export interface CameraRecordingResponseDto {
  id: string;
  message: string;
  path: string;
  pid?: string;
}

export interface UpdateRecordingDto {
  name?: string;
  type?: RecordingType; // Use the specific RecordingType union
  data?: any;
}
