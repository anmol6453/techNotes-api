const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .get(userController.getAllUsers)
    .post(userController.createUsers)
    .patch(userController.updateUsers)
    .delete(userController.deleteUsers);

module.exports = router;