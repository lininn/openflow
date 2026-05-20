import { Command } from 'commander';
import { initCommand } from './init.js';
import { statusCommand } from './status.js';
import { updateCommand } from './update.js';

export function run(): void {
  const program = new Command();

  program
    .name('openflow')
    .description('OpenSpec + Superpowers workflow orchestrator')
    .version('0.1.9');

  program.addCommand(initCommand);
  program.addCommand(statusCommand);
  program.addCommand(updateCommand);

  program.parse();
}
