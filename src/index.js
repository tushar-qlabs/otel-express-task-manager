const express = require('express');
const path = require('path');
const logger = require('./observability/logger');
const taskRoutes = require('./routes/taskRoutes');
const { initDb } = require('./models/db');

// Initialize Database
initDb();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Register Routes
app.use('/tasks', taskRoutes);

// Root route (Redirect to UI)
app.get('/', (req, res) => {
    logger.info('Serving UI redirect');
    res.redirect('/index.html');
});



app.listen(port, () => {
    logger.info(`Task Manager API listening at http://localhost:${port}`);
});
