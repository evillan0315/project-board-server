import { ApiProperty } from '@nestjs/swagger';

/**
 * Defines the desired output format from the LLM.
 */
export enum LlmOutputFormat {
  JSON = 'json',
  YAML = 'yaml',
  MARKDOWN = 'markdown',
  TEXT = 'text',
}

export const LLM_OUTPUT_FORMAT_DESCRIPTION = `
Defines the desired output format from the LLM. If 'json' or 'yaml', the LLM will be instructed to adhere to the LlmOutputDto structure. If 'markdown' or 'text', the raw LLM response will be returned wrapped in a default LlmOutputDto with a single 'analyze' change.

- \`json\`: The LLM will respond strictly in JSON format, adhering to the \`LlmOutputDto\` schema provided in \`expectedOutputFormat\`.
- \`yaml\`: The LLM will respond strictly in YAML format, adhering to the \`LlmOutputDto\` structure.
- \`markdown\`: The LLM will respond strictly in Markdown format. The raw Markdown will be returned as the content of a single \`ANALYZE\` file change.
- \`text\`: The LLM will respond strictly in plain text. The raw text will be returned as the content of a single \`ANALYZE\` file change.
`;
