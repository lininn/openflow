import chalk from 'chalk';

export interface LoggerOptions {
  debug?: boolean;
  json?: boolean;
}

export interface Logger {
  configure(options: LoggerOptions): void;
  debug(msg: string): void;
  info(msg: string): void;
  success(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  step(msg: string): void;
  blank(): void;
}

type Level = 'debug' | 'info' | 'success' | 'warn' | 'error' | 'step';

export function createLogger(options: LoggerOptions = {}): Logger {
  let currentOptions: Required<LoggerOptions> = {
    debug: options.debug ?? false,
    json: options.json ?? false,
  };

  function write(level: Level, msg: string): void {
    if (level === 'debug' && !currentOptions.debug) return;

    if (currentOptions.json) {
      const line = JSON.stringify({ level, message: msg });
      if (level === 'error') {
        console.error(line);
      } else {
        console.log(line);
      }
      return;
    }

    const prefixByLevel: Record<Level, string> = {
      debug: chalk.gray('…'),
      info: chalk.cyan('ℹ'),
      success: chalk.green('✔'),
      warn: chalk.yellow('⚠'),
      error: chalk.red('✖'),
      step: chalk.gray('→'),
    };

    const output = level === 'error' ? console.error : console.log;
    output(prefixByLevel[level], msg);
  }

  return {
    configure(nextOptions: LoggerOptions) {
      currentOptions = { ...currentOptions, ...nextOptions };
    },
    debug: (msg: string) => write('debug', msg),
    info: (msg: string) => write('info', msg),
    success: (msg: string) => write('success', msg),
    warn: (msg: string) => write('warn', msg),
    error: (msg: string) => write('error', msg),
    step: (msg: string) => write('step', msg),
    blank: () => {
      if (!currentOptions.json) console.log();
    },
  };
}

export const logger = createLogger();
