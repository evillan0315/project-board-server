// src/config/file.config.ts
export default () => ({
  file: {
    maxSize: parseInt(process.env.FILE_MAX_SIZE || '5242880'), // 5MB default
    allowedMimeTypes: (
      process.env.ALLOWED_MIME_TYPES || 'text/plain,application/json'
    ).split(','),
    allowedExtensions: (process.env.ALLOWED_EXTENSIONS || '.txt,.json').split(
      ',',
    ),
  },
});
