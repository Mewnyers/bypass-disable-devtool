// ==UserScript==
// @name         bypass-devtool-detection
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Bypasses multiple devtool detection techniques including event prevention
// @author       itzzzme & Assistant
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const logPrefix = '[Bypass Devtool]';
    // --- Set this to true to enable detailed logging ---
    const detailedLogging = false;

    console.log(`${logPrefix} Initializing...`);

    // --- Utility to check if target is an input element ---
    function isInputElement(el) {
        return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.getAttribute?.('contenteditable') === 'true');
    }

    // --- Override Window Dimension Properties ---
    try {
        Object.defineProperty(window, 'outerWidth', {
            get: function() { return window.innerWidth; },
            configurable: true
        });
        Object.defineProperty(window, 'outerHeight', {
            get: function() { return window.innerHeight; },
            configurable: true
        });
        if (detailedLogging) console.log(`${logPrefix} Window dimensions spoofed.`);
    } catch (e) {
        console.error(`${logPrefix} Failed to spoof window dimensions:`, e); // Keep Error Logs
    }

    // --- Block or Modify Timers ---
    // Threshold set to 70ms: Most devtool detection uses intervals/timeouts in the 10-100ms range
    // This avoids blocking legitimate animations (typically 16ms for 60fps) and UI updates
    const intervalThreshold = 70;
    const timeoutThreshold = 70;
    const originalSetInterval = window.setInterval;
    window.setInterval = function(callback, delay, ...args) {
        if (typeof delay === 'number' && delay <= intervalThreshold) {
            if (detailedLogging) console.log(`${logPrefix} Blocked potential detection setInterval (delay: ${delay}ms).`);
            return originalSetInterval(function() {}, delay);
        }
        return originalSetInterval.call(this, callback, delay, ...args);
    };

    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay, ...args) {
        // Avoid blocking our own suspendDisableDevtool timeout
        if (callback === suspendDisableDevtool && delay === 50) {
             return originalSetTimeout.call(this, callback, delay, ...args);
        }
        if (typeof delay === 'number' && delay <= timeoutThreshold) {
            if (detailedLogging) console.log(`${logPrefix} Blocked potential detection setTimeout (delay: ${delay}ms).`);
            return originalSetTimeout(function() {}, delay);
        }
        return originalSetTimeout.call(this, callback, delay, ...args);
    };
    if (detailedLogging) console.log(`${logPrefix} Timers intercepted (Interval <= ${intervalThreshold}ms, Timeout <= ${timeoutThreshold}ms).`);

    // --- Block problematic event listeners ---
    const eventsToBlock = [
        'contextmenu',
        'selectstart',
        'copy',
        'cut',
        'paste',
        'resize'
    ];

    const originalAddEventListener = EventTarget.prototype.addEventListener;

    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (eventsToBlock.includes(type) && !isInputElement(this)) {
            if (detailedLogging) console.log(`${logPrefix} Blocked '${type}' event listener on`, this);
            return;
        }

        if (type === 'keydown') {
            const originalListener = listener;
            const wrappedListener = function(event) {
                const code = event.keyCode || event.which;

                // --- Windows Shortcut Checks ---
                // F12 key
                if (code === 123) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    console.log(`${logPrefix} Blocking F12.`);
                    return false;
                }
                // Ctrl+Shift+I (DevTools)
                else if (event.ctrlKey && event.shiftKey && code === 73) {
                    event.stopImmediatePropagation();
                    console.log(`${logPrefix} Allowing browser default for Ctrl+Shift+I. Blocking site listener.`);
                    return false;
                }
                // Ctrl+Shift+J (DevTools console)
                else if (event.ctrlKey && event.shiftKey && code === 74) {
                    event.stopImmediatePropagation();
                    console.log(`${logPrefix} Allowing browser default for Ctrl+Shift+J. Blocking site listener.`);
                    return false;
                }
                // Ctrl+S (Save)
                else if (event.ctrlKey && code === 83) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    console.log(`${logPrefix} Blocking Ctrl+S.`);
                    return false;
                }
                // Ctrl+U (View Source)
                else if (event.ctrlKey && code === 85) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    console.log(`${logPrefix} Blocking Ctrl+U.`);
                    return false;
                }

                // Not a protected shortcut - call original listener
                if (typeof originalListener === 'function') {
                    return originalListener.apply(this, arguments);
                } else if (originalListener && typeof originalListener.handleEvent === 'function') {
                    return originalListener.handleEvent.call(originalListener, event);
                }
            };
            return originalAddEventListener.call(this, type, wrappedListener, options);
        }

        return originalAddEventListener.call(this, type, listener, options);
    };
    if (detailedLogging) console.log(`${logPrefix} addEventListener intercepted to restore DevTools shortcuts and block others.`);

    // --- Nullify direct 'on' event handlers ---
    window.onresize = null;
    window.oncontextmenu = null;
    document.oncontextmenu = null;
    window.onselectstart = null;
    document.onselectstart = null;
    window.oncopy = null;
    document.oncopy = null;
    window.oncut = null;
    document.oncut = null;
    window.onpaste = null;
    document.onpaste = null;
    if (detailedLogging) console.log(`${logPrefix} Direct 'on' event handlers nullified.`);

    // --- Prevent window.close ---
     try {
        const originalClose = window.close;
        window.close = function() {
            if (detailedLogging) console.log(`${logPrefix} Blocked window.close() call.`);
        };
         if (detailedLogging) console.log(`${logPrefix} Intercepted window.close().`);
     } catch(e) {
         console.error(`${logPrefix} Failed to intercept window.close():`, e); // Keep Error Logs
     }
    if (detailedLogging) console.log(`${logPrefix} window.close() interception attempted.`);


    // --- Override Console methods (Minimal) ---
    try {
        const originalConsoleClear = window.console.clear;
        window.console.clear = function() {
             if (detailedLogging) console.log(`${logPrefix} console.clear() blocked.`);
        };
        if (detailedLogging) console.log(`${logPrefix} console.clear() intercepted.`);
    } catch (e) {
        console.error(`${logPrefix} Failed to intercept console.clear():`, e); // Keep Error Logs
    }

    // --- Prevent toString trick (RegExp, Date, Function) ---
    const overrideToString = (proto, originalMethod) => {
        try {
            proto.toString = function() {
                try {
                    if (typeof originalMethod !== 'function') {
                         return Object.prototype.toString.call(this);
                    }
                    return originalMethod.call(this);
                } catch (e) {
                    if (detailedLogging) console.warn(`${logPrefix} Caught error during ${proto?.constructor?.name || 'Object'}.toString(), returning generic string.`);
                    if (proto === Function.prototype) return 'function () { [native code] }';
                    if (proto === Date.prototype) return (new Date()).toLocaleString();
                    if (proto === RegExp.prototype) return '/(?:)/';
                    return '[object Object]';
                }
            };
            if (detailedLogging) console.log(`${logPrefix} ${proto?.constructor?.name || 'Object'}.prototype.toString overridden.`);
        } catch (e) {
            console.error(`${logPrefix} Failed to override ${proto?.constructor?.name || 'Object'}.prototype.toString:`, e); // Keep Error Logs
        }
    };
    overrideToString(RegExp.prototype, RegExp.prototype.toString);
    overrideToString(Date.prototype, Date.prototype.toString);
    overrideToString(Function.prototype, Function.prototype.toString);

    // --- Prevent property getter trick ---
    try {
        const originalDefineProperty = Object.defineProperty;
        Object.defineProperty = function(obj, prop, descriptor) {
            // Block suspicious getters on HTMLElements that may detect DevTools
            if (descriptor && descriptor.get && obj instanceof HTMLElement) {
                const suspiciousProps = ['id', 'className', 'innerHTML', 'offsetHeight', 'offsetWidth'];
                if (suspiciousProps.includes(prop)) {
                    if (detailedLogging) console.log(`${logPrefix} Blocked suspicious getter for '${prop}' on element:`, obj);
                    // Replace getter with simple value instead
                    return originalDefineProperty(obj, prop, {
                        value: descriptor.value || `bypassed-${prop}`,
                        writable: true,
                        configurable: true,
                        enumerable: descriptor.enumerable !== undefined ? descriptor.enumerable : true,
                    });
                }
            }
            return originalDefineProperty.apply(this, arguments);
        };
        if (detailedLogging) console.log(`${logPrefix} Object.defineProperty intercepted for suspicious getters.`);
    } catch(e) {
        console.error(`${logPrefix} Failed to intercept Object.defineProperty:`, e);
    }


    // --- Attempt to expose and control disable-devtool state ---
    function suspendDisableDevtool() {
        let suspended = false;

        // Check for DisableDevtool library
        if (typeof window.DisableDevtool !== 'undefined') {
            try {
                // Method 1: Set isSuspend flag
                if (typeof window.DisableDevtool.isSuspend !== 'undefined' && !window.DisableDevtool.isSuspend) {
                    window.DisableDevtool.isSuspend = true;
                    console.log(`${logPrefix} Found and suspended DisableDevtool via isSuspend.`);
                    suspended = true;
                }
                // Method 2: Disable main disable function
                if (typeof window.DisableDevtool.disable === 'function') {
                    window.DisableDevtool.disable = function() {};
                    if (detailedLogging) console.log(`${logPrefix} Disabled DisableDevtool.disable() function.`);
                    suspended = true;
                }
                // Method 3: Override enable to keep it disabled
                if (typeof window.DisableDevtool.enable === 'function') {
                    const originalEnable = window.DisableDevtool.enable;
                    window.DisableDevtool.enable = function() {
                        if (detailedLogging) console.log(`${logPrefix} Intercepted DisableDevtool.enable() call.`);
                    };
                    suspended = true;
                }
            } catch (e) {
                console.error(`${logPrefix} Error trying to suspend DisableDevtool:`, e);
            }
        }

        return suspended;
    }

    // Initial attempt
    suspendDisableDevtool();

    // Periodic monitoring for dynamically injected DisableDevtool
    const disableDevtoolMonitorInterval = originalSetInterval(function() {
        if (suspendDisableDevtool()) {
            // Successfully suspended, stop monitoring
            originalSetInterval(function() { }, 0); // Clear the interval
            if (detailedLogging) console.log(`${logPrefix} DisableDevtool monitoring stopped after successful suspension.`);
        }
    }, 500);

    // Also check on key lifecycle events
    originalSetTimeout(suspendDisableDevtool, 100);
    originalSetTimeout(suspendDisableDevtool, 500);
    originalSetTimeout(suspendDisableDevtool, 1000);

    console.log(`${logPrefix} Bypass devtool-detection initialized.`); // Keep Final Log
})();