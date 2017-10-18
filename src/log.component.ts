// Copyright (c) IBM Corp. 2013,2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {LogProvider} from './providers/log.provider';
import {LogLevelProvider} from './providers/log-level.provider';
import {LogBindings} from './keys';
import {Component, ProviderMap} from '@loopback/core';

export class LogComponent implements Component {
  providers?: ProviderMap;

  constructor() {
    this.providers = {
      [LogBindings.LOG_ACTION]: LogProvider,
      [LogBindings.LOG_LEVEL]: LogLevelProvider,
    };
  }
}
