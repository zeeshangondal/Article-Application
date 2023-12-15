const Digit = require("../Models/Digit");
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

// Update an existing Digit
const updateDigit = async (req, res) => {
    let { firstDigitId, secondDigitId, bundle, purchaseFirst, purchaseSecond, type,askingUser } = req.body;
    purchaseFirst = Number(purchaseFirst)
    purchaseSecond = Number(purchaseSecond)
    try {
        let parentUser=await getTheMainCreatorOfUser(askingUser)
        let data=getFirstAndSecondDigitRefs(bundle, parentUser.toObject())     

        const [firstDigit, secondDigit, parentFirstDigit, parentSecondDigit] = await Promise.all([
            Digit.findById(firstDigitId),
            Digit.findById(secondDigitId),
            Digit.findById(data.firstDigit),
            Digit.findById(data.secondDigit)
        ]);
        
        if (type === "+") {
            firstDigit.articles[bundle] = Number(firstDigit.articles[bundle]) + Number(purchaseFirst)
            secondDigit.articles[bundle] = Number(secondDigit.articles[bundle]) + Number(purchaseSecond)
        } else if (type === "-") {
            if(parentFirstDigit.articles[bundle] >0 ){
                if(parentFirstDigit.articles[bundle] >= purchaseFirst){
                    parentFirstDigit.articles[bundle] = parentFirstDigit.articles[bundle] - purchaseFirst
                    parentFirstDigit.markModified('articles');                    
                    await parentFirstDigit.save()
                }else{
                    let remaingPurchaseFirst=purchaseFirst- parentFirstDigit.articles[bundle]
                    parentFirstDigit.articles[bundle] =0
                    parentFirstDigit.markModified('articles');
                    await parentFirstDigit.save()             
                    firstDigit.articles[bundle] = firstDigit.articles[bundle] - remaingPurchaseFirst
                    firstDigit.markModified('articles');
                    await firstDigit.save()
                }
            }else{
                firstDigit.articles[bundle] = firstDigit.articles[bundle] - purchaseFirst
                firstDigit.markModified('articles');
                await firstDigit.save()
            }
            
            //second digit
            if(parentSecondDigit.articles[bundle] >0 ){
                if(parentSecondDigit.articles[bundle] >= purchaseSecond){
                    parentSecondDigit.articles[bundle] = parentSecondDigit.articles[bundle] - purchaseSecond
                    parentSecondDigit.markModified('articles');                    
                    await parentSecondDigit.save()
                }else{
                    let remaingPurchaseSecond=purchaseSecond- parentSecondDigit.articles[bundle]
                    parentSecondDigit.articles[bundle] =0
                    parentSecondDigit.markModified('articles');
                    await parentSecondDigit.save()             
                    secondDigit.articles[bundle] = secondDigit.articles[bundle] - remaingPurchaseSecond
                    secondDigit.markModified('articles');
                    await secondDigit.save()
                }
            }else{
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
};

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
            askingUser=mainCreator.creator.toString()
        }
    } catch (e) {
    }
}

const getFirstAndSecondDigitRefs=(bundle,user)=>{
    let data={
        firstDigit:'',
        secondDigit:''
    }
    let purchaseLimit=user.purchaseLimit
    if(bundle.length==1){
        data.firstDigit=purchaseLimit.oneDigitFirst
        data.secondDigit=purchaseLimit.oneDigitSecond        
    }else if(bundle.length==2){
        data.firstDigit=purchaseLimit.twoDigitFirst
        data.secondDigit=purchaseLimit.twoDigitSecond        
    }else if(bundle.length==3){
        data.firstDigit=purchaseLimit.threeDigitFirst
        data.secondDigit=purchaseLimit.threeDigitSecond        
    }else if(bundle.length==4){
        data.firstDigit=purchaseLimit.fourDigitFirst
        data.secondDigit=purchaseLimit.fourDigitSecond        
    }
    return data
}

const getFirstAndSecond = async (req, res) => {
    const { firstDigitId, secondDigitId, bundle, askingUser } = req.body;
    try {
        let parentUser=await getTheMainCreatorOfUser(askingUser)
        let data=getFirstAndSecondDigitRefs(bundle, parentUser.toObject())     
        const [firstDigit, secondDigit, parentFirstDigit, parentSecondDigit] = await Promise.all([
            Digit.findById(firstDigitId),
            Digit.findById(secondDigitId),
            Digit.findById(data.firstDigit),
            Digit.findById(data.secondDigit)
        ]);
        
        const combinedData = {
            firstPrice: Number(firstDigit.articles[bundle]) + Number(parentFirstDigit.articles[bundle]),
            secondPrice: Number(secondDigit.articles[bundle])+ Number(parentSecondDigit.articles[bundle]),
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
    getFirstAndSecond
};
