// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {inject, Provider, Constructor, Getter} from '@loopback/context';
import {CoreBindings} from '@loopback/core';
import {OperationArgs, ParsedRequest} from '@loopback/rest';
import {getLogMetadata} from '../decorators/log.decorator';
import {EXAMPLE_LOG_BINDINGS, LOG_LEVEL} from '../keys';
import {LogFn, Time, TimerFn} from '../types';

export class LogActionProvider implements Provider<LogFn> {
  constructor(
    @inject.getter(CoreBindings.CONTROLLER_CLASS)
    private readonly getController: Getter<Constructor<{}>>,
    @inject.getter(CoreBindings.CONTROLLER_METHOD_NAME)
    private readonly getMethod: Getter<string>,
    @inject(EXAMPLE_LOG_BINDINGS.APP_LEVEL) private readonly logLevel: number,
    @inject(EXAMPLE_LOG_BINDINGS.TIMER) public timer: TimerFn,
  ) {}

  value() {
    const fn = <LogFn>(async (
      req: ParsedRequest,
      args: OperationArgs,
      // tslint:disable-next-line:no-any
      result: any,
      start?: [number, number],
    ) => {
      const controllerClass = await this.getController();
      const methodName: string = await this.getMethod();

      const level: number = getLogMetadata(controllerClass, methodName);

      if (
        this.logLevel !== LOG_LEVEL.OFF &&
        level >= this.logLevel &&
        level !== LOG_LEVEL.OFF
      ) {
        if (!args) args = [];
        let log = `${req.url} :: ${controllerClass.name}.`;
        log += `${methodName}(${args.join(', ')}) => `;

        if (typeof result === 'object') log += JSON.stringify(result);
        else log += result;

        if (start) {
          const time = this.timer(start);
          log = `${time}ms: ${log}`;
        }

        switch (level) {
          case LOG_LEVEL.DEBUG:
            console.log(`\x1b[37m DEBUG: ${log} \x1b[0m`);
            break;
          case LOG_LEVEL.INFO:
            console.log(`\x1b[32m INFO: ${log} \x1b[0m`);
            break;
          case LOG_LEVEL.WARN:
            console.log(`\x1b[33m WARN: ${log} \x1b[0m`);
            break;
          case LOG_LEVEL.ERROR:
            console.log(`\x1b[31m ERROR: ${log} \x1b[0m`);
            break;
        }
      }
    });

    fn.startTimer = () => {
      return <[number, number]>this.timer();
    };

    return fn;
  }
}
