const Digit = require("../Models/Digit");
const Draw = require("../Models/Draw");
const User = require("../Models/User");

// Create a new Digit
const createDigit = async (req, res) => {
    try {
        const { articles } = req.body;

        const digit = new Digit({ articles });

        const createdDigit = await digit.save();

        res.status(201).send({ message: "Digit created successfully", digit: createdDigit });
    } catch (error) {
        console.error("Error creating digit", error);
        res.status(500).send({ message: "Error", error });
    }
};


function getLimitFirst(user, bundle) {
    const bundleLength = bundle.length;

    switch (bundleLength) {
        case 1:
            return user.purchaseLimit.purchaseLimitA1;
        case 2:
            return user.purchaseLimit.purchaseLimitB1;
        case 3:
            return user.purchaseLimit.purchaseLimitC1;
        case 4:
            return user.purchaseLimit.purchaseLimitD1;
        default:
            // Handle other cases if needed
            return null;
    }
}

function getLimitSecond(user, bundle) {
    const bundleLength = bundle.length;

    switch (bundleLength) {
        case 1:
            return user.purchaseLimit.purchaseLimitA2;
        case 2:
            return user.purchaseLimit.purchaseLimitB2;
        case 3:
            return user.purchaseLimit.purchaseLimitC2;
        case 4:
            return user.purchaseLimit.purchaseLimitD2;
        default:
            // Handle other cases if needed
            return null;
    }
}
// Update an existing Digit
const updateDigit = async (req, res) => {
    let { firstDigitId, secondDigitId, bundle, purchaseFirst, purchaseSecond, type, askingUser, firstLimitOfDraw, secondLimitOfDraw } = req.body;
    purchaseFirst = Number(purchaseFirst)
    purchaseSecond = Number(purchaseSecond)
    try {
        let currentUser = await User.findOne({ _id: askingUser });

        let parentUser = await getTheMainCreatorOfUser(askingUser)
        let data = getFirstAndSecondDigitRefs(bundle, parentUser.toObject())

        const [firstDigit, secondDigit, parentFirstDigit, parentSecondDigit] = await Promise.all([
            Digit.findById(firstDigitId),
            Digit.findById(secondDigitId),
            Digit.findById(data.firstDigit),
            Digit.findById(data.secondDigit)
        ]);


        if (type === "+") {
            let remaingForParent = (Number(firstDigit.articles[bundle]) + Number(purchaseFirst)) - firstLimitOfDraw
            let forFirstDigit = purchaseFirst
            if (remaingForParent > 0) {
                forFirstDigit = purchaseFirst - remaingForParent
            }
            firstDigit.articles[bundle] = Number(firstDigit.articles[bundle]) + Number(forFirstDigit)
            parentFirstDigit.articles[bundle] = Number(parentFirstDigit.articles[bundle]) + Number(remaingForParent)
            firstDigit.markModified('articles');
            await firstDigit.save()
            if (remaingForParent > 0) {
                parentFirstDigit.markModified('articles');
                await parentFirstDigit.save()
            }

            remaingForParent = (Number(secondDigit.articles[bundle]) + Number(purchaseSecond)) - secondLimitOfDraw
            let forSecondDigit = purchaseSecond
            if (remaingForParent > 0) {
                forSecondDigit = purchaseSecond - remaingForParent
            }
            secondDigit.articles[bundle] = Number(secondDigit.articles[bundle]) + Number(forSecondDigit)
            parentSecondDigit.articles[bundle] = Number(parentSecondDigit.articles[bundle]) + Number(remaingForParent)
            secondDigit.markModified('articles');
            await secondDigit.save()
            if (remaingForParent > 0) {
                parentSecondDigit.markModified('articles');
                await parentSecondDigit.save()
            }

        } else if (type === "-") {

            if (parentFirstDigit.articles[bundle] > 0) {
                if (parentFirstDigit.articles[bundle] >= purchaseFirst) {
                    parentFirstDigit.articles[bundle] = parentFirstDigit.articles[bundle] - purchaseFirst
                    parentFirstDigit.markModified('articles');
                    await parentFirstDigit.save()
                } else {
                    let remaingPurchaseFirst = purchaseFirst - parentFirstDigit.articles[bundle]
                    parentFirstDigit.articles[bundle] = 0
                    parentFirstDigit.markModified('articles');
                    await parentFirstDigit.save()
                    firstDigit.articles[bundle] = firstDigit.articles[bundle] - remaingPurchaseFirst
                    firstDigit.markModified('articles');
                    await firstDigit.save()
                }
            } else {
                firstDigit.articles[bundle] = firstDigit.articles[bundle] - purchaseFirst
                firstDigit.markModified('articles');
                await firstDigit.save()
            }
            //second digit
            if (parentSecondDigit.articles[bundle] > 0) {
                if (parentSecondDigit.articles[bundle] >= purchaseSecond) {
                    parentSecondDigit.articles[bundle] = parentSecondDigit.articles[bundle] - purchaseSecond
                    parentSecondDigit.markModified('articles');
                    await parentSecondDigit.save()
                } else {
                    let remaingPurchaseSecond = purchaseSecond - parentSecondDigit.articles[bundle]
                    parentSecondDigit.articles[bundle] = 0
                    parentSecondDigit.markModified('articles');
                    await parentSecondDigit.save()
                    secondDigit.articles[bundle] = secondDigit.articles[bundle] - remaingPurchaseSecond
                    secondDigit.markModified('articles');
                    await secondDigit.save()
                }
            } else {
                secondDigit.articles[bundle] = secondDigit.articles[bundle] - purchaseSecond
                secondDigit.markModified('articles');
                await secondDigit.save()
            }
        }
        res.status(200).send({ message: "Digit updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error", err });
    }
}


