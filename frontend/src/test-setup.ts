/**
 * Test environment setup for Angular 21 (zoneless).
 *
 * No zone.js — the app and tests run fully zoneless with
 * provideZonelessChangeDetection(). TestBed is initialised with
 * the standard browser-dynamic testing module.
 */
import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    teardown: { destroyAfterEach: true },
  },
);
