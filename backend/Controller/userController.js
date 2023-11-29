const User = require("../Models/User");
const jwt = require('jsonwebtoken');


let createUser = (req, res) => {

    let user = new User({ ...req.body });

    user.save().then((createdUser) => {
        res.status(200).send({ message: "User created", user: createdUser });
    }).catch(err => {
        res.status(500).send({ message: "Error", err });
    });
};

let login = (req, res) => {
    let { username, password } = req.body;
    User.findOne({ username, password }).then((user) => {
        if (!user) {
            console.log('user not found')
            res.status(404).send({ message: "User not Found" })
        }
        else {
            const currentDate = new Date();
            const dateTimeString = currentDate.toLocaleString();
            let loggedUser = {
                ...user,
                loggedInTime: dateTimeString
            }
            let token = jwt.sign({ ...loggedUser }, process.env.SECRET_KEY, { expiresIn: '24h' })


            res.status(200).send({ token: token, user: loggedUser })
        }
    })
}

let updateUser = (req, res) => {
    let _id = req.params.id;
    let updates = req.body;

    User.findOneAndUpdate({ _id }, updates, { new: true })
        .then((updatedUser) => {
            if (!updatedUser) {
                return res.status(404).send({ message: "User not found" });
            }
            res.status(200).send({ message: "User updated", user: updatedUser });
        })
        .catch(err => {
            res.status(500).send({ message: "Error", err });
        });
};

let deleteUser = (req, res) => {
    let _id = req.params.id;

    User.findByIdAndDelete(_id)
        .then((deletedUser) => {
            if (!deletedUser) {
                return res.status(404).send({ message: "User not found" });
            }
            res.status(200).send({ message: "User deleted", deletedUser });
        })
        .catch(err => {
            res.status(500).send({ message: "Error", err });
        });
};

let getAllUsers = (req, res) => {
    User.find({})
        .then((users) => {
            res.status(200).send({ users });
        })
        .catch(err => {
            res.status(500).send({ message: "Error", err });
        });
};

let getUserById = (req, res) => {
    let userId = req.params.id;

    User.findById(userId)
        .then((user) => {
            if (!user) {
                return res.status(404).send({ message: "User not found" });
            }
            res.status(200).send({ user });
        })
        .catch(err => {
            res.status(500).send({ message: "Error", err });
        });
};

module.exports = {
    createUser,
    updateUser,
    deleteUser,
    getAllUsers,
    getUserById,
    login
};
