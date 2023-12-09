import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Table, Row, Col } from 'react-bootstrap';
import DrawAPIs from '../APIs/draws';
import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';
import { formatDate, formatTime } from '../Utils/Utils';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { useNavigate } from 'react-router-dom';

const initialDrawData = {
    title: '',
    drawDate: '',
    drawTime: '',
    drawStatus: false,
    oneDigitFirst: {price:0, digit:""},
    oneDigitSecond: {price:0, digit:""},
    twoDigitFirst: {price:0, digit:""},
    twoDigitSecond: {price:0, digit:""},
    threeDigitFirst: {price:0, digit:""},
    threeDigitSecond: {price:0, digit:""},
    fourDigitFirst: {price:0, digit:""},
    fourDigitSecond: {price:0, digit:""},
    drawExpired: false,
}

export default function DrawTime() {
    const [draws, setDraws] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newDrawData, setNewDrawData] = useState(initialDrawData);
    const [editDrawId, setEditDrawId] = useState(null); // Track the draw being edited
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [searchInput, setSearchInput] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDraws();
    }, []);

    if (!localStorageUtils.hasToken()) {
        navigate(`/login`);
    }
    if (localStorageUtils.getLoggedInUser().role != "admin") {
        navigate(`/`);
    }
    const fetchDraws = async () => {
        try {
            const response = await DrawAPIs.getAllDraws();
            setDraws(response.draws);
        } catch (error) {
            console.error("Error fetching draws", error);
        }
    };

    const handleModalOpen = () => {
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditDrawId(null); // Reset edit draw ID when closing the modal
        setModalMode('create'); // Reset modal mode
        setNewDrawData(initialDrawData);
    };

    const handleEditDraw = (drawId) => {
        const drawToEdit = draws.find(draw => draw._id === drawId);
        setEditDrawId(drawId);
        setModalMode('edit');
        setNewDrawData({ ...initialDrawData, ...drawToEdit });
        handleModalOpen();
    };

    const handleCreateOrUpdateDraw = async () => {
        try {
            if (!newDrawData.title || !newDrawData.drawDate || !newDrawData.drawTime) {
                alert('Please fill in all the required fields');
                return;
            }

            let res;
            if (modalMode === 'create') {
                res = await DrawAPIs.createDraw(newDrawData);
            } else if (modalMode === 'edit' && editDrawId) {
                res = await DrawAPIs.updateDraw(newDrawData);
            }

            if (res) {
                handleModalClose();
                alert(modalMode === 'create' ? 'New Draw Successfully created' : 'Draw Successfully updated');
                fetchDraws();
            }
        } catch (error) {
            console.error(`Error ${modalMode === 'create' ? 'creating' : 'updating'} draw`, error);
        }
    };

    const filteredDraws = draws.filter(draw => {
        return draw.title.toLowerCase().includes(searchInput.toLowerCase());
    });

    const disableDraw = async (draw) => {
        try {
            await DrawAPIs.updateDraw({ ...draw, drawStatus: false });
            const newDraws = draws.map(drawF => {
                return drawF._id === draw._id ? { ...drawF, drawStatus: false } : drawF
            });
            setDraws(newDraws)
        } catch (e) {
            alert("Could not disable draw")
        }
    }
    const activateDraw = async (draw) => {
        try {
            await DrawAPIs.updateDraw({ ...draw, drawStatus: true });
            const newDraws = draws.map(drawF => {
                return drawF._id === draw._id ? { ...drawF, drawStatus: true } : drawF
            });
            setDraws(newDraws)
        } catch (e) {
            alert("Could not activate draw")

        }
    }

    function getDrawStatusData(draw) {
        if (draw.drawStatus && !draw.drawExpired)
            return <td style={{ color: 'blue' }}>Active</td>
        else if (draw.drawExpired)
            return <td style={{ color: 'red' }}>Expired</td>
        else
            return <td style={{ color: 'red' }}>Disabled</td>
    }

    return (
        <div className='m-3'>
            <SearchDivBackgroundDiv>
                <h3 className="text-center">Draws</h3>
                <hr />
                <div className='d-flex justify-content-between'>
                    <Form.Control
                        type="text"
                        placeholder={"Search"}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={{ width: '70%', marginRight: '3px' }}
                    />
                </div>
            </SearchDivBackgroundDiv>

            <div className='d-flex justify-content-end'>
                <Button variant="primary btn btn-sm" onClick={handleModalOpen} className="mt-3">
                    Create Draw
                </Button>
            </div>
            <Table striped hover size="sm" className="mt-3" style={{ fontSize: '0.8rem' }}>
                <thead>
                    <tr>
                        <th>Draw Title</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>One Digit (A)</th>
                        <th>One Digit (B)</th>
                        <th>Two Digit (A)</th>
                        <th>Two Digit (B)</th>
                        <th>Three Digit (A)</th>
                        <th>Three Digit (B)</th>
                        <th>Four Digit (A)</th>
                        <th>Four Digit (B)</th>
                        <th>Actions</th>

                    </tr>
                </thead>
                <tbody>
                    {filteredDraws.map(draw => (
                        <tr key={draw._id} >
                            <td>{draw.title}</td>
                            <td>{`${formatDate(draw.drawDate)} ${formatTime(draw.drawTime)}`}</td>
                            {getDrawStatusData(draw)}
                            <td>{draw.oneDigitFirst.price}</td>
                            <td>{draw.oneDigitSecond.price}</td>
                            <td>{draw.twoDigitFirst.price}</td>
                            <td>{draw.twoDigitSecond.price}</td>
                            <td>{draw.threeDigitFirst.price}</td>
                            <td>{draw.threeDigitSecond.price}</td>
                            <td>{draw.fourDigitFirst.price}</td>
                            <td>{draw.fourDigitSecond.price}</td>
                            <td>
                                <div className='d-flex justify-content-between'>
                                    {!draw.drawExpired &&
                                        <Button variant="primary btn btn-sm" onClick={() => handleEditDraw(draw._id)}>Edit</Button>
                                    }
                                    {draw.drawExpired ?
                                        <Button variant="danger btn btn-sm" disabled={true}>Expired</Button>
                                        :
                                        draw.drawStatus ?
                                            <Button variant="danger btn btn-sm" onClick={() => disableDraw(draw)}>Disable</Button>
                                            :
                                            <Button variant="primary btn btn-sm" onClick={() => activateDraw(draw)}>Activate</Button>
                                    }
                                </div>
                            </td>

                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={handleModalClose} >
                <Modal.Header closeButton>
                    <Modal.Title>{modalMode === 'create' ? 'Create Draw' : 'Edit Draw'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form style={{ fontSize: '0.8rem' }}>
                        <Row>
                            <Col>
                                <Form.Group controlId="formTitle">
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter title"
                                        value={newDrawData.title}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, title: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formDrawDate">
                                    <Form.Label>Draw Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        placeholder="Enter draw date"
                                        value={newDrawData.drawDate}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, drawDate: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formDrawTime">
                                    <Form.Label>Draw Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        placeholder="Enter draw time"
                                        value={newDrawData.drawTime}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, drawTime: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group controlId="formDrawStatus">
                            <Form.Check
                                type="checkbox"
                                label="Draw Status"
                                checked={newDrawData.drawStatus}
                                onChange={(e) => setNewDrawData({ ...newDrawData, drawStatus: e.target.checked })}
                            />
                        </Form.Group>
                        <Row>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formOneDigitFirst">
                                    <Form.Label>One Digit First</Form.Label>
                                    <Form.Control
                                        type="Number"
                                        placeholder={0}
                                        value={newDrawData.oneDigitFirst.price}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, oneDigitFirst: {...newDrawData.oneDigitFirst , price:Number(e.target.value)} })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formOneDigitSecond">
                                    <Form.Label>One Digit Second</Form.Label>
                                    <Form.Control
                                        type="Number"
                                        placeholder={0}
                                        value={newDrawData.oneDigitSecond.price}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, oneDigitSecond: {...newDrawData.oneDigitSecond ,price:Number(e.target.value)} })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formTwoDigitFirst">
                                    <Form.Label>Two Digit First</Form.Label>
                                    <Form.Control
                                        type="Number"
                                        placeholder={0}
                                        value={newDrawData.twoDigitFirst.price}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, twoDigitFirst: {...newDrawData.twoDigitFirst , price:Number(e.target.value)} })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formTwoDigitSecond">
                                    <Form.Label>Two Digit Second</Form.Label>
                                    <Form.Control
                                        type="Number"
                                        placeholder={0}
                                        value={newDrawData.twoDigitSecond.price}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, twoDigitSecond: {...newDrawData.twoDigitSecond ,price:Number(e.target.value)} })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formThreeDigitFirst">
                                    <Form.Label>Three Digit First</Form.Label>
                                    <Form.Control
                                        type="Number"
                                        placeholder={0}
                                        value={newDrawData.threeDigitFirst.price}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, threeDigitFirst: {...newDrawData.threeDigitFirst ,price:Number(e.target.value)} })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formThreeDigitSecond">
                                    <Form.Label>Three Digit Second</Form.Label>
                                    <Form.Control
                                        type="Number"
                                        placeholder={0}
                                        value={newDrawData.threeDigitSecond.price}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, threeDigitSecond: {...newDrawData.threeDigitSecond ,price:Number(e.target.value)} })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formFourDigitFirst">
                                    <Form.Label>Four Digit First</Form.Label>
                                    <Form.Control
                                        type="Number"
                                        placeholder={0}
                                        value={newDrawData.fourDigitFirst.price}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, fourDigitFirst: {...newDrawData.fourDigitFirst ,price:Number(e.target.value)}})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formFourDigitSecond">
                                    <Form.Label>Four Digit Second</Form.Label>
                                    <Form.Control
                                        type="Number"
                                        placeholder={0}
                                        value={newDrawData.fourDigitSecond.price}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, fourDigitSecond: {...newDrawData.fourDigitSecond ,price:Number(e.target.value)} })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleCreateOrUpdateDraw}>
                        {modalMode === 'create' ? 'Create Draw' : 'Update Draw'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
