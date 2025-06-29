// src/logger.js
import log from 'loglevel';

// 1️⃣ Grab the original methodFactory
const originalFactory = log.methodFactory;

// 2️⃣ Override it to inject CSS for both prefix and message
log.methodFactory = (methodName, logLevel, loggerName) => {
    // Create the raw console method (console.debug, console.warn, etc.)
    const rawMethod = originalFactory(methodName, logLevel, loggerName);

    return (...args) => {
        // Decide colors per level
        let prefixCss, messageCss;
        switch (methodName) {
            case 'debug':
                prefixCss = 'color: #ff9900; font-weight: bold;';
                messageCss = 'color: #ffaa00;';            // lighter orange
                break;
            case 'info':
                prefixCss = 'color: #0055ff; font-weight: bold;';
                messageCss = 'color: #0077ff;';            // lighter blue
                break;
            case 'warn':
                prefixCss = 'color: #ff9900; font-weight: bold;';
                messageCss = 'color: #ffaa00;';            // lighter orange
                break;
            case 'error':
                prefixCss = 'color: #ff0000; font-weight: bold;';
                messageCss = 'color: #cc0000;';            // dark red
                break;
            default:
                prefixCss = '';
                messageCss = '';
        }

        if (args.length === 0) {
            // no message, just prefix
            rawMethod(`%c[${methodName.toUpperCase()}]`, prefixCss);
        } else {
            // build a `%o` placeholder for each argument
            const placeholders = args.map(() => '%o').join(' ');
            // first %c applies prefixCss, second %c applies messageCss
            const formatString = `%c[${methodName.toUpperCase()}]%c ${placeholders}`;

            rawMethod(formatString, prefixCss, messageCss, ...args);
        }
    };
};

// 3️⃣ Re-bind the levels so our new factory takes effect
if (process.env.NODE_ENV === 'development') {
    log.setLevel('debug');
} else {
    log.setLevel('warn');
}

export default log;
