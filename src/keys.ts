// Copyright (c) IBM Corp. 2013,2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/**
 * Binding keys used by LogOp Component
 */

export namespace LogBindings {
  export const METADATA = 'log.metadata';
  export const LOG_ACTION = 'log.action.logger';
  export const LOG_LEVEL = 'log.level';
}

export namespace LogLevel {
  export const DEBUG = 0;
  export const INFO = 1;
  export const WARN = 2;
  export const ERROR = 3;
  export const OFF = 4;
}