const removeBulkPurchase = async (req, res) => {
    let { draw_id, user_id, purchases } = req.body
    try {
        let user = await User.findById(user_id);
        let parentUser = await getTheMainCreatorOfUser(user._id.toString())
        let purchasedFromDrawData = user.purchasedFromDrawData.find(data => data.drawId == draw_id)
        let fetchedDigits = {};
        for (const purchase of purchases) {
            let { bundle, first, second, firstLimitOfDraw, secondLimitOfDraw } = purchase

            let parentData = getFirstAndSecondDigitRefs(bundle, parentUser.toObject())
            let firstDigit = fetchedDigits[purchase.firstDigitId] || await Digit.findById(purchase.firstDigitId);
            let secondDigit = fetchedDigits[purchase.secondDigitId] || await Digit.findById(purchase.secondDigitId);
            let parentFirstDigit = fetchedDigits[parentData.firstDigit.toString()] || await Digit.findById(parentData.firstDigit.toString());
            let parentSecondDigit = fetchedDigits[parentData.secondDigit.toString()] || await Digit.findById(parentData.secondDigit.toString());

            // Store fetched digits in the fetchedDigits object
            fetchedDigits[purchase.firstDigitId] = firstDigit;
            fetchedDigits[purchase.secondDigitId] = secondDigit;
            fetchedDigits[parentData.firstDigit.toString()] = parentFirstDigit;
            fetchedDigits[parentData.secondDigit.toString()] = parentSecondDigit;


            let remaingForParent = (Number(firstDigit.articles[bundle]) + Number(first)) - firstLimitOfDraw
            let forFirstDigit = first
            if (remaingForParent > 0) {
                forFirstDigit = first - remaingForParent
            }
            firstDigit.articles[bundle] = Number(firstDigit.articles[bundle]) + Number(forFirstDigit)
            parentFirstDigit.articles[bundle] = Number(parentFirstDigit.articles[bundle]) + Number(remaingForParent)
            firstDigit.markModified('articles');
            // await firstDigit.save()
            if (remaingForParent > 0) {
                parentFirstDigit.markModified('articles');
                // await parentFirstDigit.save()
            }

            remaingForParent = (Number(secondDigit.articles[bundle]) + Number(second)) - secondLimitOfDraw
            let forSecondDigit = second
            if (remaingForParent > 0) {
                forSecondDigit = second - remaingForParent
            }
            secondDigit.articles[bundle] = Number(secondDigit.articles[bundle]) + Number(forSecondDigit)
            parentSecondDigit.articles[bundle] = Number(parentSecondDigit.articles[bundle]) + Number(remaingForParent)
            secondDigit.markModified('articles');
            // await secondDigit.save()
            if (remaingForParent > 0) {
                parentSecondDigit.markModified('articles');
                // await parentSecondDigit.save()
            }
            user.balance = user.balance + (Number(first) + Number(second))
            purchasedFromDrawData.savedPurchases = purchasedFromDrawData.savedPurchases.filter(purs => purs._id != purchase._id)
        }
        let savePromises = [];
        Object.values(fetchedDigits).forEach(digit => {
            if (digit.isModified()) { // Check if any modifications were made
                savePromises.push(digit.save());
            }
        });
        await Promise.all(savePromises);
        let updatedUser = await user.save()
        res.status(200).send({ message: "Success", user: updatedUser });
    } catch (err) {
        console.log(err)
        res.status(500).send({ message: "Error", err });
    }
};

