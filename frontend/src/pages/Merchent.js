import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import APIs from '../APIs/users';
import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';
import { Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { formatDate } from '../Utils/Utils';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { useNavigate } from 'react-router-dom';
import DrawAPIs from '../APIs/draws';

export default function Merchent() {
    const [currentLoggedInUser, setCurrentLoggedInUser] = useState({ generalInfo: { name: '' }, username: '' });
    const [showModal, setShowModal] = useState(false);
    const [draws, setDraws] = useState([]);

    const [form, setForm] = useState({
        selectedOption: '',
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
        // Add logic for creating or updating draw
        // You can access the updated state using newDrawData
        // Add your logic here
        // ...
        // Close the modal
        setShowModal(false);
    };
    const handleBundleChange=(bundle)=>{
        setForm({...form,bundle:bundle})
        if(form.selectedOption.length>0){
            console.log(form.selectedOption)
        }
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
                                    <Form.Control
                                        as='select'
                                        value={form.selectedOption}
                                        onChange={(e) => setForm({ ...form, selectedOption: e.target.value })}
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
                            <h6 style={{ fontWeight: 'normal' }}>Bundle</h6>
                            <Row>
                                <Col xs={3} md={3}>
                                    <Form.Group >
                                        <Form.Control
                                            type='text'
                                            placeholder=''
                                            value={form.bundle}
                                            onChange={(e) => handleBundleChange(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col xs={3} md={3}>
                                    <Form.Group >
                                        <Form.Control
                                            type='text'
                                            placeholder=''
                                            value={form.first}
                                            onChange={(e) => setForm({ ...form, first: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={3} md={3}>
                                    <Form.Group >
                                        <Form.Control
                                            type='text'
                                            placeholder=''
                                            value={form.second}
                                            onChange={(e) => setForm({ ...form, second: e.target.value })}
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
