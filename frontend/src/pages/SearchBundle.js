import React, { useEffect, useState } from 'react'
import { Row, Col, Nav, Form, FormGroup, Button, Card, Table } from 'react-bootstrap';
import DrawAPIs from '../APIs/draws';
import APIs from '../APIs/users';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { useNavigate } from 'react-router-dom';
import CustomNotification from '../components/CustomNotification';


export default function SearchBundle() {
    const [draws, setDraws] = useState([]);
    const [currentLoggedInUser, setCurrentLoggedInUser] = useState({});
    const [subUsers, setSubUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedDraw, setSelectedDraw] = useState(null)
    const [selectedDrawDate, setSelectedDrawDate] = useState('')
    const [bundle, setBundle] = useState(null)
    const [searchedResults, setSearchedResults] = useState([])
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
    const handleBundleChange = (e) => {
        let tempBundle = e.target.value
        if (!isValidBundle(tempBundle)) {
            return
        }
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
            setSearchedResults(result)
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

                {searchedResults.length > 0 &&
                    <div>

                        <Table hover size="sm" className="mt-1" style={{ fontSize: '0.8rem' }}>
                            <thead>
                                <tr  >
                                    <th>#</th>
                                    <th>Bundle</th>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>1st</th>
                                    <th>2nd</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchedResults.map(res => (
                                    <tr>
                                        <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}>{count++}</td>
                                        <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}>{bundle}</td>
                                        <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}>{res.name}</td>
                                        <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}>{res.username}</td>
                                        <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}> {res.first}</td>
                                        <td style={{ backgroundColor: res.role == "distributor" ? 'lightblue' : 'orange' }}>{res.second}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
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
                    </div>


                }

            </div>
        </div>
    )

}
