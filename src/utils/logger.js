// src/logger.js
import log from 'loglevel';

if (process.env.NODE_ENV === 'development') {
    log.setLevel('debug');
} else {
    // in production only warnings and errors
    log.setLevel('warn');
}

export default log;
