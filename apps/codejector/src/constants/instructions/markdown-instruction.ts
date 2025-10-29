/** Default instruction for generating Markdown files. */
export const MARKDOWN_INSTRUCTION = `
Generate valid Markdown content that adheres to GitHub Flavored Markdown (GFM) standards.

Ensure:
- Proper use of headers (H1-H6)
- Bullet points and numbered lists
- Code blocks with language specification
- Bold, italic, and strikethrough text
- Links and images
- Tables where appropriate
- Task lists

Do NOT include any surrounding JSON or other meta-data, only the raw Markdown content.
`;
