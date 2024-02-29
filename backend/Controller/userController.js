const Digit = require("../Models/Digit");
const User = require("../Models/User");
const jwt = require('jsonwebtoken');


async function createDigit(data) {
    const digit = new Digit(data);
    return await digit.save();
}

function initializeOneDigit(price = 0) {
    const digitsArray = Array.from({ length: 10 }, (_, index) => index.toString());
    const articles = {};
    digitsArray.forEach((digit) => {
        articles[digit] = price;
    });
    return articles
}
function initializeTwoDigit(price = 0) {
    const twoDigitsArray = Array.from({ length: 100 }, (_, index) => index.toString().padStart(2, '0'));
    const articles = {};
    twoDigitsArray.forEach((digits) => {
        articles[digits] = price;
    });
    return articles
}
function initializeThreeDigit(price = 0) {
    const threeDigitsArray = Array.from({ length: 1000 }, (_, index) => index.toString().padStart(3, '0'));
    const articles = {};
    threeDigitsArray.forEach((digits) => {
        articles[digits] = price;
    });
    return articles
}
function initializeFourDigit(price = 0) {
    const fourDigitsArray = Array.from({ length: 10000 }, (_, index) => index.toString().padStart(4, '0'));
    const articles = {};
    fourDigitsArray.forEach((digits) => {
        articles[digits] = price;
    });
    return articles
}


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
        const { name, role, username, password, address, contactNumber, active, creator } = req.body;

        // Check if the username already exists in the database
        const existingUser = await User.findOne({ username }).exec();

        if (existingUser) {
            // Username already exists, send an error response
            return res.status(200).send({ message: "Username is already assigned to a client" });
        }

        let obj = {
            userId: nextUserId,
            password,
            creator,
            username,
            role,
            generalInfo: {
                name,
                address,
                contactNumber,
                active
            },
        }
        let admin = await User.findOne({ role: 'admin' });
        admin = admin.toObject()
        if (role === "distributor" && admin && creator === admin._id.toString()) {
            const oneDigitFirst = await createDigit({ articles: initializeOneDigit(0) });
            const oneDigitSecond = await createDigit({ articles: initializeOneDigit(0) });
            const twoDigitFirst = await createDigit({ articles: initializeTwoDigit(0) });
            const twoDigitSecond = await createDigit({ articles: initializeTwoDigit(0) });
            const threeDigitFirst = await createDigit({ articles: initializeThreeDigit(0) });
            const threeDigitSecond = await createDigit({ articles: initializeThreeDigit(0) });
            const fourDigitFirst = await createDigit({ articles: initializeFourDigit(0) });
            const fourDigitSecond = await createDigit({ articles: initializeFourDigit(0) });

            obj = {
                ...obj,
                purchaseLimit: {
                    oneDigitFirst: oneDigitFirst._id,
                    oneDigitSecond: oneDigitSecond._id,
                    twoDigitFirst: twoDigitFirst._id,
                    twoDigitSecond: twoDigitSecond._id,
                    threeDigitFirst: threeDigitFirst._id,
                    threeDigitSecond: threeDigitSecond._id,
                    fourDigitFirst: fourDigitFirst._id,
                    fourDigitSecond: fourDigitSecond._id,
                }
            }
        }
        // Username is unique, proceed to create a new user
        const user = new User(obj);

        const createdUser = await user.save();

        res.status(201).send({ message: "User created successfully", user: createdUser });
    } catch (error) {
        console.error("Error creating user", error);
        res.status(500).send({ message: "Error", error });
    }
};
const getUserDataById = (allUsers, targetUserId) => {
    const targetUser = allUsers.find(user => user._id.toString() === targetUserId);
    // Return the found user or null if not found
    return targetUser || null;
};

const getTheMainCreatorOfUser = async (_id) => {
    try {
        // Make sure to await the User.find() call
        let allUsers = await User.find({});
        let adminUser = allUsers.find(user => user.role === "admin");
        adminUser = adminUser.toObject()
        let adminId = adminUser._id.toString()
        let mainCreator = {};
        let askingUser = _id;
        while (true) {
            mainCreator = getUserDataById(allUsers, askingUser);
            mainCreator = mainCreator.toObject()
            if (mainCreator.creator.toString() === adminId) {
                mainCreator = await User.findOne({ _id: mainCreator._id.toString() });
                return mainCreator
            }
            askingUser = mainCreator.creator.toString()
        }
    } catch (e) {
    }
}


