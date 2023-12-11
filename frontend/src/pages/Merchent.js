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
            let filteredDraws = response.draws.filter(draw => draw.drawStatus == true)
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
    const updateCurrentLoggedInUser = async () => {
        await APIs.updateUser(currentLoggedInUser)
        await fetchLoggedInUser()
    }
    const handlePurchaseOne = async () => {
        let { bundle, first, second } = form
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
        await articlesAPI.updateDigit(data)
        handleBundleChange(bundle)

        updateCurrentLoggedInUser()
        successMessage("Purchased saved")
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
            await articlesAPI.updateDigit(data)
            handleBundleChange(target.bundle)
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
            askingUser: localStorageUtils.getLoggedInUser()._id
        };

        if (bundle.length > 0) {
            if (bundle.length === 1) {
                data.firstDigitId = currentDraw.oneDigitFirst.digit;
                data.secondDigitId = currentDraw.oneDigitSecond.digit;
            } else if (bundle.length === 2) {
                data.firstDigitId = currentDraw.twoDigitFirst.digit;
                data.secondDigitId = currentDraw.twoDigitSecond.digit;
            } else if (bundle.length === 3) {
                data.firstDigitId = currentDraw.threeDigitFirst.digit;
                data.secondDigitId = currentDraw.threeDigitSecond.digit;
            } else if (bundle.length === 4) {
                data.firstDigitId = currentDraw.fourDigitFirst.digit;
                data.secondDigitId = currentDraw.fourDigitSecond.digit;
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
                <Table striped hover size="sm" className="mt-1" style={{ fontSize: '0.8rem' }}>
                    <thead>
                        <tr>
                            <th>Bundle</th>
                            <th>First</th>
                            <th>Second</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {savedPurchases.map(purchase => (
                            <tr key={purchase._id} >
                                <td>{purchase.bundle}</td>
                                <td>{purchase.first}</td>
                                <td>{purchase.second}</td>
                                <td>
                                    <div className='d-flex justify-content-between'>
                                        <Button variant="primary btn btn-sm btn-danger" onClick={() => handleRemovingSavedPurchase(purchase._id)}>Remove</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
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
                                        <Button variant='primary btn' onClick={handlePurchaseOne} disabled={!form.bundle || !form.first || !form.second}>
                                            Add
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                </Modal.Footer>
            </Modal>

        </div>
    );
}
