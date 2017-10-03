// Copyright IBM Corp. 2013,2017. All Rights Reserved.
// Node module: loopback-next-extension-starter
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Reflector, Constructor} from '@loopback/context';
import {LogBindings, LogLevel} from '../keys';

/**
 * Log Operation metadata stored via Reflection API
 */
export interface LogMetadata {
  level: number;
  args: any[];
  startTime: [number, number];
}

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
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    return {
      value: function(...args: any[]) {
        if (!level) level = LogLevel.WARN;

        const metadata: LogMetadata = {
          level: level,
          args: args,
          startTime: process.hrtime(),
        };

        Reflector.defineMetadata(
          LogBindings.METADATA,
          metadata,
          target,
          propertyKey,
        );

        return descriptor.value.apply(this, args);
      },
    };
  };
}

/**
 * Fetch LogOpMetadata stored by `@log` decorator.
 *
 * @param controllerClass Target controller
 * @param methodName Target method
 */
export function getLogOpMetadata(
  controller: Constructor<{}>,
  method: string,
): LogMetadata {
  return Reflector.getMetadata(
    LogBindings.METADATA,
    controller.prototype,
    method,
  );
}
