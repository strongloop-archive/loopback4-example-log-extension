// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  get,
  param,
  FindRoute,
  ParseParams,
  InvokeMethod,
  Send,
  Reject,
  RestBindings,
  SequenceHandler,
  ParsedRequest,
  ServerResponse,
  RestComponent,
  RestServer,
} from '@loopback/rest';
import {
  LogComponent,
  log,
  LogBindings,
  LogFn,
  LogLevel,
  LogLevelMixin,
} from './src';
import {inject} from '@loopback/context';
import {Application} from '@loopback/core';

const restSequenceActions = RestBindings.SequenceActions;

class MyController {
  @get('/')
  @log(LogLevel.INFO)
  hello() {
    return 'Hi anonymous';
  }

  @get('/test')
  @param.query.string('name')
  @log(LogLevel.WARN)
  helloName(name: string) {
    return {name: name, msg: `Hi ${name}`};
  }
}

class LogSequence implements SequenceHandler {
  constructor(
    @inject(restSequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(restSequenceActions.PARSE_PARAMS)
    protected parseParams: ParseParams,
    @inject(restSequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(restSequenceActions.SEND) protected send: Send,
    @inject(restSequenceActions.REJECT) protected reject: Reject,
    // We get the logger injected by the LogProvider here
    @inject(LogBindings.LOG_ACTION) protected logger: LogFn,
  ) {}

  async handle(req: ParsedRequest, res: ServerResponse) {
    // We define these variable outside so they can be accessed by logger.
    let args: any = [];
    let result: any;
    let route: any;

    try {
      route = this.findRoute(req);
      args = await this.parseParams(req, route);
      result = await this.invoke(route, args);
      this.send(res, result);
    } catch (err) {
      result = err;
      this.reject(res, req, err);
    }

    // We call the logger function given to us by LogProvider
    this.logger(req.url, result);
  }
}

class MyApp extends LogLevelMixin(Application) {
  private _startTime: Date;

  constructor() {
    super({
      components: [RestComponent],
      rest: {
        port: 3000,
      },
    });
    const app = this;
    app.bind('http.port').to(3000);
    app.controller(MyController);
    app.component(LogComponent);
    app.logLevel(LogLevel.INFO);
  }

  async start() {
    this._startTime = new Date();
    const rest = await this.getServer(RestServer);
    rest.sequence(LogSequence);
    return super.start();
  }

  async info() {
    const port: Number = await this.get('http.port');

    return {
      uptime: Date.now() - this._startTime.getTime(),
      url: 'http://127.0.0.1:' + port,
    };
  }
}

async function main(): Promise<void> {
  const app = new MyApp();
  await app.start();
  console.log('Application Info:', await app.info());
}

main().catch(err => {
  console.log('Cannot start the app.', err);
  process.exit(1);
});
