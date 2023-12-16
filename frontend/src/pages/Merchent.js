import React, { useState, useEffect } from 'react';
import APIs from '../APIs/users';
import articlesAPI from '../APIs/articles';

import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';
import { Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { localStorageUtils } from '../APIs/localStorageUtils';
import DrawAPIs from '../APIs/draws';
import { formatDate, formatTime } from '../Utils/Utils';
import CustomNotification from '../components/CustomNotification';


export default function Merchent() {
    const [currentLoggedInUser, setCurrentLoggedInUser] = useState({ generalInfo: { name: '' }, username: '' });
    const [showModal, setShowModal] = useState(false);
    const [showSheetModal, setShowSheetModal] = useState(false);
    const [sheetName, setSheetName] = useState('');
    const [message, setMessage] = useState('');
    const [messagePurchases, setMessagePurchases] = useState([]);

    const [draws, setDraws] = useState([]);
    const [currentDraw, setCurrentDraw] = useState(null)
    const [savedPurchases, setSavedPurchases] = useState([]);
    const [availableArticles, setAvailableArticles] = useState(null)
    const [notification, setNotification] = useState({
        color: "",
        message: "Success",
        show: false,
    })

    const [form, setForm] = useState({
        selectedDraw: '',
        bundle: '',
        first: '',
        second: '',
    });

    useEffect(() => {
        fetchLoggedInUser();
        fetchDraws();
    }, []);


    const fetchDraws = async () => {
        try {
            const response = await DrawAPIs.getAllDraws();
            let filteredDraws = response.draws.filter(draw => draw.drawStatus == true && !draw.drawExpired)
            setDraws(filteredDraws);
            return filteredDraws
        } catch (error) {
            console.error("Error fetching draws", error);
        }
    };
    const fetchLoggedInUser = async () => {
        try {
            const response = await APIs.getAllUsers();
            let tempUser = response.users.find(user => user._id == localStorageUtils.getLoggedInUser()._id);
            setCurrentLoggedInUser(tempUser);
            localStorageUtils.setLoggedInUser(JSON.stringify(tempUser));
            if (form.selectedDraw.length > 0) {
                getSavedPurchasesOfCurrentDraw(form.selectedDraw)
            }
        } catch (error) {
            console.error('Error fetching users', error);
        }
    };
    const getSavedPurchasesOfCurrentDraw = (selectedDraw) => {
        let purchasedFromDrawData = currentLoggedInUser.purchasedFromDrawData
        let purchasedDrawData = purchasedFromDrawData.find(data => data.drawId === selectedDraw)
        try {
            setSavedPurchases([...purchasedDrawData.savedPurchases])
        } catch (e) {
            setSavedPurchases([])
        }
    }
    const handleModalClose = () => {
        setShowModal(false);
    };
    const handleSheetModalClose = () => {
        setShowSheetModal(false);
    };

    const updateCurrentLoggedInUser = async () => {
        await APIs.updateUser(currentLoggedInUser)
        fetchLoggedInUser()
    }
    const handlePurchaseOne = async (bundle, first, second) => {
        let purchasedFromDrawData = currentLoggedInUser.purchasedFromDrawData
        let purchasedDrawData = purchasedFromDrawData.find(data => data.drawId === form.selectedDraw)
        if (purchasedDrawData) {
            purchasedDrawData.savedPurchases.push({
                bundle, first, second
            })
        } else {
            purchasedDrawData = {
                drawId: form.selectedDraw,
                savedPurchases: [{
                    bundle, first, second
                }]
            }
            purchasedFromDrawData.push(purchasedDrawData)
        }
        // firstDigitId, secondDigitId, bundle , purchaseFirst ,purchaseSecond, type
        let data = getDataForBundle(bundle, currentDraw)
        data = {
            ...data,
            purchaseFirst: first,
            purchaseSecond: second,
            type: "-",
            askingUser: localStorageUtils.getLoggedInUser()._id
        }
        successMessage("Purcahse added successfuly")
        await articlesAPI.updateDigit(data)
        handleBundleChange(bundle)

        updateCurrentLoggedInUser()
        setForm({ ...form, first: '', second: '' })
        // setShowModal(false);
    };
    function successMessage(msg) {
        setNotification({ ...notification, color: "", show: true, message: msg })
    }
    function alertMessage(msg) {
        setNotification({ ...notification, color: "danger", show: true, message: msg })
    }

    const handleRemovingSavedPurchase = async (_id) => {
        try {
            let purchasedData = currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId === form.selectedDraw)
            let purchases = purchasedData.savedPurchases
            let target = purchases.find(purchase => purchase._id === _id)
            let updated = purchases.filter(purchase => purchase._id !== _id)
            purchasedData.savedPurchases = [...updated]
            updateCurrentLoggedInUser()
            let data = getDataForBundle(target.bundle, currentDraw)
            data = {
                ...data,
                purchaseFirst: target.first,
                purchaseSecond: target.second,
                type: "+"
            }
            handleBundleChange(target.bundle)
            successMessage("Removed Successfully")
            await articlesAPI.updateDigit(data)
        } catch (e) { }
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

    const getDataForBundle = (bundle, currentDraw) => {
        let data = {
            firstDigitId: "",
            secondDigitId: "",
            bundle,
            askingUser: localStorageUtils.getLoggedInUser()._id,
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

    const handleBundleChange = async (bundle) => {
        if (isValidBundle(bundle)) {
            setForm({ ...form, bundle: bundle });

            if (bundle.length > 0) {
                const data = getDataForBundle(bundle, currentDraw);
                const response = await articlesAPI.getFirstAndSecond(data);
                setAvailableArticles({ ...response.data });
                return;
            }
            setAvailableArticles(null);
        }
    };

    const handleChangeDraw = async (value) => {
        setForm({ ...form, selectedDraw: value })
        if (value == '') {
            setCurrentDraw(null)
            setSavedPurchases([])
            return
        }
        let fetchedDraws = await fetchDraws()
        setCurrentDraw(fetchedDraws.find(draw => draw._id == value))
        getSavedPurchasesOfCurrentDraw(value)
    }

    const getCount = () => {
        return savedPurchases.length
    }
    const getTotalFirsts = () => {
        let total = 0
        savedPurchases.forEach((purchase) => {
            total += Number(purchase.first)
        })
        return total
    }
    const getTotalSeconds = () => {
        let total = 0
        savedPurchases.forEach((purchase) => {
            total += Number(purchase.second)
        })
        return total
    }
    const getTotalBoth = () => {
        return (getTotalFirsts() + getTotalSeconds())
    }

    const handleConfirmSavePurchases = () => {
        let purchasedFromDrawData = currentLoggedInUser.purchasedFromDrawData
        let savingPurchasedDrawData = purchasedFromDrawData.find(data => data.drawId === form.selectedDraw)
        currentLoggedInUser.purchasedFromDrawData = purchasedFromDrawData.filter(data => data.drawId != form.selectedDraw)
        delete savingPurchasedDrawData._id
        currentLoggedInUser.savedPurchasesFromDrawsData.push({ ...savingPurchasedDrawData, sheetName })
        updateCurrentLoggedInUser()
        successMessage("Sheet Saved Successfully")
        setSheetName('')
        setSavedPurchases([])
        setShowSheetModal(false)
    }

    function parseInputMessage() {
        if (message.length == 0) {
            setMessagePurchases([])
            return
        }
        try {
            let tempMessagePurchases = []
            let tempMessage = message.replace(/\s/g, '');
            let lines = tempMessage.split(",")
            lines.forEach(line => {
                let lineSplits = line.split(".")
                let second = Number((lineSplits[lineSplits.length - 1]).slice(1))
                let first = Number((lineSplits[lineSplits.length - 2]).slice(1))
                for (let i = 0; i < lineSplits.length - 2; i++) {
                    tempMessagePurchases.push({ bundle: lineSplits[i], first, second })
                }
            })
            setMessagePurchases([...tempMessagePurchases])
        } catch (e) {
            alert("Message format is invalid")
        }
    }
    const handleMakeMessagePurchases=()=>{
        let allDone=true
        messagePurchases.forEach(purchase=>{
            try{
                handlePurchaseOne(purchase.bundle,purchase.first,purchase.second)
            }catch(e){
                allDone=false
                let msg=`Due to an error couldn't add Bundle: ${purchase.bundle} First: ${purchase.first} Second: ${purchase.second}`
                alert(msg)
            }
        })
        if(allDone){
            setMessagePurchases([])
        }
        successMessage("Purchases Added")

    }
    return (
        <div className='m-3'>
            <CustomNotification notification={notification} setNotification={setNotification} />
            <SearchDivBackgroundDiv>
                <h4 className='text-center'>{`${currentLoggedInUser.generalInfo.name} - ${currentLoggedInUser.username}`}</h4>
                <hr />
                <div className='d-flex justify-content-end'>
                    <h6>Balance: {currentLoggedInUser.balance}</h6>
                </div>
            </SearchDivBackgroundDiv>
            <div className='d-flex justify-content-end mt-3 container'>
                {/* {currentDraw &&
                    <h5>{`${currentDraw.title} Expires at ${formatDate(currentDraw.drawDate)} ${formatTime(currentDraw.drawTime)}`}</h5>
                } */}
                <Button variant='primary btn btn-sm' onClick={() => setShowModal(true)}>
                    Purchase
                </Button>
            </div>

                <div className='container'>
                    <div >
                        <Table bordered hover size="sm" className="mt-2" style={{ fontSize: '0.8rem' }}>
                            <thead>
                                <tr>
                                    <th>Count</th>
                                    <th>First</th>
                                    <th>Second</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr >
                                    <td>{getCount()}</td>
                                    <td>{getTotalFirsts()}</td>
                                    <td>{getTotalSeconds()}</td>
                                    <td>{getTotalBoth()}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                    <div className='d-flex justify-content-end mt-2'>
                        <Button variant='primary btn btn-sm' onClick={() => setShowSheetModal(true)}>
                            Save
                        </Button>
                    </div>

                    <div className=''>
                        <Table striped hover size="sm" className="" style={{ fontSize: '0.8rem' }}>
                            <thead>
                                <tr>
                                    <th>Bundle</th>
                                    <th>First</th>
                                    <th>Second</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {savedPurchases.map(purchase => (
                                    <tr key={purchase._id} >
                                        <td>{purchase.bundle}</td>
                                        <td>{purchase.first}</td>
                                        <td>{purchase.second}</td>
                                        <td>
                                            <div className=''>
                                                <Button variant="primary btn btn-sm btn-danger" onClick={() => handleRemovingSavedPurchase(purchase._id)}>Remove</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>
            <Modal show={showModal} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Purchase</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form style={{ fontSize: '0.8rem' }}>
                        <Row>
                            <Col>
                                <Form.Group >
                                    {currentDraw &&
                                        <div className='d-flex justify-content-center'>
                                            <h6 style={{ fontWeight: 'normal' }}>{`Expires at ${formatDate(currentDraw.drawDate)} ${formatTime(currentDraw.drawTime)}`}</h6>
                                        </div>
                                    }
                                    <Form.Control
                                        as='select'
                                        value={form.selectedDraw}
                                        onChange={(e) => handleChangeDraw(e.target.value)}
                                    >
                                        <option value=''>Select Draw</option>
                                        {draws.map((draw) => (
                                            <option key={draw._id} value={draw._id}>
                                                {draw.title}
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className='mt-3'>
                            <div >
                                <Row>
                                    <Col xs={3} md={3}>
                                        <h6 className='text-center' style={{ fontWeight: 'normal' }}>Bundle</h6>
                                    </Col>
                                    <Col xs={3} md={3}>
                                        <h6 className='text-center' style={{ fontWeight: 'normal' }}>{availableArticles ? availableArticles.firstPrice : ""}</h6>
                                    </Col>
                                    <Col xs={3} md={3}>
                                        <h6 className='text-center' style={{ fontWeight: 'normal' }}>{availableArticles ? availableArticles.secondPrice : ""}</h6>
                                    </Col>
                                </Row>
                            </div>
                            <Row>
                                <Col xs={3} md={3}>
                                    <Form.Group >
                                        <Form.Control
                                            type='text'
                                            placeholder=''
                                            value={form.bundle}
                                            onChange={(e) => handleBundleChange(e.target.value)}
                                            disabled={currentDraw == null}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col xs={3} md={3}>
                                    <Form.Group >
                                        <Form.Control
                                            type='Number'
                                            placeholder='First'
                                            value={form.first}
                                            onChange={(e) => setForm({ ...form, first: e.target.value })}
                                            disabled={currentDraw == null}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={3} md={3}>
                                    <Form.Group >
                                        <Form.Control
                                            type='Number'
                                            placeholder='Second'
                                            value={form.second}
                                            onChange={(e) => setForm({ ...form, second: e.target.value })}
                                            disabled={currentDraw == null}

                                        />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <div xs={3} md={3}>
                                        <Button variant='primary btn' onClick={()=>handlePurchaseOne(form.bundle, form.first, form.second)} disabled={!form.bundle || !form.first || !form.second}>
                                            Add
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                        <hr />
                        <div className='mt-2'>
                            <Row>
                                <Form.Group >
                                    <Form.Control
                                        as='textarea'
                                        placeholder='Message'
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={4}
                                        disabled={currentDraw == null}
                                        autocomplete="off"
                                        spellcheck="false"
                                    />
                                </Form.Group>
                            </Row>
                        </div>
                        <div className='d-flex justify-content-end mt-2'>
                            <Button variant='primary btn' onClick={parseInputMessage} >
                                Process
                            </Button>
                        </div>
                        {messagePurchases.length > 0 &&
                            <div className=''>
                                <Table striped hover size="sm" className="" style={{ fontSize: '0.7rem' }}>
                                    <thead>
                                        <tr>
                                            <th>Bundle</th>
                                            <th>First</th>
                                            <th>Second</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {messagePurchases.map(purchase => (
                                            <tr >
                                                <td>{purchase.bundle}</td>
                                                <td>{purchase.first}</td>
                                                <td>{purchase.second}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                <div className='d-flex justify-content-end mt-2'>
                                    <Button variant='primary btn' onClick={handleMakeMessagePurchases} >
                                        Buy Bulk
                                    </Button>
                                </div>
                            </div>
                        }

                    </Form>
                </Modal.Body>
                {/* <Modal.Footer>
                </Modal.Footer> */}
            </Modal>


            <Modal show={showSheetModal} onHide={handleSheetModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Save Purchases</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form style={{ fontSize: '0.8rem' }}>
                        <Row>
                            <Col>
                                <Form.Group >
                                    <Form.Control
                                        type='text'
                                        placeholder='Sheet Name'
                                        value={sheetName}
                                        onChange={(e) => setSheetName(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <div className='d-flex justify-content-between'>
                        <Button variant='primary btn' disabled={!sheetName} onClick={handleConfirmSavePurchases}>
                            Save
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

        </div>
    );
}
