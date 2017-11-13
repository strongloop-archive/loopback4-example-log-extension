// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Application} from '@loopback/core';
import {
  RestComponent,
  RestServer,
  get,
  param,
  SequenceHandler,
  RestBindings,
  FindRoute,
  ParseParams,
  InvokeMethod,
  Send,
  Reject,
  ParsedRequest,
  ServerResponse,
} from '@loopback/rest';
import {
  LogComponent,
  LogLevelMixin,
  LOG_LEVEL,
  log,
  EXAMPLE_LOG_BINDINGS,
  LogFn,
  Time,
} from '../..';
import {
  sinon,
  SinonSpy,
  Client,
  createClientForHandler,
  expect,
} from '@loopback/testlab';
import {Context, inject} from '@loopback/context';

const SequenceActions = RestBindings.SequenceActions;

describe('log extension acceptance test', () => {
  let app: LogApp;
  let server: RestServer;
  let spy: SinonSpy;

  class LogApp extends LogLevelMixin(Application) {}

  const debugMatch: string =
    '\x1b[37m DEBUG: /debug :: MyController.debug() => debug called \x1b[0m';
  const infoMatch: string =
    '\x1b[32m INFO: /info :: MyController.info() => info called \x1b[0m';
  const warnMatch: string =
    '\x1b[33m WARN: /warn :: MyController.warn() => warn called \x1b[0m';
  const errorMatch: string =
    '\x1b[31m ERROR: /error :: MyController.error() => error called \x1b[0m';
  const nameMatch: string =
    '\x1b[33m WARN: /?name=test :: MyController.hello(test) => hello test \x1b[0m';

  beforeEach(createApp);
  beforeEach(createController);
  beforeEach(createSequence);
  beforeEach(createConsoleSpy);

  afterEach(restoreConsoleSpy);

  it('logs information at DEBUG or higher', async () => {
    setAppLogToDebug();
    const client: Client = createClientForHandler(server.handleHttp);

    await client.get('/nolog').expect(200, 'nolog called');
    expect(spy.called).to.be.False();

    await client.get('/off').expect(200, 'off called');
    expect(spy.called).to.be.False();

    await client.get('/debug').expect(200, 'debug called');
    sinon.assert.calledWith(spy, debugMatch);

    await client.get('/info').expect(200, 'info called');
    sinon.assert.calledWith(spy, infoMatch);

    await client.get('/warn').expect(200, 'warn called');
    sinon.assert.calledWith(spy, warnMatch);

    await client.get('/error').expect(200, 'error called');
    sinon.assert.calledWith(spy, errorMatch);

    await client.get('/?name=test').expect(200, 'hello test');
    sinon.assert.calledWith(spy, nameMatch);
  });

  it('logs information at INFO or higher', async () => {
    setAppLogToInfo();
    const client: Client = createClientForHandler(server.handleHttp);

    await client.get('/nolog').expect(200, 'nolog called');
    expect(spy.called).to.be.False();

    await client.get('/off').expect(200, 'off called');
    expect(spy.called).to.be.False();

    await client.get('/debug').expect(200, 'debug called');
    expect(spy.called).to.be.False();

    await client.get('/info').expect(200, 'info called');
    sinon.assert.calledWith(spy, infoMatch);

    await client.get('/warn').expect(200, 'warn called');
    sinon.assert.calledWith(spy, warnMatch);

    await client.get('/error').expect(200, 'error called');
    sinon.assert.calledWith(spy, errorMatch);

    await client.get('/?name=test').expect(200, 'hello test');
    sinon.assert.calledWith(spy, nameMatch);
  });

  it('logs information at WARN or higher', async () => {
    setAppLogToWarn();
    const client: Client = createClientForHandler(server.handleHttp);

    await client.get('/nolog').expect(200, 'nolog called');
    expect(spy.called).to.be.False();

    await client.get('/off').expect(200, 'off called');
    expect(spy.called).to.be.False();

    await client.get('/debug').expect(200, 'debug called');
    expect(spy.called).to.be.False();

    await client.get('/info').expect(200, 'info called');
    expect(spy.called).to.be.False();

    await client.get('/warn').expect(200, 'warn called');
    sinon.assert.calledWith(spy, warnMatch);

    await client.get('/error').expect(200, 'error called');
    sinon.assert.calledWith(spy, errorMatch);

    await client.get('/?name=test').expect(200, 'hello test');
    sinon.assert.calledWith(spy, nameMatch);
  });

  it('logs information at ERROR', async () => {
    setAppLogToError();
    const client: Client = createClientForHandler(server.handleHttp);

    await client.get('/nolog').expect(200, 'nolog called');
    expect(spy.called).to.be.False();

    await client.get('/off').expect(200, 'off called');
    expect(spy.called).to.be.False();

    await client.get('/debug').expect(200, 'debug called');
    expect(spy.called).to.be.False();

    await client.get('/info').expect(200, 'info called');
    expect(spy.called).to.be.False();

    await client.get('/warn').expect(200, 'warn called');
    expect(spy.called).to.be.False();

    await client.get('/?name=test').expect(200, 'hello test');
    expect(spy.called).to.be.False();

    await client.get('/error').expect(200, 'error called');
    sinon.assert.calledWith(spy, errorMatch);
  });

  it('logs no informtaion when logLevel is set to OFF', async () => {
    setAppLogToOff();
    const client: Client = createClientForHandler(server.handleHttp);

    await client.get('/nolog').expect(200, 'nolog called');
    expect(spy.called).to.be.False();

    await client.get('/off').expect(200, 'off called');
    expect(spy.called).to.be.False();

    await client.get('/debug').expect(200, 'debug called');
    expect(spy.called).to.be.False();

    await client.get('/info').expect(200, 'info called');
    expect(spy.called).to.be.False();

    await client.get('/warn').expect(200, 'warn called');
    expect(spy.called).to.be.False();

    await client.get('/?name=test').expect(200, 'hello test');
    expect(spy.called).to.be.False();

    await client.get('/error').expect(200, 'error called');
    expect(spy.called).to.be.False();
  });

  function createSequence() {
    class LogSequence implements SequenceHandler {
      constructor(
        @inject(RestBindings.Http.CONTEXT) public ctx: Context,
        @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
        @inject(SequenceActions.PARSE_PARAMS)
        protected parseParams: ParseParams,
        @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
        @inject(SequenceActions.SEND) protected send: Send,
        @inject(SequenceActions.REJECT) protected reject: Reject,
        @inject(EXAMPLE_LOG_BINDINGS.LOG_ACTION) protected logger: LogFn,
      ) {}

      async handle(req: ParsedRequest, res: ServerResponse) {
        // tslint:disable-next-line:no-any
        let args: any = [];
        // tslint:disable-next-line:no-any
        let result: any;

        try {
          const route = this.findRoute(req);
          args = await this.parseParams(req, route);
          result = await this.invoke(route, args);
          this.send(res, result);
        } catch (err) {
          this.reject(res, req, err);
          result = err;
        }

        await this.logger(req, args, result);
      }
    }

    server.sequence(LogSequence);
  }

  async function createApp() {
    app = new LogApp({
      components: [RestComponent, LogComponent],
    });

    app.bind(EXAMPLE_LOG_BINDINGS.TIMER).to(timer);
    server = await app.getServer(RestServer);
  }

  function setAppLogToDebug() {
    app.logLevel(LOG_LEVEL.DEBUG);
  }

  function setAppLogToWarn() {
    app.logLevel(LOG_LEVEL.WARN);
  }

  function setAppLogToError() {
    app.logLevel(LOG_LEVEL.ERROR);
  }

  function setAppLogToInfo() {
    app.logLevel(LOG_LEVEL.INFO);
  }

  function setAppLogToOff() {
    app.logLevel(LOG_LEVEL.OFF);
  }

  function createController() {
    class MyController {
      @get('/debug')
      @log(LOG_LEVEL.DEBUG)
      debug() {
        return 'debug called';
      }

      @get('/warn')
      @log(LOG_LEVEL.WARN)
      warn() {
        return 'warn called';
      }

      @get('/info')
      @log(LOG_LEVEL.INFO)
      info() {
        return 'info called';
      }

      @get('/error')
      @log(LOG_LEVEL.ERROR)
      error() {
        return 'error called';
      }

      @get('/off')
      @log(LOG_LEVEL.OFF)
      off() {
        return 'off called';
      }

      @get('/')
      @log()
      hello(@param.query.string('name') name: string) {
        return `hello ${name}`;
      }

      @get('/nolog')
      nolog() {
        return 'nolog called';
      }
    }

    app.controller(MyController);
  }

  function timer(startTime?: [number, number]): Time {
    if (!startTime) return [2, 2];
    return 100.02;
  }

  function createConsoleSpy() {
    spy = sinon.spy(console, 'log');
  }

  function restoreConsoleSpy() {
    spy.restore();
  }
});
