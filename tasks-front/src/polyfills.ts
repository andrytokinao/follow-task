/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 * 1. browser polyfills
 * 2. application imports
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/**
 * By default, zone.js will patch many browser APIs that may or may not be important to you.
 * However, you can disable some APIs that you are not using on your application.
 * Zone.js has default list of APIs that it patches. If you need to disable some APIs,
 * you can update the list below.
 *
 * The following flags can be used to disable APIs that may have impact on application performance.
 */
// (window as any).__Zone_disable_requestAnimationFrame = true; // disable patch requestAnimationFrame
// (window as any).__Zone_disable_on_property = true; // disable patch onProperty such as onclick
// (window as any).__Zone_disable_timer = true; // disable patch timer such as setTimeout

/**
 * Need to import 'zone.js/dist/zone' before any other imports.
 */
import 'zone.js'; // Included with Angular CLI.

/***************************************************************************************************
 * APPLICATION IMPORTS
 */

/**
 * If the browsers you are targeting do not support requestAnimationFrame, you need to
 * include a polyfill.
 */
// import 'requestAnimationFrame';

/**
 * in IE/Edge developer tools, the addEventListener will also be wrapped by zone.js, which means
 * that addEventListener will also be invoked when the application runs. If you want to use the
 * original addEventListener, you can disable the patch by uncommenting the following line.
 */
// (window as any).__Zone_disable_addEventListener = true;

/* Assign the global variable */
(window as any).global = window;
console.log('Polyfills loaded');
(window as any).global = window;
console.log('Global polyfill applied');
