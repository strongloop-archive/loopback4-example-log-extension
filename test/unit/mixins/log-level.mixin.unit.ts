// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: loopback4-example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {Application} from '@loopback/core';
import {LogLevelMixin, LogLevel, LogBindings} from '../../..';

describe('LogLevelMixin (unit)', () => {
  it('mixed class has .logLevel()', () => {
    const myApp = new AppWithLogLevel();
    expect(typeof myApp.logLevel).to.be.eql('function');
  });

  it('binds LogLevel from constructor', () => {
    const myApp = new AppWithLogLevel({
      logLevel: LogLevel.ERROR,
    });

    expectLogLevelToBeBound(myApp);
  });

  it('bind logLevel from app.logLevel()', () => {
    const myApp = new AppWithLogLevel();
    myApp.logLevel(LogLevel.ERROR);
    expectLogLevelToBeBound(myApp);
  });

  class AppWithLogLevel extends LogLevelMixin(Application) {}

  function expectLogLevelToBeBound(myApp: Application) {
    const logLevel = myApp.getSync(LogBindings.LOG_LEVEL);
    expect(logLevel).to.be.eql(LogLevel.ERROR);
  }
});
