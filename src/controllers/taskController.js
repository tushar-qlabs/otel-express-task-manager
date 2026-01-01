const db = require('../models/db');
const logger = require('../observability/logger');
const { getTracer } = require('../observability/tracer');


const tracer = getTracer();

const getAllTasks = async (req, res) => {
    await tracer.startActiveSpan('fetch-all-tasks-controller', async (span) => {
        try {
            const tasks = await db.all("SELECT * FROM tasks ORDER BY id DESC");
            logger.info('Fetched all tasks');
            res.status(200).json(tasks);
            span.setAttribute('tasks.count', tasks.length);
        } catch (err) {
            logger.error('Error fetching tasks', err);
            span.recordException(err);
            res.status(500).json({ error: err.message });
        } finally {
            span.end();
        }
    });
};

const createTask = async (req, res) => {
    const { title, description } = req.body;
    if (!title) {
        logger.warn('Failed to create task: Missing title');
        return res.status(400).json({ error: 'Title is required' });
    }

    await tracer.startActiveSpan('create-task-controller', async (span) => {
        try {
            const createdAt = new Date().toISOString();
            const result = await db.run(
                "INSERT INTO tasks (title, description, status, createdAt) VALUES (?, ?, ?, ?)",
                [title, description || '', 'pending', createdAt]
            );

            logger.info(`Created task: ${title}`);

            const newTask = {
                id: result.id,
                title,
                description: description || '',
                status: 'pending',
                createdAt
            };

            span.setAttribute('task.id', newTask.id);
            span.setAttribute('task.title', newTask.title);

            res.status(201).json(newTask);
        } catch (err) {
            logger.error('Error creating task', err);
            span.recordException(err);
            res.status(500).json({ error: err.message });
        } finally {
            span.end();
        }
    });
};

const getTaskById = async (req, res) => {
    const id = parseInt(req.params.id);

    await tracer.startActiveSpan('find-task-by-id-controller', async (span) => {
        span.setAttribute('task.id', id);
        try {
            const task = await db.get("SELECT * FROM tasks WHERE id = ?", [id]);

            if (!task) {
                logger.warn(`Task not found: ${id}`);
                span.setStatus({ code: 2, message: 'Task not found' });
                res.status(404).json({ error: 'Task not found' });
            } else {
                res.status(200).json(task);
            }
        } catch (err) {
            logger.error(`Error fetching task ${id}`, err);
            span.recordException(err);
            res.status(500).json({ error: err.message });
        } finally {
            span.end();
        }
    });
};

const updateTask = async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    await tracer.startActiveSpan('update-task-status-controller', async (span) => {
        span.setAttribute('task.id', id);
        span.setAttribute('task.status', status);
        try {
            const result = await db.run(
                "UPDATE tasks SET status = ? WHERE id = ?",
                [status, id]
            );

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }

            logger.info(`Updated task ${id} to status: ${status}`);

            const updatedTask = await db.get("SELECT * FROM tasks WHERE id = ?", [id]);
            res.status(200).json(updatedTask);
        } catch (err) {
            logger.error(`Error updating task ${id}`, err);
            span.recordException(err);
            res.status(500).json({ error: err.message });
        } finally {
            span.end();
        }
    });
};

const deleteTask = async (req, res) => {
    const id = parseInt(req.params.id);

    await tracer.startActiveSpan('delete-task-controller', async (span) => {
        span.setAttribute('task.id', id);
        try {
            await db.run("DELETE FROM tasks WHERE id = ?", [id]);
            logger.info(`Deleted task: ${id}`);
            res.status(204).send();
        } catch (err) {
            logger.error(`Error deleting task ${id}`, err);
            span.recordException(err);
            res.status(500).json({ error: err.message });
        } finally {
            span.end();
        }
    });
};

module.exports = {
    getAllTasks,
    createTask,
    getTaskById,
    updateTask,
    deleteTask
};
