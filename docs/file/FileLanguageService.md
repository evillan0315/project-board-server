## FileLanguageService

`FileLanguageService` is responsible for identifying the programming language of a file and suggesting an appropriate Prettier parser based on its file extension or MIME type. This is crucial for enabling features like syntax highlighting, code formatting, and intelligent processing of file contents.

### Dependencies

- `ConfigService`: To retrieve language mappings from environment variables.
- `UtilsService`: To parse environment variables that define the language maps.
- `prettier`: Although not directly used for formatting within this service, it provides the `BuiltInParserName` type, indicating the kind of parser expected.

### Configuration

This service relies on environment variables for its mappings, which are parsed by `UtilsService.parseEnvMap()`:

- `EXTENSION_LANGUAGE_MAP`: A mapping from file extensions (e.g., `.ts`, `.js`, `.md`) to their corresponding language names (e.g., `typescript`, `javascript`, `markdown`).
- `MIME_LANGUAGE_MAP`: A mapping from MIME types (e.g., `text/typescript`, `application/json`) to language names.
- `PARSER_LANGUAGE_MAP`: A mapping from language names to Prettier's built-in parser names (e.g., `typescript` to `typescript`, `json` to `json`).

### Methods

#### `getLanguageByExtension(ext: string): string | undefined`

Retrieves the language name associated with a given file extension.

- **Parameters:**
  - `ext`: `string` - The file extension (e.g., `'.ts'`, `'.json'`).
- **Returns:** `string` (e.g., `'typescript'`, `'json'`) or `undefined` if no mapping is found.

#### `getLanguageByMime(mime: string): string | undefined`

Retrieves the language name associated with a given MIME type.

- **Parameters:**
  - `mime`: `string` - The MIME type (e.g., `'text/typescript'`, `'application/json'`).
- **Returns:** `string` or `undefined` if no mapping is found.

#### `getPrettierParser(lang: string): prettier.BuiltInParserName | string | undefined`

Retrieves the Prettier parser name (or a custom parser name) for a given language.

- **Parameters:**
  - `lang`: `string` - The language name (e.g., `'typescript'`, `'html'`).
- **Returns:** `prettier.BuiltInParserName | string` (e.g., `'typescript'`, `'html'`) or `undefined` if no mapping is found.
