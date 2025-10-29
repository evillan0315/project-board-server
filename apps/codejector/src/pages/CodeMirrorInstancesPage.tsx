import React, { useState } from 'react';
import { Box, Typography, Divider, Paper } from '@mui/material';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import PageLayout from '@/components/layouts/PageLayout';
interface CodeMirrorInstanceProps {
  id: string;
  title: string;
  initialValue: string;
  language: string;
  isDisabled?: boolean;
}
const CodeMirrorInstancesPage: React.FC = () => {
  const [tsCode, setTsCode] = useState(
//     "interface User {\n  id: number;\n  name: string;\n}\n\nconst user: User = {\n  id: 1,\n  name: 'Alice',\n};\n\nfunction greet(u: User): void {\n  console.log(`Hello, ${u.name}!`);\n}\n\ngreet(user);\n",
  );
  const [htmlCode, setHtmlCode] = useState(
//     "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Document</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <h1>Welcome!</h1>\n  <p>This is an example HTML document.</p>\n  <script>console.log('Hello from HTML!');</script>\n</body>\n</html>\n",
  );
  const [cssCode, setCssCode] = useState(
    "body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background-color: #f0f0f0;\n}\n\nh1 {\n  color: #333;\n  text-align: center;\n}\n\np {\n  color: #666;\n  line-height: 1.6;\n}\n",
  );
  const [markdownContent, setMarkdownContent] = useState(
//     "# CodeMirror Examples\n\nThis page demonstrates multiple instances of the CodeMirror editor.\n\n## Features Showcased\n\n*   TypeScript editor\n*   HTML editor\n*   CSS editor\n*   Markdown viewer\n*   JSON editor (read-only)\n\n### Blockquote\n\n> This is a blockquote.\n\n```javascript\nconst hello = 'world';\nconsole.log(hello);\n```\n",
  );
  const [jsonContent, setJsonContent] = useState(
    "{\n  \"name\": \"Codejector Project\",\n  \"version\": \"1.0.0\",\n  \"description\": \"A project to showcase CodeMirror instances.\",\n  \"authors\": [\n    {\n      \"name\": \"Eddie Villanueva\",\n      \"email\": \"evillan0315@gmail.com\"\n    }\n  ],\n  \"dependencies\": {\n    \"react\": \">=18.0.0\",\n    \"@uiw/react-codemirror\": \">=4.0.0\"\n  },\n  \"license\": \"MIT\"\n}\n",
  );
  const editors: CodeMirrorInstanceProps[] = [
    {
      id: 'ts-editor',
      title: 'TypeScript Editor (Editable)',
      initialValue: tsCode,
      language: 'typescript',
    },
    {
      id: 'html-editor',
      title: 'HTML Editor (Editable)',
      initialValue: htmlCode,
      language: 'html',
    },
    {
      id: 'css-editor',
      title: 'CSS Editor (Editable)',
      initialValue: cssCode,
      language: 'css',
    },
    {
      id: 'md-viewer',
      title: 'Markdown Viewer (Editable)',
      initialValue: markdownContent,
      language: 'markdown',
    },
    {
      id: 'json-viewer',
      title: 'JSON Viewer (Read-only)',
      initialValue: jsonContent,
      language: 'json',
      isDisabled: true,
    },
  ];
  const handleEditorChange = (id: string, value: string) => {
    switch (id) {
      case 'ts-editor':
        setTsCode(value);
        break;
      case 'html-editor':
        setHtmlCode(value);
        break;
      case 'css-editor':
        setCssCode(value);
        break;
      case 'md-viewer':
        setMarkdownContent(value);
        break;
      case 'json-viewer':
        setJsonContent(value);
        break;
      default:
        break;
    }
  };
  return (
    <PageLayout>
      <Box className="p-4 flex flex-col gap-6">
        <Typography variant="h4" component="h1" className="mb-4">
          CodeMirror Instances Demo
        </Typography>
        <Typography variant="body1" className="mb-6">
          This page demonstrates various instances of the `CodeMirrorEditor` component,
          each configured for a different language and purpose. Right-click inside any editor
          to see the custom context menu.
        </Typography>
        {editors.map((editorProps) => (
          <Paper key={editorProps.id} elevation={3} className="p-4 flex flex-col gap-2">
            <Typography variant="h6" component="h2" gutterBottom>
              {editorProps.title}
            </Typography>
            <Box className="relative h-72 w-full border border-solid border-gray-300 rounded overflow-hidden">
              <CodeMirrorEditor
                value={editorProps.initialValue}
                onChange={(val) => handleEditorChange(editorProps.id, val)}
                language={editorProps.language}
                isDisabled={editorProps.isDisabled}
                height="100%"
                width="100%"
              />
            </Box>
            {editorProps.isDisabled && (
              <Typography variant="caption" color="textSecondary" className="mt-1">
                This editor is read-only.
              </Typography>
            )}
            <Divider className="my-4" />
          </Paper>
        ))}
      </Box>
    </PageLayout>
  );
};
export default CodeMirrorInstancesPage;
