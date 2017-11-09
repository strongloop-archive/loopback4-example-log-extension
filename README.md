# loopback4-example-log-extension
An example repo showing how to write a complex log extension

## Overview

This repository shows you how to use [loopback4-extension-starter](https://github.com/strongloop/loopback4-extension-starter) to write a complex logging extension that requires a [Component](http://loopback.io/doc/en/lb4/Using-components.html), [Decorator](http://loopback.io/doc/en/lb4/Decorators.html), and a [Mixin](http://loopback.io/doc/en/lb4/Mixin.html).

To use the extension, load the component to get access to a `LogFn` that can be used in a sequence to log information. A Mixin allows you to set the application wide logLevel. Only Controller methods configured at or above the logLevel will be logged. 

Possible levels are: DEBUG < INFO < WARN < ERROR < OFF

*Possible levels are represented as numbers but users can use `LOG_LEVEL.${level}` to specify the value instead of using numbers.*

A decorator enables you to provide metadata for Controller methods to set the minimum logLevel.

### Example Usage
```ts
import {LogLevelMixin, LogComponent, LOG_LEVEL, log} from 'loopback4-example-log-extension';
// Other imports ... 

class LogApp extends LogLevelMixin(Application) {
  constructor() {
    super({
      components: [RestComponent, LogComponent],
      logLevel: LOG_LEVEL.ERROR,
      controllers: [MyController]
    });
  };
}

class MyController {
  @log(LOG_LEVEL.WARN)
  @get('/')
  hello() {
    return 'Hello LoopBack';
  }

  @log(LOG_LEVEL.ERROR)
  @get('/name')
  helloName() {
    return 'Hello Name'
  }
}
```

## Tutorial

Start by cloning [loopback4-extension-starter]() and updating files headers to be `loopback4-example-log-extension` and `package.json`.

Keep all the top level files but modify the `src` directory and `test` directory as follows.

### `/src/index.ts`

Update the exports accordingly here. Typically all files in `/src` are exported. Final version of file should be as follows:

```ts
export * from './decorators/log.decorator';
export * from './mixins/log-level.mixin';
export * from './providers/log-action.provider';
export * from './providers/log-level.provider';
export * from './providers/timer.provider';
export * from './log.component';
export * from './types';
export * from './keys';
```

### `/src/keys.ts`

Define new `Binding` values as well as exporting an `enum` for users to use for setting logLevel. The file will look as follows: 

```ts
export namespace EXAMPLE_LOG_BINDINGS {
  export const METADATA = 'example.log.metadata';
  export const APP_LOG_LEVEL = 'example.log.level';
  export const TIMER = 'example.log.timer';
  export const LOG_ACTION = 'example.log.action';
}

export enum LOG_LEVEL {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  OFF,
}
```

### `/src/log.component.ts`

Keep this file the same but updating the `Bindings` according to the values we declared in `/src/keys.ts`. This is where providers are exported so they can automatically bind to the appropriate keys. The final version of this file will look as follows:

```ts
import {EXAMPLE_LOG_BINDINGS} from './keys';
import {Component, ProviderMap} from '@loopback/core';
import {TimerProvider, LogActionProvider, LogLevelProvider} from './';

export class LogComponent implements Component {
  providers?: ProviderMap = {
    [EXAMPLE_LOG_BINDINGS.TIMER]: TimerProvider,
    [EXAMPLE_LOG_BINDINGS.LOG_ACTION]: LogActionProvider,
    [EXAMPLE_LOG_BINDINGS.APP_LOG_LEVEL]: LogLevelProvider,
  };
}
```

### `/src/types.ts`

Update the types slightly as shown below to make them more robust.

```ts
import {ParsedRequest, OperationArgs} from '@loopback/rest';

export interface LogFn {
  (
    req: ParsedRequest,
    args: OperationArgs,
    // tslint:disable-next-line:no-any
    result: any,
    startTime?: [number, number],
  ): Promise<void>;

  startTimer(): [number, number];
}

export type Time = number | [number, number];
export type TimerFn = (start?: [number, number]) => Time;
```

### Decorator

Lets start by writing a decorator. It must set the metadata for a controller method to the numeric value given (or use a default). A method will also be implemented to retreieve the metadata set by the decorator.`Reflector` from `@loopback/context` will be used to store and retrieve metadata for controller methods. The implementation will be as follows:

```ts
// /src/decprators/log.decorator.ts
import {LOG_LEVEL, EXAMPLE_LOG_BINDINGS} from '../keys';
import {Constructor, Reflector} from '@loopback/context';

// Decorator @log to store the level at which information should be logged
export function log(level?: number) {
  return function(target: Object, methodName: string) {
    if (level === undefined) level = LOG_LEVEL.WARN;

    // Reflector.defineMetadata stores metadata by taking a key,
    // the value to be stored, the class Object (target) and the class method
    // the value is being stored for
    Reflector.defineMetadata(
      EXAMPLE_LOG_BINDINGS.METADATA,
      level,
      target,
      methodName,
    );
  };
}

// Retrieving metadata for a function by passing in the key,
// class constructor, and the method
export function getLogMetadata(
  controllerClass: Constructor<{}>,
  methodName: string,
): number {
  return Reflector.getMetadata(
    EXAMPLE_LOG_BINDINGS.METADATA,
    controllerClass.prototype,
    methodName,
  );
}
```

### Mixin
The user can set their app wide log level (the level at which decorated method will be logged) by binding the level value to `example.log.level`. To make it easier to set the level, we'll create a mixin that will allow the user to configure the level in an easier manner. The mixin will allow the user to provide the setting via constructor or using the `app.logLevel(level:number)`. The implementation will look as follows:

```ts
// /src/mixins/log-level.mixin.ts
import {Constructor} from '@loopback/context';
import {EXAMPLE_LOG_BINDINGS} from '../keys';

export function LogLevelMixin<T extends Constructor<any>>(superClass: T) {
  return class extends superClass {
    // tslint:disable-next-line:no-any
    constructor(...args: any[]) {
      super(...args);
      if (!this.options) this.options = {};

      if (this.options.logLevel) {
        this.logLevel(this.options.logLevel);
      }
    }

    logLevel(level: number) {
      this.bind(EXAMPLE_LOG_BINDINGS.APP_LOG_LEVEL).to(level);
    }
  };
}
```

### Providers
A Provider is a class that returns a `value()` function that can be invoked by LoopBack 4.Keep the `log.provider.ts` from `loopback4-extension-starter` but modify it to be more complex. Keep the `timer.provider.ts` as is. But first write the simplest possible provider that sets the default `example.log.level` value (if a user doesn't set one). It will look as follows:

```ts
// /src/providers/log-level.provider.ts
import {Provider} from '@loopback/context';
import {LOG_LEVEL} from '../keys';

export class LogLevelProvider implements Provider<number> {
  constructor() {}

  value(): number {
    return LOG_LEVEL.WARN;
  }
}
```

Update `log-action.provider.ts` to retrieve the metadata for the request stored by the decorator (based on the current controller and method). Inject the current controller and method from the current request context so metadata can be retrieved. Since bindings are usually resolved at run time and every request has a unique context, use `@inject.getter` which returns a function that can resolve bindings dynamically. Call this function to get the binding values from the request context instead of the binding being resolved at run time (technically it's still resolved at run time but we just get a function to call and not the actual value). 

The updated `log-action.provider.ts` will look as follows:
```ts
import {inject, Provider, Constructor, Getter} from '@loopback/context';
import {CoreBindings} from '@loopback/core';
import {OperationArgs, ParsedRequest} from '@loopback/rest';
import {getLogMetadata} from '../decorators/log.decorator';
import {EXAMPLE_LOG_BINDINGS, LOG_LEVEL} from '../keys';
import {LogFn, Time, TimerFn} from '../types';

export class LogActionProvider implements Provider<LogFn> {
  constructor(
    @inject.getter(CoreBindings.CONTROLLER_CLASS)
    private readonly getController: Getter<Constructor<{}>>,
    @inject.getter(CoreBindings.CONTROLLER_METHOD_NAME)
    private readonly getMethod: Getter<string>,
    @inject(EXAMPLE_LOG_BINDINGS.APP_LOG_LEVEL) private readonly logLevel: number,
    @inject(EXAMPLE_LOG_BINDINGS.TIMER) public timer: TimerFn,
  ) {}

  value() {
    const fn = <LogFn>(async (
      req: ParsedRequest,
      args: OperationArgs,
      // tslint:disable-next-line:no-any
      result: any,
      start?: [number, number],
    ) => {
      const controllerClass = await this.getController();
      const methodName: string = await this.getMethod();

      const level: number = getLogMetadata(controllerClass, methodName);

      if (
        this.logLevel !== LOG_LEVEL.OFF &&
        level >= this.logLevel &&
        level !== LOG_LEVEL.OFF
      ) {
        if (!args) args = [];
        let log = `${req.url} :: ${controllerClass.name}.`;
        log += `${methodName}(${args.join(', ')}) => `;

        if (typeof result === 'object') log += JSON.stringify(result);
        else log += result;

        if (start) {
          const time = this.timer(start);
          log = `${time}ms: ${log}`;
        }

        switch (level) {
          case LOG_LEVEL.DEBUG:
            console.log(`\x1b[37m DEBUG: ${log} \x1b[0m`);
            break;
          case LOG_LEVEL.INFO:
            console.log(`\x1b[32m INFO: ${log} \x1b[0m`);
            break;
          case LOG_LEVEL.WARN:
            console.log(`\x1b[33m WARN: ${log} \x1b[0m`);
            break;
          case LOG_LEVEL.ERROR:
            console.log(`\x1b[31m ERROR: ${log} \x1b[0m`);
            break;
        }
      }
    });

    fn.startTimer = () => {
      return <[number, number]>this.timer();
    };

    return fn;
  }
}
```

## Final Steps

Make sure all exports are correct in `index.ts` and you are done writing the Log Extension. Lastly, best practice is to write some tests to make sure the behavior implemented is correct and modifications in the future don't break the expected behaviour (unless it's intentional in which case test cases should be updates as well). You can have a look at the test folder to see the variety of tests written. There are unit tests to test functionality of individual functions as well as an extension acceptance test which tests the entire extension as a whole (everything working together). 

## License

MIT License
