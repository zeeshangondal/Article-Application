import React, { useEffect, useState } from 'react'
import { Row, Col, Nav, Form, FormGroup, Button, Card, Table } from 'react-bootstrap';
import DrawAPIs from '../APIs/draws';
import APIs from '../APIs/users';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { useNavigate } from 'react-router-dom';
import CustomNotification from '../components/CustomNotification';
import articlesAPI from '../APIs/articles';


export default function SearchBundle() {
    const [draws, setDraws] = useState([]);
    const [currentLoggedInUser, setCurrentLoggedInUser] = useState({});
    const [subUsers, setSubUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedDraw, setSelectedDraw] = useState(null)
    const [selectedDrawDate, setSelectedDrawDate] = useState('')
    const [bundle, setBundle] = useState(null)
    const [searchedResults, setSearchedResults] = useState([])
    const [targetSheetData, setTargetSheetData] = useState(null)

    const [notification, setNotification] = useState({
        color: "",
        message: "Success",
        show: false,
    })
    const navigate = useNavigate();

    if (!localStorageUtils.hasToken()) {
        navigate(`/login`);
    }
    useEffect(() => {
        fetchLoggedInUser();
        fetchSubUsersOf()
        fetchDraws();
    }, []);

    const fetchLoggedInUser = async () => {
        try {
            const response = await APIs.getAllUsers();
            let tempUser = response.users.find(user => user._id == localStorageUtils.getLoggedInUser()._id);
            setCurrentLoggedInUser(tempUser);
            localStorageUtils.setLoggedInUser(JSON.stringify(tempUser));
        } catch (error) {
            console.error('Error fetching users');
        }
    };
    const fetchSubUsersOf = async () => {
        try {
            const response = await APIs.getAllUsers();
            setAllUsers(response.users)
            let subUsers = response.users.filter(user => user.role != "admin" && user.creator._id == localStorageUtils.getLoggedInUser()._id);
            setSubUsers(subUsers)
        } catch (error) {
            console.error('Error fetching users');
        }
    };

    const fetchDraws = async () => {
        try {
            const response = await DrawAPIs.getAllDraws();
            let filteredDraws = response.draws
            // let filteredDraws = response.draws.filter(draw => draw.drawStatus == false || draw.drawExpired )
            setDraws(filteredDraws);
            return filteredDraws
        } catch (error) {
            console.error("Error fetching draws", error);
        }
    };
    function successMessage(msg) {
        setNotification({ ...notification, color: "success", show: true, message: msg })
    }
    function alertMessage(msg) {
        setNotification({ ...notification, color: "danger", show: true, message: msg })
    }
    const handleDrawDateChange = (e) => {
        let date = e.target.value;
        let tempDraw = draws.find(draw => draw.drawDate == date)
        if (!tempDraw) {
            alertMessage("No Record of Draw")
            return
        }
        setSelectedDraw(tempDraw)
        setSelectedDrawDate(date)
    }


    async function fetchAllUsers() {
        try {
            const response = await APIs.getAllUsers();
            setAllUsers(response.users);
            // Rest of your code that should proceed after setting all users

        } catch (error) {
            // Handle any errors that may occur during the API call
            console.error("Error fetching users:", error);
        }
    }

    const handleBundleChange = (e) => {
        let tempBundle = e.target.value
        if (!isValidBundle(tempBundle)) {
            return
        }
        fetchAllUsers()
        setBundle(tempBundle)
        fetchLoggedInUser();
        fetchSubUsersOf()
        fetchDraws();
        searchAndDisplayResult(tempBundle)
    }
    const isParentOf = (parentUserId, targetUserId) => {
        const findUserById = (userId) => allUsers.find(user => user._id === userId);
        const isDescendant = (ancestor, descendant) => {
            if (!descendant.creator || !ancestor) {
                return false;
            }
            if (descendant.creator._id === ancestor._id) {
                return true;
            }
            return isDescendant(ancestor, findUserById(descendant.creator._id));
        };
        const parentUser = findUserById(parentUserId);
        const targetUser = findUserById(targetUserId);
        if (!parentUser || !targetUser) {
            return false;
        }
        return isDescendant(parentUser, targetUser);
    };

    const getAUser = (username) => {
        return allUsers.find(user => user.username == username)
    }
    const getBundleIn = (bundle, savedPurchases) => {
        let result = { exist: false }
        savedPurchases.forEach(purchase => {
            if (purchase.bundle == bundle) {
                result = {
                    exist: true,
                    ...purchase
                }
            }
        })
        return result;
    }
    const searchAndDisplayResult = (bundle) => {
        if (currentLoggedInUser.role == "merchent") {
            let targetUser = getAUser(localStorageUtils.getLoggedInUser().username)
            let result = [];
            let savedPurchases = getTotalOfMerchentFromDraw(targetUser.username)

            let tempResult = getBundleIn(bundle, savedPurchases)
            if (tempResult.exist) {
                result = [...result, { role: targetUser.role, name: targetUser.generalInfo.name, username: targetUser.username, bundle: bundle, first: tempResult.first, second: tempResult.second }]
            }
            setSearchedResults(result)
            return
        } else if (currentLoggedInUser.role == "distributor") {
            let result = [];
            subUsers.forEach(user => {
                if (user.role == "distributor") {
                    let savedPurchases = getTotalOfDistributorFromDraw(user.username)
                    let tempResult = getBundleIn(bundle, savedPurchases)
                    if (tempResult.exist) {
                        result = [...result, { role: user.role, name: user.generalInfo.name, username: user.username, bundle: bundle, first: tempResult.first, second: tempResult.second }]
                    }
                }
                else {
                    let savedPurchases = getTotalOfMerchentFromDraw(user.username)
                    let tempResult = getBundleIn(bundle, savedPurchases)
                    if (tempResult.exist) {
                        result = [...result, { role: user.role, name: user.generalInfo.name, username: user.username, bundle: bundle, first: tempResult.first, second: tempResult.second }]
                    }
                }
            })
            let merchentsResult = result.filter(res => res.role == "merchent");
            let distributorsResult = result.filter(res => res.role == "distributor");
            let merchentsFinalResult = []
            merchentsResult.forEach(m => {
                let merchent = getAUser(m.username)
                let savedPurchasesMade = merchent.savedPurchasesFromDrawsData.filter(data => data.drawId == selectedDraw._id)
                savedPurchasesMade.forEach(savedPurchase => {
                    let purchasedData = savedPurchase.savedPurchases.filter(p => p.bundle == bundle)
                    purchasedData.forEach(purchase => {
                        merchentsFinalResult.push({
                            role: merchent.role, name: merchent.generalInfo.name, username: merchent.username, bundle: bundle, first: purchase.first, second: purchase.second,
                            sheet: { exist: true, _id: savedPurchase._id, sheetName: savedPurchase.sheetName, savedPurchases: savedPurchase.savedPurchases }
                        })
                    })
                })

                let notSavedPurchasesMade = merchent.purchasedFromDrawData.filter(data => data.drawId == selectedDraw._id)
                notSavedPurchasesMade.forEach(savedPurchase => {
                    let purchasedData = savedPurchase.savedPurchases.filter(p => p.bundle == bundle)
                    purchasedData.forEach(purchase => {
                        merchentsFinalResult.push({
                            role: merchent.role, name: merchent.generalInfo.name, username: merchent.username, bundle: bundle, first: purchase.first, second: purchase.second,
                            sheet: { exist: false }
                        })
                    })
                })

            })
            let finalResult = []
            distributorsResult.forEach(re => {
                finalResult.push(re)
            })
            merchentsFinalResult.forEach(re => {
                finalResult.push(re)
            })
            setSearchedResults(finalResult)
        } else if (currentLoggedInUser.role == "admin") {
            let result = [];
            subUsers.forEach(user => {
                let savedPurchases = getTotalOfDistributorFromDraw(user.username)
                let tempResult = getBundleIn(bundle, savedPurchases)
                if (tempResult.exist) {
                    result = [...result, { role: user.role, name: user.generalInfo.name, username: user.username, bundle: bundle, first: tempResult.first, second: tempResult.second }]
                }

            })
            setSearchedResults(result)
        }
    }
    const getTotalOfMerchentFromDraw = (username) => {
        let targetUser = getAUser(username)
        let drawDataArray = targetUser.savedPurchasesFromDrawsData.filter(data => {
            return data.drawId == selectedDraw._id
        })
        let temp = targetUser.purchasedFromDrawData.filter(data => data.drawId == selectedDraw._id)
        drawDataArray = [...drawDataArray, ...temp]

        let groupedByBundle = drawDataArray.flatMap(draw => draw.savedPurchases)
            .reduce((acc, purchase) => {
                const bundle = purchase.bundle;

                if (!acc[bundle]) {
                    acc[bundle] = { bundle, first: 0, second: 0 };
                }

                acc[bundle].first += purchase.first;
                acc[bundle].second += purchase.second;

                return acc;
            }, {});
        let savedPurchases = Object.values(groupedByBundle);
        return savedPurchases
    }
    const getTotalOfDistributorFromDraw = (username) => {
        let targetUser = getAUser(username)
        let targetsMerchents = []  //it inlcludes all kind of child merchents at any level
        allUsers.forEach(user => {
            if (user.role == "merchent" && isParentOf(targetUser._id, user._id)) {
                targetsMerchents.push(user)
            }
        })


        let drawDataArray = []
        targetsMerchents.forEach(merchent => {
            let merchentsDrawDataArray = merchent.savedPurchasesFromDrawsData.filter(data => data.drawId == selectedDraw._id)
            drawDataArray = [...drawDataArray, ...merchentsDrawDataArray]

            merchentsDrawDataArray = merchent.purchasedFromDrawData.filter(data => data.drawId == selectedDraw._id)
            drawDataArray = [...drawDataArray, ...merchentsDrawDataArray]
        })

        let groupedByBundle = drawDataArray.flatMap(draw => draw.savedPurchases)
            .reduce((acc, purchase) => {
                const bundle = purchase.bundle;

                if (!acc[bundle]) {
                    acc[bundle] = { bundle, first: 0, second: 0 };
                }

                acc[bundle].first += purchase.first;
                acc[bundle].second += purchase.second;

                return acc;
            }, {});
        let savedPurchases = Object.values(groupedByBundle);
        return savedPurchases
    }

    function isValidBundle(inputString) {
        if (inputString.length > 4) {
            return false;
        }
        if (inputString.length == 0)
            return true
        if (!/^\d+$/.test(inputString)) {
            return false;
        }
        return true;
    }

    let count = 1;
    let firstTotal = 0, secondTotal = 0;
    searchedResults.forEach(res => {
        firstTotal += res.first
        secondTotal += res.second
    })

    const handleTargetMerchentSearch = (res) => {
        if (res.role == "distributor" || !res.sheet.exist) {
            setTargetSheetData(null)
            return;
        }
        setTargetSheetData({
            user: getAUser(res.username),
            sheet: res.sheet
        })
    }
    const updateTargetUser = async (user) => {
        await APIs.updateUser(user)
    }
    const getDataForBundle = (bundle, currentDraw) => {
        let data = {
            firstDigitId: "",
            secondDigitId: "",
            bundle,
            askingUser: targetSheetData.user._id,
            firstLimitOfDraw: 0,
            secondLimitOfDraw: 0,
        };

        if (bundle.length > 0) {
            if (bundle.length === 1) {
                data.firstDigitId = currentDraw.oneDigitFirst.digit;
                data.secondDigitId = currentDraw.oneDigitSecond.digit;
                data.firstLimitOfDraw = currentDraw.oneDigitFirst.price
                data.secondLimitOfDraw = currentDraw.oneDigitSecond.price
            } else if (bundle.length === 2) {
                data.firstDigitId = currentDraw.twoDigitFirst.digit;
                data.secondDigitId = currentDraw.twoDigitSecond.digit;
                data.firstLimitOfDraw = currentDraw.twoDigitFirst.price
                data.secondLimitOfDraw = currentDraw.twoDigitSecond.price

            } else if (bundle.length === 3) {
                data.firstDigitId = currentDraw.threeDigitFirst.digit;
                data.secondDigitId = currentDraw.threeDigitSecond.digit;
                data.firstLimitOfDraw = currentDraw.threeDigitFirst.price
                data.secondLimitOfDraw = currentDraw.threeDigitSecond.price

            } else if (bundle.length === 4) {
                data.firstDigitId = currentDraw.fourDigitFirst.digit;
                data.secondDigitId = currentDraw.fourDigitSecond.digit;
                data.firstLimitOfDraw = currentDraw.fourDigitFirst.price
                data.secondLimitOfDraw = currentDraw.fourDigitSecond.price

            }
        }
        return data;
    };

    const handleRemovingPurchase = async (_id) => {
        try {
            let user = getAUser(targetSheetData.user.username)
            let purchasedData = user.savedPurchasesFromDrawsData.find(data => data.drawId == selectedDraw._id && data._id == targetSheetData.sheet._id)
            let purchases = purchasedData.savedPurchases
            let target = purchases.find(purchase => purchase._id === _id)
            let updated = purchases.filter(purchase => purchase._id !== _id)
            purchasedData.savedPurchases = [...updated]
            user.availableBalance = user.availableBalance + (Number(target.first) + Number(target.second))


            let data = getDataForBundle(target.bundle, selectedDraw)
            console.log(data)
            data = {
                ...data,
                purchaseFirst: target.first,
                purchaseSecond: target.second,
                type: "+"
            }
            successMessage("Removed Successfully")
            user = getAUser(user.username)

            // setTargetSheetData({
            //     user: user, sheet: {
            //         ...targetSheetData.sheet,
            //         savedPurchases: [...updated]
            //     }
            // })

            let updatedDataForSheetPurchases = targetSheetData.sheet.savedPurchases.filter(p => p._id !== _id)
            setTargetSheetData({
                user: user, sheet: {
                    ...targetSheetData.sheet,
                    savedPurchases: updatedDataForSheetPurchases
                }
            })

            //sheet: { exist: true, _id: savedPurchase._id, sheetName: savedPurchase.sheetName, savedPurchases: savedPurchase.savedPurchases }
            // {
            //     role: merchent.role, name: merchent.generalInfo.name, username: merchent.username, bundle: bundle, first: purchase.first, second: purchase.second,
            //     sheet: { exist: true, _id: savedPurchase._id, sheetName: savedPurchase.sheetName, savedPurchases: savedPurchase.savedPurchases }
            // }
            updateTargetUser(user)

            await articlesAPI.updateDigit(data)

            fetchAllUsers()
            fetchLoggedInUser();
            fetchSubUsersOf()
            fetchDraws();
            searchAndDisplayResult(bundle)

        } catch (e) { }

    }

    let cleanSearchedResults = searchedResults.filter(res => {
        return (res.first != 0 || res.second != 0)
    })

    console.log("Clean", cleanSearchedResults)
    return (
        <div>
            <div className='container mt-3'>
                <CustomNotification notification={notification} setNotification={setNotification} />

                <div>
                    <h4>Search Bundle</h4>
                </div>
                <hr />
                <Row lg="4">
                    <Col>
                        <Form.Label>Date</Form.Label>
                    </Col>
                    <Col>
                        <Form.Control
                            type="date"
                            name="date"
                            value={selectedDrawDate}
                            onChange={handleDrawDateChange}
                        />
                    </Col>
                </Row>
                <Row lg="4" className='mt-2'>
                    <Col>
                        <Form.Label>Bundle</Form.Label>
                    </Col>
                    <Col>
                        <Form.Control
                            type="text"
                            name="bundle"
                            value={bundle}
                            onChange={handleBundleChange}
                            disabled={!selectedDrawDate}
                        />
                    </Col>
                </Row>
                <hr />

                {cleanSearchedResults.length > 0 &&
                    <div>

                        <Table hover size="sm" className="mt-1" style={{ fontSize: '0.8rem' }}>
                            <thead>
                                <tr  >
                                    {currentLoggedInUser.role != "merchent" &&
                                        <th>#</th>
                                    }
                                    <th>Bundle</th>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>1st</th>
                                    <th>2nd</th>
                                    {localStorageUtils.getLoggedInUser().role == "distributor" &&
                                        <th>Sheet</th>
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                {currentLoggedInUser.role == "merchent" ?
                                    <>
                                        {cleanSearchedResults.map(res => (
                                            <tr>
                                                <td style={{ backgroundColor: 'orange' }}>{bundle}</td>
                                                <td style={{ backgroundColor: 'orange' }}>{res.name}</td>
                                                <td style={{ backgroundColor: 'orange' }}>{res.username}</td>
                                                <td style={{ backgroundColor: 'orange' }}> {res.first}</td>
                                                <td style={{ backgroundColor: 'orange' }}>{res.second}</td>
                                            </tr>
                                        ))}

                                    </>
                                    :
                                    <>
                                        {cleanSearchedResults.map(res => (
                                            <tr onClick={() => handleTargetMerchentSearch(res)}>
                                                <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}>{count++}</td>
                                                <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}>{bundle}</td>
                                                <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}>{res.name}</td>
                                                <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}>{res.username}</td>
                                                <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}> {res.first}</td>
                                                <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}>{res.second}</td>
                                                {res.role == "distributor" ?
                                                    <td style={{ backgroundColor: 'lightblue' }}></td>
                                                    :
                                                    <td style={{ backgroundColor: 'orange' }}>{res.sheet.exist ? res.sheet.sheetName : "Not Saved"}</td>
                                                }
                                            </tr>
                                        ))}

                                    </>}
                            </tbody>
                        </Table>

                        {currentLoggedInUser.role != "merchent" &&
                            <>
                                <div className='mt-3'>
                                    <Table striped hover size="sm" className="mt-1" style={{ fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr  >
                                                <th>Bundle</th>
                                                <th>First Total</th>
                                                <th>Second Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>{bundle}</td>
                                                <td>{firstTotal}</td>
                                                <td>{secondTotal}</td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </div>


                            </>
                        }

                        {targetSheetData &&
                            <div className='mt-3'>
                                <h4>{targetSheetData.user.username} - Sheet - {targetSheetData.sheet.sheetName}</h4>
                                <Table striped hover size="sm" className="mt-1" style={{ fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr>
                                            <th>Bundle</th>
                                            <th>First Total</th>
                                            <th>Second Total</th>
                                            <th>Remove</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {targetSheetData.sheet.savedPurchases.map(purchase => (
                                            <tr>
                                                <td>{purchase.bundle}</td>
                                                <td>{purchase.first}</td>
                                                <td>{purchase.second}</td>
                                                <td>
                                                    <Button style={{ fontSize: "0.7rem" }} variant="primary btn btn-sm btn-danger" onClick={() => handleRemovingPurchase(purchase._id)}>Remove</Button>

                                                </td>
                                            </tr>

                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                        }




                    </div>
                }

            </div>
        </div>
    )

}
