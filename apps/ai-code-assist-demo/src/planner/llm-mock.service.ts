import { Injectable } from '@nestjs/common';
import { PlanDto } from './types';

@Injectable()
export class LlmMockService {
  generatePlan(prompt: string): PlanDto {
    if (prompt.includes('add route')) {
      return {
        title: 'Add /ping route',
        summary: 'Adds ping function to hello.ts',
        changes: [
          {
            filePath: 'fixture-repo/src/hello.ts',
            action: 'modify',
            newContent: `export function hello() {
  return "Hello world";
}

export function ping() {
  return "pong";
}`,
            reason: 'Add ping function'
          }
        ]
      };
    }

    if (prompt.includes('add file')) {
      return {
        title: 'Add readme',
        summary: 'Adds README.md to fixture-repo',
        changes: [
          {
            filePath: 'fixture-repo/README.md',
            action: 'add',
            newContent: '# Fixture Repo\nThis is a demo file.',
            reason: 'Add README'
          }
        ]
      };
    }

    return {
      title: 'No-op',
      summary: 'No changes',
      changes: []
    };
  }
}
