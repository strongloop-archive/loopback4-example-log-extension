// Copyright (c) IBM Corp. 2013,2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {getLogMetadata, LogLevel, log, LogMetadata} from '../../..';

describe('@log (unit)', () => {
  it('can set log level for method without params to given log level', () => {
    class TestClass {
      @log(LogLevel.ERROR)
      hello() {}
    }

    const test = new TestClass();
    test.hello();
    const metadata = getLogMetadata(TestClass, 'hello');

    checkMetadata(metadata, LogLevel.ERROR, []);
  });

  it('can set log level for method with params to give log level', () => {
    class TestClass {
      @log(LogLevel.ERROR)
      hello(name: string) {}
    }

    const test = new TestClass();
    test.hello('John Smith');
    const metadata = getLogMetadata(TestClass, 'hello');

    checkMetadata(metadata, LogLevel.ERROR, ['John Smith']);
  });

  it('can set log level for method without params to default log level', () => {
    class TestClass {
      @log()
      hello() {}
    }

    const test = new TestClass();
    test.hello();
    const metadata = getLogMetadata(TestClass, 'hello');

    checkMetadata(metadata, LogLevel.WARN, []);
  });

  it('can set log level for method with params to default log level', () => {
    class TestClass {
      @log()
      hello(name: string) {}
    }

    const test = new TestClass();
    test.hello('John Smith');
    const metadata = getLogMetadata(TestClass, 'hello');

    checkMetadata(metadata, LogLevel.WARN, ['John Smith']);
  });
});

function checkMetadata(metadata: LogMetadata, level: number, args: string[]) {
  expect(metadata).to.containDeep({
    level: level,
    args: args,
  });
  expect(metadata.startTime).to.have.lengthOf(2);
  expect(metadata.startTime[0]).to.be.a.Number();
  expect(metadata.startTime[1]).to.be.a.Number();
}
