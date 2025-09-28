import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DetectedImportExportStatementDto {
  @ApiProperty({
    enum: ['import', 'export'],
    description: 'Type of the statement (import or export).',
    example: 'import',
  })
  type: 'import' | 'export';

  @ApiProperty({
    description: "The module path or name, e.g., './my-module' or 'react'. 'local' for internal exports.",
    example: './my-module',
  })
  moduleSpecifier: string;

  @ApiPropertyOptional({
    description: "Named bindings, e.g., ['Component', 'useState'] for `{ Component, useState }`.",
    type: [String],
    example: ['useState', 'useEffect'],
  })
  namedBindings?: string[];

  @ApiPropertyOptional({
    description: "Namespace import, e.g., 'React' for `import * as React from 'react'` (the 'React' part).",
    example: 'React',
  })
  namespaceImport?: string;

  @ApiPropertyOptional({
    description: "Default import or export name, e.g., 'MyComponent' for `import MyComponent from './file'` or `export default MyComponent`.",
    example: 'MyComponent',
  })
  defaultImport?: string;

  @ApiProperty({
    description: 'The full raw import/export line from the source code.',
    example: "import { useState } from 'react';",
  })
  rawStatement: string;
}
