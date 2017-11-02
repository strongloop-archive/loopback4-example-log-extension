// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// Types and interfaces exposed by the extension go here

import {ParsedRequest, OperationArgs} from '@loopback/rest';

export interface LogFn {
  (
    req: ParsedRequest,
    args: OperationArgs,
    // tslint:disable-next-line:no-any
    result: any,
    startTime?: [number, number],
  ): void;

  startTimer(): [number, number];
}

export type Time = number | [number, number];

export type TimerFn = (start?: [number, number]) => Time;
