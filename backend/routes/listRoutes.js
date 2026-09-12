const express = require('express');
const router = express.Router();
const {
  createList,
  getLists,
  getListById,
  updateList,
  deleteList,
  addCollaborator,
  removeCollaborator
} = require('../controllers/listController');
const { authenticate } = require('../middleware/authMiddleware');
const { checkListAccess } = require('../middleware/listAccessMiddleware');

router.use(authenticate);

router.route('/')
  .get(getLists)
  .post(createList);

router.route('/:id')
  .get(checkListAccess('viewer'), getListById)
  .put(checkListAccess('editor'), updateList)
  .delete(checkListAccess('owner'), deleteList);

router.post('/:id/collaborators', checkListAccess('owner'), addCollaborator);
router.delete('/:id/collaborators/:userId', checkListAccess('owner'), removeCollaborator);

module.exports = router;
