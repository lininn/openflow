import { InvalidArgumentError } from 'commander';
import { TOOL_PATHS } from '../core/constants.js';

export function parseToolOption(value: string): string[] {
  const tools = [...new Set(value.split(',').map((tool) => tool.trim()).filter(Boolean))];
  if (tools.length === 0) {
    throw new InvalidArgumentError('Select at least one tool');
  }

  const unsupported = tools.filter((tool) => !Object.hasOwn(TOOL_PATHS, tool));
  if (unsupported.length > 0) {
    throw new InvalidArgumentError(`Unsupported tool: ${unsupported.join(', ')}`);
  }

  return tools;
}
