export interface JsonToYamlDto {
  json: Record<string, unknown>;
  filename?: string;
}

export interface JsonToYamlResponseDto {
  yaml: string;
  filePath?: string;
}

export interface YamlToJsonDto {
  yaml: string;
  filename?: string;
}

export interface YamlToJsonResponseDto {
  json: Record<string, unknown>;
  filePath?: string;
}
