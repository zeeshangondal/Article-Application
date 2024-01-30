const {getAllUsers, getUserById, updateUser ,login, deleteUser, createUser} = require("../Controller/userController");


const userRouter = require("express").Router();

userRouter.get("/:id" , getUserById)
userRouter.post("/" , createUser)

userRouter.post('/login' , login)

userRouter.patch('/:id' , updateUser)

userRouter.delete('/:id', deleteUser);

userRouter.get('/' , getAllUsers)



module.exports = userRouter;



