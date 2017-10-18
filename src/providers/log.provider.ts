// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {inject, Provider, Constructor} from '@loopback/context';
import {CoreBindings} from '@loopback/core';
import {getLogMetadata} from '../decorators/log.decorator';
import {LogBindings, LogLevel} from '../keys';
import {LogFn, LogMetadata} from '../types';

export class LogProvider implements Provider<LogFn> {
  constructor(
    @inject(CoreBindings.CONTROLLER_CLASS)
    private readonly controllerClass: Constructor<{}>,
    @inject(CoreBindings.CONTROLLER_METHOD_NAME)
    private readonly methodName: string,
    @inject(LogBindings.LOG_LEVEL) private readonly logLevel: number,
  ) {}

  value(): LogFn {
    // tslint:disable-next-line:no-any
    return async (url: string, result: any) => {
      const metadata: LogMetadata = getLogMetadata(
        this.controllerClass,
        this.methodName,
      );

      if (metadata.level >= this.logLevel && this.logLevel !== LogLevel.OFF) {
        const diff = process.hrtime(metadata.startTime);
        const timeInMs =
          Math.round((diff[0] * 1000 + diff[1] * 1e-6) * 100) / 100;

        let log = timeInMs + 'ms: ' + url + ' : ' + this.controllerClass.name;
        log += ' > ' + this.methodName + '(';
        log += metadata.args.join(',') + ') => ';

        if (typeof result === 'object') log += JSON.stringify(result);
        else log += result;

        switch (metadata.level) {
          case LogLevel.DEBUG:
            console.log(`\x1b[37m DEBUG: ${log} \x1b[0m`);
            break;
          case LogLevel.INFO:
            console.log(`\x1b[32m INFO: ${log} \x1b[0m`);
            break;
          case LogLevel.WARN:
            console.log(`\x1b[33m WARN: ${log} \x1b[0m`);
            break;
          case LogLevel.ERROR:
            console.log(`\x1b[31m ERROR: ${log} \x1b[0m`);
            break;
        }
      }
    };
  }
}
