import { Command } from 'commander';
import { initCommand } from './init.js';
import { statusCommand } from './status.js';
import { updateCommand } from './update.js';

export function run(): void {
  const program = new Command();

  program
    .name('openflow')
    .description('OpenSpec + Superpowers 工作流协调器')
    .version('0.1.0');

  program.addCommand(initCommand);
  program.addCommand(statusCommand);
  program.addCommand(updateCommand);

  program.parse();
}
