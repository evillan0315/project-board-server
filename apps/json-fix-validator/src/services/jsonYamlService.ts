import {
  JsonToYamlDto,
  JsonToYamlResponseDto,
  YamlToJsonDto,
  YamlToJsonResponseDto,
} from '../types/json-yaml';

const BASE_URL = '/api/utils/json-yaml';

export const jsonYamlService = {
  async convertJsonToYaml(
    json: Record<string, unknown>,
  ): Promise<JsonToYamlResponseDto> {
    const response = await fetch(`${BASE_URL}/to-yaml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ json }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to convert JSON to YAML');
    }

    return response.json();
  },

  async convertYamlToJson(yaml: string): Promise<YamlToJsonResponseDto> {
    const response = await fetch(`${BASE_URL}/to-json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ yaml }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to convert YAML to JSON');
    }

    return response.json();
  },
};
