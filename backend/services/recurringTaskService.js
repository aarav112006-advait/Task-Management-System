/**
 * Calculates the next occurrence timestamp based on the base date, recurrence pattern, and interval.
 * @param {Date|string} baseDate
 * @param {'daily'|'weekly'|'monthly'|'custom'} pattern
 * @param {number} interval
 * @returns {Date}
 */
const calculateNextOccurrence = (baseDate, pattern, interval = 1) => {
  const nextDate = new Date(baseDate || new Date());
  const step = Math.max(1, parseInt(interval, 10) || 1);

  switch (pattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + step);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * step));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + step);
      break;
    case 'custom':
      // default custom interval is in days
      nextDate.setDate(nextDate.getDate() + step);
      break;
    default:
      nextDate.setDate(nextDate.getDate() + step);
  }

  return nextDate;
};

/**
 * Spawns the next instance of a recurring task upon completion or scheduled trigger.
 * Copies assignees and sets parent_recurring_task_id.
 * @param {object} dbClient - PostgreSQL client or pool
 * @param {object} task - Existing completed/trigger task
 * @returns {Promise<object>} Newly created task row
 */
const spawnNextRecurringTask = async (dbClient, task) => {
  if (!task.is_recurring || !task.recurrence_pattern) {
    return null;
  }

  const baseDate = task.due_date ? new Date(task.due_date) : new Date();
  const nextDueDate = calculateNextOccurrence(baseDate, task.recurrence_pattern, task.recurrence_interval);
  const futureOccurrence = calculateNextOccurrence(nextDueDate, task.recurrence_pattern, task.recurrence_interval);

  // Determine parent root recurring task id
  const rootRecurringId = task.parent_recurring_task_id || task.id;

  const insertQuery = `
    INSERT INTO tasks (
      list_id,
      creator_id,
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
      next_occurrence,
      parent_recurring_task_id
    ) VALUES ($1, $2, $3, $4, $5, 'todo', $6, $7, $8, true, $9, $10, $11, $12)
    RETURNING *;
  `;

  const values = [
    task.list_id,
    task.creator_id,
    task.title,
    task.description,
    task.priority || 'medium',
    nextDueDate,
    task.reminder_time ? calculateNextOccurrence(new Date(task.reminder_time), task.recurrence_pattern, task.recurrence_interval) : null,
    task.category_id,
    task.recurrence_pattern,
    task.recurrence_interval,
    futureOccurrence,
    rootRecurringId
  ];

  const result = await dbClient.query(insertQuery, values);
  const newTask = result.rows[0];

  // Copy assignees from previous task
  const assigneesResult = await dbClient.query(
    'SELECT user_id FROM task_assignees WHERE task_id = $1',
    [task.id]
  );

  if (assigneesResult.rows.length > 0) {
    for (const row of assigneesResult.rows) {
      await dbClient.query(
        'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [newTask.id, row.user_id]
      );
    }
  }

  // Log activity for new occurrence spawn
  await dbClient.query(
    'INSERT INTO task_activities (task_id, user_id, action) VALUES ($1, $2, $3)',
    [newTask.id, task.creator_id, `Recurring task instance spawned automatically from task #${task.id}`]
  );

  return newTask;
};

module.exports = {
  calculateNextOccurrence,
  spawnNextRecurringTask
};
