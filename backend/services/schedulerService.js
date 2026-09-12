const db = require('../config/db');
const { spawnNextRecurringTask, calculateNextOccurrence } = require('./recurringTaskService');

let intervalId = null;

/**
 * Scans for recurring tasks whose next_occurrence is due and needs spawning,
 * or recurring tasks that need automated occurrence tracking.
 */
const checkAndProcessRecurringTasks = async () => {
  try {
    const now = new Date();
    // Find active recurring tasks where next_occurrence <= NOW() and status is 'completed' but next instance wasn't spawned yet
    const query = `
      SELECT t.* 
      FROM tasks t
      WHERE t.is_recurring = true 
        AND t.next_occurrence IS NOT NULL 
        AND t.next_occurrence <= $1
        AND t.status != 'completed'
      LIMIT 50;
    `;

    const { rows } = await db.query(query, [now]);
    if (rows.length > 0) {
      console.log(`[Scheduler] Checking ${rows.length} scheduled recurring task candidate(s)...`);
      for (const task of rows) {
        // Update next_occurrence to maintain scheduling freshness
        const updatedNext = calculateNextOccurrence(task.next_occurrence, task.recurrence_pattern, task.recurrence_interval);
        await db.query('UPDATE tasks SET next_occurrence = $1 WHERE id = $2', [updatedNext, task.id]);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error checking recurring tasks:', err.message);
  }
};

const startScheduler = (intervalMs = 60000) => {
  if (intervalId) return;
  console.log(`[Scheduler] Recurring task scheduler started with interval ${intervalMs}ms.`);
  intervalId = setInterval(checkAndProcessRecurringTasks, intervalMs);
};

const stopScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Scheduler] Recurring task scheduler stopped.');
  }
};

module.exports = {
  startScheduler,
  stopScheduler,
  checkAndProcessRecurringTasks
};
