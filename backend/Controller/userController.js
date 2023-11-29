const User = require("../Models/User");
const jwt = require('jsonwebtoken');


let createUser = async (req, res) => {
    try {
        // Find the last user in the database to determine the next userId
        const lastUser = await User.findOne().sort({ userId: -1 }).exec();
        let nextUserId = 1;

        if (lastUser) {
            // If a user exists, increment the userId
            nextUserId = lastUser.userId + 1;
        }

        // Extract other attributes from the request body
        const { username, password, address, contactNumber, active } = req.body;

        // Check if the username already exists in the database
        const existingUser = await User.findOne({ username }).exec();

        if (existingUser) {
            // Username already exists, send an error response
            return res.status(200).send({ message: "Username is already assigned to a client" });
        }

        // Username is unique, proceed to create a new user
        const user = new User({
            userId: nextUserId,
            username,
            password,
            address,
            contactNumber,
            active,
        });

        const createdUser = await user.save();

        res.status(201).send({ message: "User created successfully", user: createdUser });
    } catch (error) {
        console.error("Error creating user", error);
        res.status(500).send({ message: "Error", error });
    }
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


            res.status(200).send({ token: token, user: user })
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
