// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Provider} from '@loopback/context';
import {TimerFn, HighResTime} from '../types';

export class TimerProvider implements Provider<TimerFn> {
  constructor() {}

  value(): TimerFn {
    return (start?: HighResTime): HighResTime => {
      if (!start) return process.hrtime();
      return process.hrtime(start);
    };
  }
}
