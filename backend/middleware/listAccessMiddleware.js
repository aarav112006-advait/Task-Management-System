const db = require('../config/db');

/**
 * Checks if the requesting user has the required permission role on the list.
 * Role hierarchy: owner (full) > editor (read/write) > viewer (read-only).
 * @param {'viewer'|'editor'|'owner'} requiredRole
 */
const checkListAccess = (requiredRole = 'viewer') => {
  return async (req, res, next) => {
    try {
      const listId = req.params.listId || req.params.id || req.body.list_id;
      const userId = req.user.id;

      if (!listId) {
        return res.status(400).json({ success: false, message: 'List ID is required for access check.' });
      }

      // Check if user is owner of the list
      const listQuery = await db.query('SELECT id, owner_id, title FROM lists WHERE id = $1', [listId]);
      if (listQuery.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'List not found.' });
      }

      const list = listQuery.rows[0];
      if (list.owner_id === userId) {
        req.userRole = 'owner';
        req.targetList = list;
        return next();
      }

      // If required role is 'owner', non-owners cannot proceed
      if (requiredRole === 'owner') {
        return res.status(403).json({ success: false, message: 'Only the list owner can perform this action.' });
      }

      // Check collaboration table
      const collabQuery = await db.query(
        'SELECT role FROM list_collaborators WHERE list_id = $1 AND user_id = $2',
        [listId, userId]
      );

      if (collabQuery.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'You do not have access to this list.' });
      }

      const userRole = collabQuery.rows[0].role;
      req.userRole = userRole;
      req.targetList = list;

      if (requiredRole === 'editor' && userRole !== 'editor' && userRole !== 'owner') {
        return res.status(403).json({ success: false, message: 'Write or editor permissions required.' });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Checks task access by looking up the task's list_id and applying list permissions.
 * @param {'viewer'|'editor'|'owner'} requiredRole
 */
const checkTaskAccess = (requiredRole = 'viewer') => {
  return async (req, res, next) => {
    try {
      const taskId = req.params.taskId || req.params.id;
      const userId = req.user.id;

      if (!taskId) {
        return res.status(400).json({ success: false, message: 'Task ID is required for access check.' });
      }

      const taskQuery = await db.query(
        `SELECT t.*, l.owner_id AS list_owner_id
         FROM tasks t
         JOIN lists l ON t.list_id = l.id
         WHERE t.id = $1`,
        [taskId]
      );

      if (taskQuery.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
      }

      const task = taskQuery.rows[0];
      req.targetTask = task;

      // Check if list owner
      if (task.list_owner_id === userId) {
        req.userRole = 'owner';
        return next();
      }

      if (requiredRole === 'owner') {
        return res.status(403).json({ success: false, message: 'Owner privileges required.' });
      }

      // Check collaboration role on the parent list
      const collabQuery = await db.query(
        'SELECT role FROM list_collaborators WHERE list_id = $1 AND user_id = $2',
        [task.list_id, userId]
      );

      if (collabQuery.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'You do not have access to this task.' });
      }

      const userRole = collabQuery.rows[0].role;
      req.userRole = userRole;

      if (requiredRole === 'editor' && userRole !== 'editor' && userRole !== 'owner') {
        return res.status(403).json({ success: false, message: 'Editor permission required for this task.' });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkListAccess, checkTaskAccess };
