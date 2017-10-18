// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {LogLevelProvider, LogLevel} from '../../..';

describe('LogLevelProvider (unit)', () => {
  it('returns the default logLevel value', () => {
    const value = new LogLevelProvider().value();
    expect(value).to.be.eql(LogLevel.WARN);
  });
});
