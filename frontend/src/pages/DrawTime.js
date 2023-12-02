import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Table, Row, Col } from 'react-bootstrap';
import DrawAPIs from '../APIs/draws';
import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';
import { formatDate, formatTime } from '../Utils/Utils';

const initialDrawData = {
    title: '',
    drawDate: '',
    drawTime: '',
    drawStatus: false,
    oneDigitFirst: 0,
    oneDigitSecond: 0,
    twoDigitFirst: 0,
    twoDigitSecond: 0,
    threeDigitFirst: 0,
    threeDigitSecond: 0,
    fourDigitFirst: 0,
    fourDigitSecond: 0,
}

export default function DrawTime() {
    const [draws, setDraws] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newDrawData, setNewDrawData] = useState(initialDrawData);
    const [editDrawId, setEditDrawId] = useState(null); // Track the draw being edited
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        fetchDraws();
    }, []);

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

    const disableDraw=async (draw)=>{
        try{
            await DrawAPIs.updateDraw({...draw,drawStatus:false});
            const newDraws = draws.map(drawF => {
                return drawF._id === draw._id? {...drawF,drawStatus:false} :drawF
            });
            setDraws(newDraws)
        }catch(e){
            alert("Could not disable draw")
        }
    }
    const activateDraw=async (draw)=>{
        try{
            await DrawAPIs.updateDraw({...draw,drawStatus:true});        
            const newDraws = draws.map(drawF => {
                return drawF._id === draw._id? {...drawF,drawStatus:true} :drawF
            });
            setDraws(newDraws)
        }catch(e){
            alert("Could not activate draw")

        }
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
                        <tr key={draw._id}>
                            <td>{draw.title}</td>
                            <td>{`${formatDate(draw.drawDate)} ${formatTime(draw.drawTime)}`}</td>
                            {draw.drawStatus ?
                                <td style={{ color: 'blue' }}>Active</td>
                                :
                                <td style={{ color: 'red' }}>Disabled</td>
                            }
                            <td>{draw.oneDigitFirst}</td>
                            <td>{draw.oneDigitSecond}</td>
                            <td>{draw.twoDigitFirst}</td>
                            <td>{draw.twoDigitSecond}</td>
                            <td>{draw.threeDigitFirst}</td>
                            <td>{draw.threeDigitSecond}</td>
                            <td>{draw.fourDigitFirst}</td>
                            <td>{draw.fourDigitSecond}</td>
                            <td>
                                <div className='d-flex justify-content-between'>
                                    <Button variant="primary btn btn-sm" onClick={() => handleEditDraw(draw._id)}>Edit</Button>
                                    {draw.drawStatus ?
                                        <Button variant="danger btn btn-sm"  onClick={()=>disableDraw(draw)}>Disable</Button>
                                        :
                                        <Button variant="primary btn btn-sm" onClick={()=>activateDraw(draw)}>Activate</Button>
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
                                        type="text"
                                        placeholder="0"
                                        value={newDrawData.oneDigitFirst}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, oneDigitFirst: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formOneDigitSecond">
                                    <Form.Label>One Digit Second</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="0"
                                        value={newDrawData.oneDigitSecond}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, oneDigitSecond: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formTwoDigitFirst">
                                    <Form.Label>Two Digit First</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="0"
                                        value={newDrawData.twoDigitFirst}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, twoDigitFirst: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formTwoDigitSecond">
                                    <Form.Label>Two Digit Second</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="0"
                                        value={newDrawData.twoDigitSecond}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, twoDigitSecond: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formThreeDigitFirst">
                                    <Form.Label>Three Digit First</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="0"
                                        value={newDrawData.threeDigitFirst}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, threeDigitFirst: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formThreeDigitSecond">
                                    <Form.Label>Three Digit Second</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="0"
                                        value={newDrawData.threeDigitSecond}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, threeDigitSecond: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formFourDigitFirst">
                                    <Form.Label>Four Digit First</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="0"
                                        value={newDrawData.fourDigitFirst}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, fourDigitFirst: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6} md={6}>
                                <Form.Group controlId="formFourDigitSecond">
                                    <Form.Label>Four Digit Second</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="0"
                                        value={newDrawData.fourDigitSecond}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, fourDigitSecond: e.target.value })}
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
