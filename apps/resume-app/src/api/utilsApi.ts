import { OutputFormat, ResponseType, MarkdownConvertRequest, ExportOptions } from '@/types/resume';
import { saveAs } from 'file-saver'; // Import file-saver
const API_BASE_URL = `${import.meta.env.VITE_FRONTEND_URL}/api/utils`;
interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
// Helper to get authorization headers (replace with actual auth logic if needed)
const getAuthHeaders = () => {
  return {}; // Auth handled by HTTP-only cookies
};
async function handleFileDownload(response: Response, filename: string, contentType: string) {
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    const errorMessage = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'An unknown error occurred';
    throw new Error(`API Error ${errorData.statusCode}: ${errorMessage}`);
  }
  const blob = await response.blob();
  saveAs(blob, filename); // Use file-saver to prompt download
}
export const exportResume = async (options: ExportOptions): Promise<void> => {
  const { content, format, filename = 'document' } = options;
  let endpoint = '';
  let requestBody: { markdown?: string; html?: string } = {};
  let outputFilename = filename;
  let contentType = '';
  let responseType: ResponseType = 'json'; // Default response type
  switch (format) {
    case OutputFormat.HTML:
      endpoint = 'to-html';
      requestBody = { markdown: content };
      outputFilename += '.html';
      contentType = 'text/html';
      responseType = 'text';
      break;
    case OutputFormat.DOCX:
      // Assuming markdown input for DOCX, if HTML input is needed, another endpoint/flow is required.
      endpoint = 'markdown-to-docx';
      requestBody = { content: content }; // MarkdownDto expects 'content'
      outputFilename += '.docx';
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      responseType = 'blob';
      break;
    case OutputFormat.PDF:
      // PDF conversion typically works best from HTML for rich formatting
      endpoint = 'html-to-pdf';
      requestBody = { html: content }; // HtmlDto expects 'html'
      outputFilename += '.pdf';
      contentType = 'application/pdf';
      responseType = 'blob';
      break;
    case OutputFormat.PLAIN_TEXT:
      endpoint = 'markdown-to-plain-text';
      requestBody = { content: content }; // MarkdownDto expects 'content'
      outputFilename += '.txt';
      contentType = 'text/plain';
      responseType = 'text';
      break;
    case OutputFormat.JSON_AST:
      endpoint = 'to-json';
      requestBody = { markdown: content }; // Expects markdown
      outputFilename += '.json';
      contentType = 'application/json';
      responseType = 'json';
      break;
    case OutputFormat.DOCX_FROM_HTML:
        endpoint = 'html-to-docx';
        requestBody = { html: content };
        outputFilename += '.docx';
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        responseType = 'blob';
        break;
    default:
      throw new Error('Unsupported export format.');
  }
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  url.searchParams.append('filename', outputFilename.split('.').slice(0, -1).join('.')); // Send filename without extension as query param
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(requestBody),
  });
  if (responseType === 'blob') {
    await handleFileDownload(response, outputFilename, contentType);
  } else if (responseType === 'text') {
    const text = await response.text();
    if (!response.ok) {
      let errorData: ApiError | undefined;
      try { errorData = JSON.parse(text); } catch {} // Attempt to parse as JSON error
      const errorMessage = errorData?.message ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message) : 'An unknown error occurred';
      throw new Error(`API Error ${response.status}: ${errorMessage}`);
    }
    const blob = new Blob([text], { type: contentType });
    saveAs(blob, outputFilename);
  } else if (responseType === 'json') {
    const json = await response.json();
    if (!response.ok) {
      const errorMessage = Array.isArray(json.message) ? json.message.join(', ') : json.message || 'An unknown error occurred';
      throw new Error(`API Error ${response.status}: ${errorMessage}`);
    }
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: contentType });
    saveAs(blob, outputFilename);
  }
};
