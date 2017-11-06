# loopback4-example-log-extension
An example repo showing how to write a complex log extension

## Overview

This repository shows you how to use [loopback4-extension-starter]() to write a complex logging extension that requires a [Component](), [Decorator](), and a [Mixin]().

To use the extension, the user would load the component to get access to a `LogFn` that can be used in a sequence to log information. A Mixin allows the user to set the application wide logLevel. Only Controller methods configured at or above the logLevel will be logged. 

Possible levels are: DEBUG < INFO < WARN < ERROR < OFF

*Possible levels are represented as numbers but users can use `LOG_LEVEL.${level}` to specify the value instead of using numbers.*

A decorator is provided to allow a user to provide metadata for Controller methods by using it to set the minimum logLevel the method should be logged at.

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

We'll start by cloning [loopback4-extension-starter]() and updating files headers to be `loopback4-example-log-extension` and `package.json`.

We'll be keeping all the top level files but modify the `src` directory and `test` directory as follows.

### `/src/index.ts`

We'll update the exports accordingly here.

### `/src/keys.ts`

We'll start by defining new `Binding` values as well as exporting an `enum` for user's to use for setting logLevel. The file will look as follows: 

```ts
export namespace EXAMPLE_LOG_BINDINGS {
  export const METADATA = 'example.log.metadata';
  export const APP_LEVEL = 'example.log.level';
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

We'll be keeping this file the same but updating the `Bindings` according to the values we declared in `/src/keys.ts`. This is where we export our providers so they can be automatically be bound to the appropriate keys. The final version of this file will look as follows:

```ts
import {EXAMPLE_LOG_BINDINGS} from './keys';
import {Component, ProviderMap} from '@loopback/core';
import {TimerProvider, LogActionProvider, LogLevelProvider} from './';

export class LogComponent implements Component {
  providers?: ProviderMap = {
    [EXAMPLE_LOG_BINDINGS.TIMER]: TimerProvider,
    [EXAMPLE_LOG_BINDINGS.LOG_ACTION]: LogActionProvider,
    [EXAMPLE_LOG_BINDINGS.APP_LEVEL]: LogLevelProvider,
  };
}
```

### `/src/types.ts`

We'll be updating 

### Decorator

We'll start by writing our decorator. It must set the metadata for a decorator controller method to the numeric value given (or set a default). The decorator file is also where we'll create a method to allow us to retrieve the metadata. We'll be using `Reflector` from `@loopback/context` to store and retrieve metadata for controller methods. The implementation will be as follows:

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
A user can set their app wide log level (the level at which decorated method will be logged) by binding the level value to `example.log.level`. To make it easier for the user to set the level, we'll be creating a mixin that will allow the user to configure the level in an easier manner. The mixin will allow the user to provide the setting via constructor or using the `app.logLevel(level:number)`. The implementation will look as follows:

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
      this.bind(EXAMPLE_LOG_BINDINGS.APP_LEVEL).to(level);
    }
  };
}
```

### Providers
A Provider is a class that returns a `value()` function that can be invoked by LoopBack 4. Since we're writing a log extension, we'll keep the `log.provider.ts` that we got from `loopback4-extension-starter` but modify it to be more complex. We'll also be keeping the `timer.provider.ts` as is. But first let's write the simplest possible provider that sets the default `example.log.level` value (if a user doesn't set one). It will look as follows:

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

As we won't be making changes to `timer.provider.ts`, we can now shift our focus to `log-action.provider.ts`. We'll update it to retrieve the metadata for the request context (based on the current controller and method). This will require us to inject the current controller and method from the current request context. Since bindings are usually resolved at run time and every request has a unique context, we must use `@inject.getter` which returns a function that can resolve binding dynamically. We can then call this function to get the binding values from the request context instead of the binding being resolved at run time (technically it's still resolved at run time but we just get a function to call and not the actual value). 

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
    @inject(EXAMPLE_LOG_BINDINGS.APP_LEVEL) private readonly logLevel: number,
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

We make sure all our exports are correct in `index.ts` and we're done writing our Log Extension. Lastly we want to write some tests to make sure the behavior we've implemented is correct and modifications in the future don't break the expected behaviour (unless it's intentional in which case test cases should be updates as well). You can have a look at the test folder to see the variety of tests we wrote. There are unit tests to test functionality of individual functions as well as an extension acceptance test which tests the entire extension as a whole (everything working together). 

## License

MIT License
