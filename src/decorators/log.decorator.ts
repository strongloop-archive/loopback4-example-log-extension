// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Reflector, Constructor} from '@loopback/context';
import {LogBindings, LogLevel} from '../keys';
import {LogMetadata} from '../types';

/**
 * Mark a controller method as requiring logging (input, output & timing)
 * if Application LogLevel is set at or greater than Application LogLevel.
 * LogLevel.DEBUG < LogLevel.INFO < LogLevel.WARN < LogLevel.ERROR < LogLevel.OFF
 *
 * @param level The Log Level at or above it should log
 */
export function log(level?: number) {
  return function(
    target: Object,
    methodName: string,
    descriptor: PropertyDescriptor,
  ) {
    return {
      value: function() {
        // If a default log level isn't specified, we default to warn
        if (!level) level = LogLevel.WARN;

        // Take arguments array and change to array
        const args = Array.prototype.slice.call(arguments);

        const metadata: LogMetadata = {
          level: level,
          args: args,
          startTime: process.hrtime(),
        };

        // Here we store the metadata so it can be retrieved by the log action
        Reflector.defineMetadata(
          LogBindings.METADATA,
          metadata,
          target,
          methodName,
        );

        // tslint:disable-next-line
        return descriptor.value.apply(this, arguments);
      },
    };
  };
}

/**
 * Fetch LogMetadata stored by `@log` decorator.
 *
 * @param controllerClass Target controller
 * @param methodName Target method
 */
export function getLogMetadata(
  controllerClass: Constructor<{}>,
  methodName: string,
): LogMetadata {
  return Reflector.getMetadata(
    LogBindings.METADATA,
    controllerClass.prototype,
    methodName,
  );
}
