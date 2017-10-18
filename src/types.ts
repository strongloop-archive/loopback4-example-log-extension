// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/**
 * Log Operation metadata stored via Reflection API
 */
export interface LogMetadata {
  level: number;
  // tslint:disable-next-line:no-any
  args: any[];
  startTime: [number, number];
}

export interface LogFn {
  // tslint:disable-next-line:no-any
  (route: string, result: any): void;
}