const makeBulkPurchase = async (req, res) => {
    let { draw_id, user_id, purchases, message } = req.body
    try {
        let user = await User.findById(user_id);
        let parentUser = await getTheMainCreatorOfUser(user._id.toString())
        let purchasedFromDrawData = user.purchasedFromDrawData.find(data => data.drawId == draw_id)
        if (!purchasedFromDrawData) {

            user.purchasedFromDrawData.push({
                drawId: draw_id,
                savedPurchases: [],
                savedOversales: []
            })
            purchasedFromDrawData = user.purchasedFromDrawData.find(data => data.drawId == draw_id)
        }

        let fetchedDigits = {};
        let inSufCount = 0
        for (const purchase of purchases) {
            let bundle = purchase.bundle
            let first = purchase.first
            let second = purchase.second

            let parentData = getFirstAndSecondDigitRefs(bundle, parentUser.toObject())
            let firstDigit = fetchedDigits[purchase.firstDigitId] || await Digit.findById(purchase.firstDigitId);
            let secondDigit = fetchedDigits[purchase.secondDigitId] || await Digit.findById(purchase.secondDigitId);
            let parentFirstDigit = fetchedDigits[parentData.firstDigit.toString()] || await Digit.findById(parentData.firstDigit.toString());
            let parentSecondDigit = fetchedDigits[parentData.secondDigit.toString()] || await Digit.findById(parentData.secondDigit.toString());

            // Store fetched digits in the fetchedDigits object
            fetchedDigits[purchase.firstDigitId] = firstDigit;
            fetchedDigits[purchase.secondDigitId] = secondDigit;
            fetchedDigits[parentData.firstDigit.toString()] = parentFirstDigit;
            fetchedDigits[parentData.secondDigit.toString()] = parentSecondDigit;

            let overFirst = 0, overSecond = 0;
            if (first > Number(firstDigit.articles[bundle]) + Number(parentFirstDigit.articles[bundle])) {
                overFirst = first - Number(firstDigit.articles[bundle]) + Number(parentFirstDigit.articles[bundle])
                first = first - overFirst
            }
            if (second > Number(secondDigit.articles[bundle]) + Number(parentSecondDigit.articles[bundle])) {
                overSecond = second - Number(secondDigit.articles[bundle]) + Number(parentSecondDigit.articles[bundle])
                second = second - overSecond
            }
            if (user.balance < Number(first) + Number(second)) {
                // console.log("Balance: "+user.balance, "first: "+first, "second: "+second )
                inSufCount++
                continue
            }
            if (overFirst > 0 || overSecond > 0) {
                purchasedFromDrawData.savedOversales.push({ bundle, first: overFirst, second: overSecond })
            }
            purchasedFromDrawData.savedPurchases.push({ bundle, first, second })
            user.balance = user.balance - (Number(first) + Number(second))

            if (parentFirstDigit.articles[bundle] > 0) {
                if (parentFirstDigit.articles[bundle] >= first) {
                    parentFirstDigit.articles[bundle] = parentFirstDigit.articles[bundle] - first
                    parentFirstDigit.markModified('articles');
                } else {
                    let remaingPurchaseFirst = first - parentFirstDigit.articles[bundle]
                    parentFirstDigit.articles[bundle] = 0
                    parentFirstDigit.markModified('articles');
                    firstDigit.articles[bundle] = firstDigit.articles[bundle] - remaingPurchaseFirst
                    firstDigit.markModified('articles');
                }
            } else {
                firstDigit.articles[bundle] = firstDigit.articles[bundle] - first
                firstDigit.markModified('articles');
            }
            //second digit
            if (parentSecondDigit.articles[purchase.bundle] > 0) {
                if (parentSecondDigit.articles[bundle] >= second) {
                    parentSecondDigit.articles[bundle] = parentSecondDigit.articles[bundle] - second
                    parentSecondDigit.markModified('articles');
                } else {
                    let remaingPurchaseSecond = second - parentSecondDigit.articles[bundle]
                    parentSecondDigit.articles[bundle] = 0
                    parentSecondDigit.markModified('articles');
                    secondDigit.articles[bundle] = secondDigit.articles[bundle] - remaingPurchaseSecond
                    secondDigit.markModified('articles');
                }
            } else {
                secondDigit.articles[bundle] = secondDigit.articles[bundle] - second
                secondDigit.markModified('articles');
            }
        }
        let savePromises = [];
        Object.values(fetchedDigits).forEach(digit => {
            if (digit.isModified()) { // Check if any modifications were made
                savePromises.push(digit.save());
            }
        });
        await Promise.all(savePromises);
        if (user.messagesData.find(data => data.drawId == draw_id)) {
            user.messagesData.find(data => data.drawId == draw_id).messages.push(message)
        } else {
            user.messagesData.push({ drawId: draw_id, messages: [message] })
        }
        let updatedUser = await user.save()
        res.status(200).send({ message: "Success", user: updatedUser, inSufCount });
    } catch (err) {
        console.log(err)
        res.status(500).send({ message: "Error", err });
    }
}
// Delete a Digit
const deleteDigit = (req, res) => {
    const digitId = req.params.id;

    Digit.findByIdAndDelete(digitId)
        .then((deletedDigit) => {
            if (!deletedDigit) {
                return res.status(404).send({ message: "Digit not found" });
            }
            res.status(200).send({ message: "Digit deleted", deletedDigit });
        })
        .catch((err) => {
            res.status(500).send({ message: "Error", err });
        });
};

