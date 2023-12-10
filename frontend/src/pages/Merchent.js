import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import APIs from '../APIs/users';
import articlesAPI from '../APIs/articles';

import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';
import { Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { useNavigate } from 'react-router-dom';
import DrawAPIs from '../APIs/draws';
import { formatDate, formatTime } from '../Utils/Utils';


export default function Merchent() {
    const [currentLoggedInUser, setCurrentLoggedInUser] = useState({ generalInfo: { name: '' }, username: '' });
    const [showModal, setShowModal] = useState(false);
    const [draws, setDraws] = useState([]);
    const [currentDraw, setCurrentDraw] = useState(null)
    const [savedPurchases, setSavedPurchases] = useState([]);
    const [availableArticles, setAvailableArticles] = useState(null)

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
        } catch (error) {
            console.error('Error fetching users', error);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleCreateOrUpdateDraw = () => {

        // setShowModal(false);
    };
    function isValidBundle(inputString) {
        // Check if the length is at most 4
        if (inputString.length > 4) {
            return false;
        }
        if(inputString.length==0)
            return true
        // Check if all characters are digits
        if (!/^\d+$/.test(inputString)) {
            return false;
        }

        return true;
    }

    const handleBundleChange = async (bundle) => {
        if (isValidBundle(bundle)) {
            setForm({ ...form, bundle: bundle })
            if (bundle.length > 0) {
                let data = {
                    firstDigitId: "",
                    secondDigitId: "",
                    bundle
                }
                if (bundle.length == 1) {
                    data.firstDigitId = currentDraw.oneDigitFirst.digit
                    data.secondDigitId = currentDraw.oneDigitSecond.digit
                } else if (bundle.length == 2) {
                    data.firstDigitId = currentDraw.twoDigitFirst.digit
                    data.secondDigitId = currentDraw.twoDigitSecond.digit
                } else if (bundle.length == 3) {
                    data.firstDigitId = currentDraw.threeDigitFirst.digit
                    data.secondDigitId = currentDraw.threeDigitSecond.digit
                } else if (bundle.length == 4) {
                    data.firstDigitId = currentDraw.fourDigitFirst.digit
                    data.secondDigitId = currentDraw.fourDigitSecond.digit
                }
                let response = await articlesAPI.getFirstAndSecond(data)
                setAvailableArticles({ ...response.data })
                return
            }
            setAvailableArticles(null)

        }
    }

    const handleChangeDraw = async (value) => {
        setForm({ ...form, selectedDraw: value })
        if (value == '') {
            setCurrentDraw(null)
            return
        }
        let fetchedDraws = await fetchDraws()
        setCurrentDraw(fetchedDraws.find(draw => draw._id == value))
    }

    return (
        <div className='m-3'>
            <SearchDivBackgroundDiv>
                <h4 className='text-center'>{`${currentLoggedInUser.generalInfo.name} - ${currentLoggedInUser.username}`}</h4>
                <hr />
                <div className='d-flex justify-content-end'>
                    <h6>Balance: {currentLoggedInUser.balance}</h6>
                </div>
            </SearchDivBackgroundDiv>
            <div className='d-flex justify-content-end'>
                <Button variant='primary btn btn-sm' className='mt-3' onClick={() => setShowModal(true)}>
                    Purchase
                </Button>
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
                                        <Button variant='primary btn' >
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
