/**
 * Represents the input DTO for JSON validation and repair requests.
 */
export interface JsonInputDto {
  json: string;
  schema?: Record<string, any> | string;
}

/**
 * Represents the output DTO for JSON validation and repair responses.
 */
export interface JsonOutputDto {
  valid: boolean;
  errors?: (string | Record<string, any>)[];
  repairedJson?: string;
}
