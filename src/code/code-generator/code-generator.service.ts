import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { generateResource } from '../../../libs/generator';

@Injectable()
export class CodeGeneratorService {
  private readonly logger = new Logger(CodeGeneratorService.name);

  async generate(modelName: string, outDir = 'src/feature'): Promise<void> {
    const folderName = this.toDashCase(modelName);
    const className = this.capitalize(modelName);
    const featurePath = path.join(outDir, folderName);
    const appModulePath = path.resolve('src/app.module.ts');

    try {
      await generateResource(modelName, path.resolve(process.cwd(), outDir));
      this.logger.log(`✅ Generated resources for model: ${modelName}`);

      this.injectIntoAppModule(className, folderName, appModulePath);
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate resources for model: ${modelName}`,
        error.stack,
      );
      throw error;
    }
  }

  private injectIntoAppModule(
    moduleName: string,
    folderName: string,
    appModulePath: string,
  ): void {
    const moduleImport = `import { ${moduleName}Module } from './feature/${folderName}/${folderName}.module';`;
    const appModuleContent = fs.readFileSync(appModulePath, 'utf8');

    if (appModuleContent.includes(moduleImport)) {
      this.logger.log(`ℹ️ AppModule already includes ${moduleName}Module`);
      return;
    }

    // Inject import statement
    let updated = `${moduleImport}\n${appModuleContent}`;

    // Inject into imports array
    updated = updated.replace(
      /@Module\(\s*{[^}]*imports\s*:\s*\[((.|\s)*?)\]/,
      (match) => {
        return match.replace(
          /\[(.*?)\]/s,
          (innerMatch, importList) =>
            `[${importList.trim().length ? importList.trim() + ', ' : ''}${moduleName}Module]`,
        );
      },
    );

    fs.writeFileSync(appModulePath, updated);
    this.logger.log(`✅ Injected ${moduleName}Module into AppModule`);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private toDashCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
      .toLowerCase();
  }
}