let login = async (req, res) => {
    let { username, password } = req.body;
    User.findOne({ username, password }).then(async (user) => {
        if (!user) {
            console.log('user not found')
            return res.status(404).send({ message: "User not Found" })
        }
        else {
            let parentUser = await getTheMainCreatorOfUser(user._id.toString());
            parentUser = parentUser?.toObject()

            if (user.generalInfo.active === false) {
                return res.status(201).send({ message: "This account has been deactivated" })
            } else if (parentUser && !parentUser.generalInfo.active) {
                return res.status(201).send({ message: "This account has been deactivated" })
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
        }
    })
}

const updateAssociatedLimits = async (updatedUser, prevUser) => {
    let updatedLimits = updatedUser.purchaseLimit
    let prevLimits = prevUser.purchaseLimit
    try {
        if (updatedLimits.purchaseLimitA1 != prevLimits.purchaseLimitA1) {
            const digit = await Digit.findById(updatedLimits.oneDigitFirst);
            let articleKeys = Object.keys(digit.articles)
            articleKeys.forEach(key => {
                digit.articles[key] = Number(digit.articles[key]) + Number(updatedLimits.purchaseLimitA1) - Number(prevLimits.purchaseLimitA1)
            })
            digit.markModified('articles');
            digit.save();
        }
        if (updatedLimits.purchaseLimitA2 != prevLimits.purchaseLimitA2) {
            const digit = await Digit.findById(updatedLimits.oneDigitSecond);
            let articleKeys = Object.keys(digit.articles)
            articleKeys.forEach(key => {
                digit.articles[key] = Number(digit.articles[key]) + Number(updatedLimits.purchaseLimitA2) - Number(prevLimits.purchaseLimitA2)
            })
            digit.markModified('articles');

            digit.save();
        }
        if (updatedLimits.purchaseLimitB1 != prevLimits.purchaseLimitB1) {
            const digit = await Digit.findById(updatedLimits.twoDigitFirst);
            let articleKeys = Object.keys(digit.articles)
            articleKeys.forEach(key => {
                digit.articles[key] = Number(digit.articles[key]) + Number(updatedLimits.purchaseLimitB1) - Number(prevLimits.purchaseLimitB1)
            })
            digit.markModified('articles');

            digit.save();
        }
        if (updatedLimits.purchaseLimitB2 != prevLimits.purchaseLimitB2) {
            const digit = await Digit.findById(updatedLimits.twoDigitSecond);
            let articleKeys = Object.keys(digit.articles)
            articleKeys.forEach(key => {
                digit.articles[key] = Number(digit.articles[key]) + Number(updatedLimits.purchaseLimitB2) - Number(prevLimits.purchaseLimitB2)
            })
            digit.markModified('articles');
            digit.save();
        }
        if (updatedLimits.purchaseLimitC1 != prevLimits.purchaseLimitC1) {
            const digit = await Digit.findById(updatedLimits.threeDigitFirst);
            let articleKeys = Object.keys(digit.articles)
            articleKeys.forEach(key => {
                digit.articles[key] = Number(digit.articles[key]) + Number(updatedLimits.purchaseLimitC1) - Number(prevLimits.purchaseLimitC1)
            })
            digit.markModified('articles');
            digit.save();
        }
        if (updatedLimits.purchaseLimitC2 != prevLimits.purchaseLimitC2) {
            const digit = await Digit.findById(updatedLimits.threeDigitSecond);
            let articleKeys = Object.keys(digit.articles)
            articleKeys.forEach(key => {
                digit.articles[key] = Number(digit.articles[key]) + Number(updatedLimits.purchaseLimitC2) - Number(prevLimits.purchaseLimitC2)
            })
            digit.markModified('articles');

            digit.save();
        }
        if (updatedLimits.purchaseLimitD1 != prevLimits.purchaseLimitD1) {
            const digit = await Digit.findById(updatedLimits.fourDigitFirst);
            let articleKeys = Object.keys(digit.articles)
            articleKeys.forEach(key => {
                digit.articles[key] = Number(digit.articles[key]) + Number(updatedLimits.purchaseLimitD1) - Number(prevLimits.purchaseLimitD1)
            })
            digit.markModified('articles');

            digit.save();
        }
        if (updatedLimits.purchaseLimitD2 != prevLimits.purchaseLimitD2) {
            const digit = await Digit.findById(updatedLimits.fourDigitSecond);
            let articleKeys = Object.keys(digit.articles)
            articleKeys.forEach(key => {
                digit.articles[key] = Number(digit.articles[key]) + Number(updatedLimits.purchaseLimitD2) - Number(prevLimits.purchaseLimitD2)
            })
            digit.markModified('articles');

            digit.save();
        }
    } catch (err) {
        console.error("Error triggering update in associated digits:", err);
    }
};
const updateUser = async (req, res) => {
    const _id = req.params.id;
    const updates = req.body;

    try {
        let oldUser = await User.findOne({ _id });
        oldUser = { ...oldUser.toObject() }

        let updatedUser = await User.findOneAndUpdate({ _id }, updates, { new: true });

        if (!updatedUser) {
            return res.status(404).send({ message: "User not found" });
        }

        let admin = await User.findOne({ role: 'admin' });

        admin = admin.toObject()
        if (updates.role === "distributor" && admin && updates.creator._id === admin._id.toString()) {
            updateAssociatedLimits(updates, oldUser)
        }
        if (updates.role == "admin") {
            let newRewardUpdates = { rewardCommission: updates.rewardCommission }
            await User.updateMany({}, newRewardUpdates, { new: true });

        }


        // Respond with success message
        res.status(200).send({ message: "User updated", user: updatedUser });
    } catch (err) {
        res.status(500).send({ message: "Error", err });
    }
};

// Recursive function to update 'active' for related users
const updateRelatedUsers = async (userId) => {
    try {
        // Find all users whose creator is the specified userId
        const relatedUsers = await User.find({ creator: userId });

        // Update 'active' to false for the current set of related users
        await User.updateMany({ creator: userId }, { $set: { 'generalInfo.active': false } });

        // Recursively update 'active' for users created by the current set of related users
        const updatePromises = relatedUsers.map((user) => updateRelatedUsers(user._id));
        await Promise.all(updatePromises);
    } catch (err) {
        // Handle error, e.g., log it or handle it based on your application's requirements
        console.error("Error updating related users:", err);
    }
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
    User.find({}).populate('creator')
        .then((users) => {
            res.status(200).send({ users });
        })
        .catch(err => {
            res.status(500).send({ message: "Error", err });
        });
};

let getUserById = (req, res) => {
    let userId = req.params.id;

    User.findById(userId).populate('creator')
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
