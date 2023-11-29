import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Table, Row, Col } from 'react-bootstrap';
import DrawAPIs from '../APIs/draws';
import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';

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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDrawData, setNewDrawData] = useState(initialDrawData);
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

    const handleCreateModalOpen = () => {
        setShowCreateModal(true);
    };

    const handleCreateModalClose = () => {
        setShowCreateModal(false);
    };

    const handleCreateDraw = async () => {
        try {
            if (
                !newDrawData.title ||
                !newDrawData.drawDate ||
                !newDrawData.drawTime
            ) {
                alert("Please fill in all the required fields");
                return;
            }
            console.log(newDrawData)
            let res = await DrawAPIs.createDraw(newDrawData);
            if (res) {
                setNewDrawData(initialDrawData);
                handleCreateModalClose();
                alert("New Draw Successfully created");
                fetchDraws();
            }
        } catch (error) {
            console.error("Error creating draw", error);
        }
    };

    const filteredDraws = draws.filter(draw => {
        return draw.title.toLowerCase().includes(searchInput.toLowerCase());
    });

    return (
        <div className='m-3'>
            {/* <SearchDivBackgroundDiv>
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
            </SearchDivBackgroundDiv> */}

            <div className='d-flex justify-content-end'>
                <Button variant="primary btn btn-sm" onClick={handleCreateModalOpen} className="mt-3">
                    Create Draw
                </Button>
            </div>
            <Table striped hover size="sm" className="mt-3" style={{ fontSize: '0.8rem' }}>
                <thead>
                    <tr>
                        <th>Draw Title</th>
                        <th>Draw Date</th>
                        <th>Time</th>
                        <th>Draw Status</th>
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
                            <td>{draw.drawDate}</td>
                            <td>{draw.drawTime}</td>
                            <td>{draw.drawStatus.toString()}</td>
                            <td>{draw.oneDigitFirst}</td>
                            <td>{draw.oneDigitSecond}</td>
                            <td>{draw.twoDigitFirst}</td>
                            <td>{draw.twoDigitSecond}</td>
                            <td>{draw.threeDigitFirst}</td>
                            <td>{draw.threeDigitSecond}</td>
                            <td>{draw.fourDigitFirst}</td>
                            <td>{draw.fourDigitSecond}</td>
                            <td>
                                <Button variant="primary btn btn-sm" >View</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showCreateModal} onHide={handleCreateModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Create Draw</Modal.Title>
                </Modal.Header>
                <Modal.Body >
                    <Form style={{ fontSize: '0.8rem' }}>
                        <Form.Group controlId="formTitle">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter title"
                                value={newDrawData.title}
                                onChange={(e) => setNewDrawData({ ...newDrawData, title: e.target.value })}
                            />
                        </Form.Group>
                        <Row>
                            <Col>
                                <Form.Group controlId="formDrawDate">
                                    <Form.Label>Draw Date</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter draw date"
                                        value={newDrawData.drawDate}
                                        onChange={(e) => setNewDrawData({ ...newDrawData, drawDate: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group controlId="formDrawTime">
                                    <Form.Label>Draw Time</Form.Label>
                                    <Form.Control
                                        type="text"
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
                            <Col>
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
                            <Col>
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
                            <Col>
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
                            <Col>
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
                            <Col>
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
                            <Col>
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
                            <Col>
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
                            <Col>
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
                    <Button variant="secondary" onClick={handleCreateModalClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleCreateDraw}>
                        Create Draw
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
