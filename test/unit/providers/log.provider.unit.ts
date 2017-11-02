// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {sinon} from '@loopback/testlab';
import {ParsedRequest} from '@loopback/rest';
import {Constructor, Reflector} from '@loopback/context';
import {
  LogProvider,
  LogFn,
  Time,
  log,
  EXAMPLE_LOG_BINDINGS,
  LOG_LEVEL,
} from '../../..';

describe('LogProvider (unit)', () => {
  let spy: sinon.SinonSpy;
  let logger: LogFn;
  const req = <ParsedRequest>{url: '/test'};

  beforeEach(createConsoleSpy);
  beforeEach(getLogger);

  afterEach(restoreConsoleSpy);

  it('logs a value without a start time', () => {
    const match =
      '\x1b[31m ERROR: /test :: TestClass.test() => test message \x1b[0m';

    logger(req, [], 'test message');
    sinon.assert.calledWith(spy, match);
  });

  it('logs a value with a start time', () => {
    const match =
      '\x1b[31m ERROR: 100.02ms: /test :: TestClass.test() => test message \x1b[0m';
    const startTime = logger.startTimer();

    logger(req, [], 'test message', startTime);
    sinon.assert.calledWith(spy, match);
  });

  it('logs a value with args present', () => {
    const match =
      '\x1b[31m ERROR: /test :: TestClass.test(test, message) => test message \x1b[0m';

    logger(req, ['test', 'message'], 'test message');
    sinon.assert.calledWith(spy, match);
  });

  function getLogger() {
    class TestClass {
      @log(LOG_LEVEL.ERROR)
      test() {}
    }

    Reflector.defineMetadata(
      EXAMPLE_LOG_BINDINGS.METADATA,
      LOG_LEVEL.ERROR,
      TestClass,
      'test',
    );

    logger = new LogProvider(TestClass, 'test', LOG_LEVEL.WARN, timer).value();
  }

  function createConsoleSpy() {
    spy = sinon.spy(console, 'log');
  }

  function restoreConsoleSpy() {
    spy.restore();
  }

  function timer(startTime?: [number, number]): Time {
    if (!startTime) return [2, 2];
    return 100.02;
  }
});
