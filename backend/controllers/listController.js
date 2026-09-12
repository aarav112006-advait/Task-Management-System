const db = require('../config/db');

// @desc Create a new list
// @route POST /api/lists
const createList = async (req, res, next) => {
  try {
    const { title, description, color } = req.body;
    const ownerId = req.user.id;

    if (!title) {
      return res.status(400).json({ success: false, message: 'List title is required.' });
    }

    const result = await db.query(
      `INSERT INTO lists (owner_id, title, description, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [ownerId, title.trim(), description || '', color || '#3b82f6']
    );

    const newList = result.rows[0];

    // Automatically add owner into collaborators with 'owner' role
    await db.query(
      `INSERT INTO list_collaborators (list_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [newList.id, ownerId]
    );

    res.status(201).json({
      success: true,
      message: 'List created successfully',
      data: newList
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all lists owned or collaborated on by the user
// @route GET /api/lists
const getLists = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT DISTINCT 
        l.id, 
        l.title, 
        l.description, 
        l.color, 
        l.created_at, 
        l.owner_id,
        u.name AS owner_name,
        u.email AS owner_email,
        CASE 
          WHEN l.owner_id = $1 THEN 'owner'
          ELSE COALESCE(lc.role, 'viewer')
        END AS current_user_role,
        (SELECT COUNT(*)::int FROM tasks t WHERE t.list_id = l.id) AS total_tasks,
        (SELECT COUNT(*)::int FROM tasks t WHERE t.list_id = l.id AND t.status = 'completed') AS completed_tasks
      FROM lists l
      JOIN users u ON l.owner_id = u.id
      LEFT JOIN list_collaborators lc ON l.id = lc.list_id AND lc.user_id = $1
      WHERE l.owner_id = $1 OR lc.user_id = $1
      ORDER BY l.created_at DESC;
    `;

    const { rows } = await db.query(query, [userId]);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get list by ID with details and collaborators
// @route GET /api/lists/:id
const getListById = async (req, res, next) => {
  try {
    const listId = req.params.id;

    const listQuery = `
      SELECT l.*, u.name AS owner_name, u.email AS owner_email
      FROM lists l
      JOIN users u ON l.owner_id = u.id
      WHERE l.id = $1
    `;
    const listResult = await db.query(listQuery, [listId]);

    if (listResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'List not found.' });
    }

    const list = listResult.rows[0];

    const collabQuery = `
      SELECT lc.id, lc.user_id, lc.role, lc.invited_at, u.name, u.email
      FROM list_collaborators lc
      JOIN users u ON lc.user_id = u.id
      WHERE lc.list_id = $1
      ORDER BY lc.invited_at ASC
    `;
    const collabResult = await db.query(collabQuery, [listId]);
    list.collaborators = collabResult.rows;

    res.status(200).json({
      success: true,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update list
// @route PUT /api/lists/:id
const updateList = async (req, res, next) => {
  try {
    const listId = req.params.id;
    const { title, description, color } = req.body;

    const currentList = await db.query('SELECT * FROM lists WHERE id = $1', [listId]);
    if (currentList.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'List not found.' });
    }

    const updated = await db.query(
      `UPDATE lists
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           color = COALESCE($3, color)
       WHERE id = $4
       RETURNING *`,
      [title ? title.trim() : null, description, color, listId]
    );

    res.status(200).json({
      success: true,
      message: 'List updated successfully',
      data: updated.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete list
// @route DELETE /api/lists/:id
const deleteList = async (req, res, next) => {
  try {
    const listId = req.params.id;

    await db.query('DELETE FROM lists WHERE id = $1', [listId]);

    res.status(200).json({
      success: true,
      message: 'List and associated tasks deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc Add collaborator to list
// @route POST /api/lists/:id/collaborators
const addCollaborator = async (req, res, next) => {
  try {
    const listId = req.params.id;
    const { email, role = 'editor' } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Collaborator email is required.' });
    }

    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'editor' or 'viewer'." });
    }

    const userQuery = await db.query('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User with this email not found.' });
    }

    const collaboratorUser = userQuery.rows[0];

    // Verify collaborator is not the owner
    const listOwnerCheck = await db.query('SELECT owner_id FROM lists WHERE id = $1', [listId]);
    if (listOwnerCheck.rows[0].owner_id === collaboratorUser.id) {
      return res.status(400).json({ success: false, message: 'User is already the owner of this list.' });
    }

    const result = await db.query(
      `INSERT INTO list_collaborators (list_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (list_id, user_id) 
       DO UPDATE SET role = EXCLUDED.role, invited_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [listId, collaboratorUser.id, role]
    );

    res.status(200).json({
      success: true,
      message: 'Collaborator added/updated successfully',
      data: {
        ...result.rows[0],
        user: collaboratorUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Remove collaborator from list
// @route DELETE /api/lists/:id/collaborators/:userId
const removeCollaborator = async (req, res, next) => {
  try {
    const listId = req.params.id;
    const targetUserId = req.params.userId;

    await db.query(
      'DELETE FROM list_collaborators WHERE list_id = $1 AND user_id = $2',
      [listId, targetUserId]
    );

    res.status(200).json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createList,
  getLists,
  getListById,
  updateList,
  deleteList,
  addCollaborator,
  removeCollaborator
};
