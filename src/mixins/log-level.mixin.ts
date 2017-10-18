// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// tslint:disable:no-any

import {Constructor} from '@loopback/context';
import {LogBindings} from '../keys';

/**
* A mixin class for Application that creates a .logger()
* function to register a Logger automatically. Also overrides
* component function to allow it to register Logger's automatically.
*
* ```ts
*
* class MyApplication extends LoggerMixin(Application) {}
* ```
*/
export function LogLevelMixin<T extends Constructor<any>>(superClass: T) {
  return class extends superClass {
    // A mixin class has to take in a type any[] argument!
    // tslint:disable-next-line:no-any
    constructor(...args: any[]) {
      super(...args);
      if (!this.options) this.options = {};

      if (this.options.logLevel) {
        this.logLevel(this.options.logLevel);
      }
    }

    /**
    * Set minimum logLevel to be displayed.
    *
    * @param level The log level to set for @log decorator
    *
    * ```ts
    * app.logLevel(LogLevel.INFO);
    * ```
    */
    logLevel(level: number) {
      this.bind(LogBindings.LOG_LEVEL).to(level);
    }
  };
}
