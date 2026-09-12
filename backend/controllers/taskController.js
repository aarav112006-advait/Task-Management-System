const db = require('../config/db');
const { spawnNextRecurringTask, calculateNextOccurrence } = require('../services/recurringTaskService');

// @desc Create a new task
// @route POST /api/tasks
const createTask = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const {
      list_id,
      title,
      description,
      priority = 'medium',
      status = 'todo',
      due_date,
      reminder_time,
      category_id,
      is_recurring = false,
      recurrence_pattern,
      recurrence_interval = 1,
      assignee_ids = []
    } = req.body;

    const creatorId = req.user.id;

    if (!list_id || !title) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'list_id and title are required.' });
    }

    let nextOccurrence = null;
    if (is_recurring && recurrence_pattern) {
      const baseDate = due_date ? new Date(due_date) : new Date();
      nextOccurrence = calculateNextOccurrence(baseDate, recurrence_pattern, recurrence_interval);
    }

    const taskInsert = `
      INSERT INTO tasks (
        list_id, creator_id, title, description, priority, status,
        due_date, reminder_time, category_id, is_recurring,
        recurrence_pattern, recurrence_interval, next_occurrence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    const values = [
      list_id,
      creatorId,
      title.trim(),
      description || '',
      priority,
      status,
      due_date ? new Date(due_date) : null,
      reminder_time ? new Date(reminder_time) : null,
      category_id || null,
      Boolean(is_recurring),
      is_recurring ? recurrence_pattern : null,
      recurrence_interval || 1,
      nextOccurrence
    ];

    const result = await client.query(taskInsert, values);
    const task = result.rows[0];

    // Assign users
    if (Array.isArray(assignee_ids) && assignee_ids.length > 0) {
      for (const userId of assignee_ids) {
        await client.query(
          'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [task.id, userId]
        );
      }
    }

    // Log creation activity
    await client.query(
      'INSERT INTO task_activities (task_id, user_id, action) VALUES ($1, $2, $3)',
      [task.id, creatorId, `Task created with status "${status}" and priority "${priority}"`]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// @desc Get tasks with multi-factor filters
// @route GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      list_id,
      status,
      priority,
      category_id,
      due_date_from,
      due_date_to,
      assigned_to_me,
      search
    } = req.query;

    let queryConditions = [
      `(l.owner_id = $1 OR lc.user_id = $1)` // accessible lists condition
    ];
    let queryParams = [userId];
    let paramIndex = 2;

    if (list_id) {
      queryConditions.push(`t.list_id = $${paramIndex}`);
      queryParams.push(list_id);
      paramIndex++;
    }

    if (status) {
      queryConditions.push(`t.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (priority) {
      queryConditions.push(`t.priority = $${paramIndex}`);
      queryParams.push(priority);
      paramIndex++;
    }

    if (category_id) {
      queryConditions.push(`t.category_id = $${paramIndex}`);
      queryParams.push(category_id);
      paramIndex++;
    }

    if (due_date_from) {
      queryConditions.push(`t.due_date >= $${paramIndex}`);
      queryParams.push(new Date(due_date_from));
      paramIndex++;
    }

    if (due_date_to) {
      queryConditions.push(`t.due_date <= $${paramIndex}`);
      queryParams.push(new Date(due_date_to));
      paramIndex++;
    }

    if (search) {
      queryConditions.push(`(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (assigned_to_me === 'true') {
      queryConditions.push(`EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id AND ta.user_id = $1)`);
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    const selectQuery = `
      SELECT DISTINCT
        t.*,
        l.title AS list_title,
        l.color AS list_color,
        c.name AS category_name,
        c.color AS category_color,
        u.name AS creator_name,
        COALESCE(
          (SELECT json_agg(json_build_object('id', au.id, 'name', au.name, 'email', au.email))
           FROM task_assignees ta
           JOIN users au ON ta.user_id = au.id
           WHERE ta.task_id = t.id), '[]'::json
        ) AS assignees
      FROM tasks t
      JOIN lists l ON t.list_id = l.id
      LEFT JOIN list_collaborators lc ON l.id = lc.list_id AND lc.user_id = $1
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.creator_id = u.id
      ${whereClause}
      ORDER BY 
        CASE t.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
          ELSE 5 
        END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC;
    `;

    const { rows } = await db.query(selectQuery, queryParams);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get task by ID with assignees and activity logs
// @route GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const taskId = req.params.id;

    const taskQuery = `
      SELECT 
        t.*,
        l.title AS list_title,
        l.color AS list_color,
        c.name AS category_name,
        c.color AS category_color,
        u.name AS creator_name,
        COALESCE(
          (SELECT json_agg(json_build_object('id', au.id, 'name', au.name, 'email', au.email))
           FROM task_assignees ta
           JOIN users au ON ta.user_id = au.id
           WHERE ta.task_id = t.id), '[]'::json
        ) AS assignees
      FROM tasks t
      JOIN lists l ON t.list_id = l.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.creator_id = u.id
      WHERE t.id = $1;
    `;

    const taskResult = await db.query(taskQuery, [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const task = taskResult.rows[0];

    // Fetch activities
    const activitiesResult = await db.query(
      `SELECT a.id, a.action, a.created_at, u.name AS user_name, u.email AS user_email
       FROM task_activities a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.task_id = $1
       ORDER BY a.created_at DESC`,
      [taskId]
    );

    task.activities = activitiesResult.rows;

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update task
// @route PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const taskId = req.params.id;
    const userId = req.user.id;
    const {
      title,
      description,
      priority,
      status,
      due_date,
      reminder_time,
      category_id,
      is_recurring,
      recurrence_pattern,
      recurrence_interval,
      assignee_ids
    } = req.body;

    const oldTaskResult = await client.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (oldTaskResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    const oldTask = oldTaskResult.rows[0];

    let completedAt = oldTask.completed_at;
    if (status === 'completed' && oldTask.status !== 'completed') {
      completedAt = new Date();
    } else if (status && status !== 'completed') {
      completedAt = null;
    }

    let nextOccurrence = oldTask.next_occurrence;
    if (is_recurring !== undefined || recurrence_pattern || recurrence_interval || due_date) {
      const activeRecurring = is_recurring !== undefined ? is_recurring : oldTask.is_recurring;
      const pattern = recurrence_pattern || oldTask.recurrence_pattern;
      const interval = recurrence_interval || oldTask.recurrence_interval;
      const baseDate = due_date ? new Date(due_date) : (oldTask.due_date ? new Date(oldTask.due_date) : new Date());

      if (activeRecurring && pattern) {
        nextOccurrence = calculateNextOccurrence(baseDate, pattern, interval);
      } else {
        nextOccurrence = null;
      }
    }

    const updateQuery = `
      UPDATE tasks
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          priority = COALESCE($3, priority),
          status = COALESCE($4, status),
          due_date = CASE WHEN $5::text IS NOT NULL THEN $5::timestamptz ELSE due_date END,
          reminder_time = CASE WHEN $6::text IS NOT NULL THEN $6::timestamptz ELSE reminder_time END,
          category_id = CASE WHEN $7::text IS NOT NULL THEN $7::int ELSE category_id END,
          is_recurring = COALESCE($8, is_recurring),
          recurrence_pattern = COALESCE($9, recurrence_pattern),
          recurrence_interval = COALESCE($10, recurrence_interval),
          next_occurrence = $11,
          completed_at = $12,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *;
    `;

    const values = [
      title ? title.trim() : null,
      description !== undefined ? description : null,
      priority || null,
      status || null,
      due_date !== undefined ? due_date : null,
      reminder_time !== undefined ? reminder_time : null,
      category_id !== undefined ? category_id : null,
      is_recurring !== undefined ? Boolean(is_recurring) : null,
      recurrence_pattern || null,
      recurrence_interval || null,
      nextOccurrence,
      completedAt,
      taskId
    ];

    const result = await client.query(updateQuery, values);
    const updatedTask = result.rows[0];

    // Update assignees if provided
    if (Array.isArray(assignee_ids)) {
      await client.query('DELETE FROM task_assignees WHERE task_id = $1', [taskId]);
      for (const uid of assignee_ids) {
        await client.query(
          'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [taskId, uid]
        );
      }
    }

    // Log update activity
    await client.query(
      'INSERT INTO task_activities (task_id, user_id, action) VALUES ($1, $2, $3)',
      [taskId, userId, `Task updated`]
    );

    // If marked as completed and task is recurring, auto-spawn next occurrence
    let spawnedNextTask = null;
    if (status === 'completed' && oldTask.status !== 'completed' && updatedTask.is_recurring) {
      spawnedNextTask = await spawnNextRecurringTask(client, updatedTask);
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: updatedTask,
        nextRecurringTask: spawnedNextTask
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// @desc Complete a task (convenience endpoint that triggers recurring task spawn)
// @route PATCH /api/tasks/:id/complete
const completeTask = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const taskId = req.params.id;
    const userId = req.user.id;

    const taskQuery = await client.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const task = taskQuery.rows[0];
    const completedAt = new Date();

    const updateResult = await client.query(
      `UPDATE tasks
       SET status = 'completed',
           completed_at = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *;`,
      [completedAt, taskId]
    );

    const completedTask = updateResult.rows[0];

    // Log completion
    await client.query(
      'INSERT INTO task_activities (task_id, user_id, action) VALUES ($1, $2, $3)',
      [taskId, userId, 'Task marked as completed']
    );

    let spawnedNextTask = null;
    if (completedTask.is_recurring) {
      spawnedNextTask = await spawnNextRecurringTask(client, completedTask);
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Task completed successfully',
      data: {
        task: completedTask,
        nextOccurrenceSpawned: spawnedNextTask
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// @desc Delete task
// @route DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  completeTask,
  deleteTask
};
