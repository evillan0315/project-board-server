import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { PlanDto } from './types';

@Injectable()
export class LlmService {
  private openaiKey = process.env.OPENAI_API_KEY;

  async generatePlan(prompt: string): Promise<PlanDto> {
    if (this.openaiKey) {
      // Minimal example using OpenAI chat completions REST endpoint.
      // Note: adjust model name and request fields to match your account & model availability.
      const system = `You are an AI Planner. Return ONLY a JSON object matching: { title, summary, changes: [{filePath, action, newContent?, diff?, reason?}] }`;
      const body = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        temperature: 0
      };

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: JSON.stringify(body)
      });
      const j = await resp.json();
      const txt = j?.choices?.[0]?.message?.content ?? j?.choices?.[0]?.text;
      try {
        const parsed = JSON.parse(txt);
        return parsed as PlanDto;
      } catch (e) {
        // If parsing fails, fallback to safe mock plan (so the system still works)
        return this.mockPlan(prompt);
      }
    } else {
      // Local dev fallback
      return this.mockPlan(prompt);
    }
  }

  mockPlan(prompt: string): PlanDto {
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
