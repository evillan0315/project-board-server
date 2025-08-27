import { OutputFormat, ResponseType, MarkdownConvertRequest } from '@/types/resume';

const API_BASE_URL = '/api/utils';

const endpoints = {
  HTML: 'to-html',
  DOCX: 'markdown-to-docx',
  DOCX_FROM_HTML: 'html-to-docx',
  PLAIN_TEXT: 'markdown-to-plain-text'
}

