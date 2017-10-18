// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Provider} from '@loopback/context';
import {LogLevel} from '../keys';

export class LogLevelProvider implements Provider<number> {
  value(): number {
    return LogLevel.WARN;
  }
}
