// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {sinon} from '@loopback/testlab';
import {ParsedRequest} from '@loopback/rest';
import {Context} from '@loopback/context';
import {
  LogActionProvider,
  LogFn,
  Time,
  log,
  EXAMPLE_LOG_BINDINGS,
  LOG_LEVEL,
} from '../../..';
import {CoreBindings} from '@loopback/core';

describe('LogActionProvider (unit)', () => {
  let spy: sinon.SinonSpy;
  let logger: LogFn;
  const req = <ParsedRequest>{url: '/test'};

  beforeEach(createConsoleSpy);
  beforeEach(getLogger);

  afterEach(restoreConsoleSpy);

  it('logs a value without a start time', async () => {
    const match =
      '\x1b[31m ERROR: /test :: TestClass.test() => test message \x1b[0m';

    await logger(req, [], 'test message');
    sinon.assert.calledWith(spy, match);
  });

  it('logs a value with a start time', async () => {
    const match =
      '\x1b[31m ERROR: 100.02ms: /test :: TestClass.test() => test message \x1b[0m';
    const startTime = logger.startTimer();

    await logger(req, [], 'test message', startTime);
    sinon.assert.calledWith(spy, match);
  });

  it('logs a value with args present', async () => {
    const match =
      '\x1b[31m ERROR: /test :: TestClass.test(test, message) => test message \x1b[0m';

    await logger(req, ['test', 'message'], 'test message');
    sinon.assert.calledWith(spy, match);
  });

  async function getLogger() {
    class TestClass {
      @log(LOG_LEVEL.ERROR)
      test() {}
    }

    const context: Context = new Context();
    context.bind(CoreBindings.CONTROLLER_CLASS).to(TestClass);
    context.bind(CoreBindings.CONTROLLER_METHOD_NAME).to('test');
    context.bind(EXAMPLE_LOG_BINDINGS.APP_LOG_LEVEL).to(LOG_LEVEL.WARN);
    context.bind(EXAMPLE_LOG_BINDINGS.TIMER).to(timer);
    context.bind(EXAMPLE_LOG_BINDINGS.LOG_ACTION).toProvider(LogActionProvider);
    logger = await context.get(EXAMPLE_LOG_BINDINGS.LOG_ACTION);
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
