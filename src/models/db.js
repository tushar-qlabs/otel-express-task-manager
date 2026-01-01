const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../observability/logger');
const { getTracer } = require('../observability/tracer');

const dbPath = path.resolve(__dirname, '../../tasks.db');
const tracer = getTracer();

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Could not connect to database', err);
    } else {
        logger.info('Connected to SQLite database');
    }
});

const initDb = () => {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            createdAt TEXT,
            completedAt TEXT
        )`, (err) => {
            if (err) {
                logger.error('Error creating table', err);
            } else {
                logger.info('Tasks table initialized');
            }
        });
    });
};

// Promisified DB methods
const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        // Trace the DB execution
        tracer.startActiveSpan('sqlite-run', (span) => {
            span.setAttribute('db.system', 'sqlite');
            span.setAttribute('db.statement', sql);

            db.run(sql, params, function (err) {
                if (err) {
                    span.recordException(err);
                    span.setStatus({ code: 2, message: err.message }); // Error
                    span.end();
                    reject(err);
                } else {
                    span.end();
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    });
};

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        tracer.startActiveSpan('sqlite-get', (span) => {
            span.setAttribute('db.system', 'sqlite');
            span.setAttribute('db.statement', sql);

            db.get(sql, params, (err, row) => {
                if (err) {
                    span.recordException(err);
                    span.setStatus({ code: 2, message: err.message });
                    span.end();
                    reject(err);
                } else {
                    span.end();
                    resolve(row);
                }
            });
        });
    });
};

const all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        tracer.startActiveSpan('sqlite-all', (span) => {
            span.setAttribute('db.system', 'sqlite');
            span.setAttribute('db.statement', sql);

            db.all(sql, params, (err, rows) => {
                if (err) {
                    span.recordException(err);
                    span.setStatus({ code: 2, message: err.message });
                    span.end();
                    reject(err);
                } else {
                    span.end();
                    resolve(rows);
                }
            });
        });
    });
};

module.exports = { initDb, run, get, all };