// Get all Digits
const getAllDigits = (req, res) => {
    Digit.find({})
        .then((digits) => {
            res.status(200).send({ digits });
        })
        .catch((err) => {
            res.status(500).send({ message: "Error", err });
        });
};

// Get a Digit by ID
const getDigitById = (req, res) => {
    const digitId = req.params.id;

    Digit.findById(digitId)
        .then((digit) => {
            if (!digit) {
                return res.status(404).send({ message: "Digit not found" });
            }
            res.status(200).send({ digit });
        })
        .catch((err) => {
            res.status(500).send({ message: "Error", err });
        });
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

const getFirstAndSecondDigitRefs = (bundle, user) => {
    let data = {
        firstDigit: '',
        secondDigit: ''
    }
    let purchaseLimit = user.purchaseLimit
    if (bundle.length == 1) {
        data.firstDigit = purchaseLimit.oneDigitFirst
        data.secondDigit = purchaseLimit.oneDigitSecond
    } else if (bundle.length == 2) {
        data.firstDigit = purchaseLimit.twoDigitFirst
        data.secondDigit = purchaseLimit.twoDigitSecond
    } else if (bundle.length == 3) {
        data.firstDigit = purchaseLimit.threeDigitFirst
        data.secondDigit = purchaseLimit.threeDigitSecond
    } else if (bundle.length == 4) {
        data.firstDigit = purchaseLimit.fourDigitFirst
        data.secondDigit = purchaseLimit.fourDigitSecond
    }
    return data
}

const getFirstAndSecond = async (req, res) => {
    const { firstDigitId, secondDigitId, bundle, askingUser } = req.body;
    try {
        let parentUser = await getTheMainCreatorOfUser(askingUser)
        let data = getFirstAndSecondDigitRefs(bundle, parentUser.toObject())
        const [firstDigit, secondDigit, parentFirstDigit, parentSecondDigit] = await Promise.all([
            Digit.findById(firstDigitId),
            Digit.findById(secondDigitId),
            Digit.findById(data.firstDigit),
            Digit.findById(data.secondDigit)
        ]);

        const combinedData = {
            firstPrice: Number(firstDigit.articles[bundle]) + Number(parentFirstDigit.articles[bundle]),
            secondPrice: Number(secondDigit.articles[bundle]) + Number(parentSecondDigit.articles[bundle]),
            bundle
        };


        res.status(200).send({ message: "Data retrieved successfully", data: combinedData });
    } catch (err) {
        console.error("Error fetching digits:");
        res.status(500).send({ message: "Error" });
    }
};

module.exports = {
    createDigit,
    updateDigit,
    deleteDigit,
    getAllDigits,
    getDigitById,
    getFirstAndSecond,
    makeBulkPurchase,
    removeBulkPurchase
};
