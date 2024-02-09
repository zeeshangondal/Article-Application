import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Table, Row, Col } from 'react-bootstrap';
import DrawAPIs from '../APIs/draws';
import { formatDate, formatTime } from '../Utils/Utils';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { useNavigate } from 'react-router-dom';
import CustomNotification from '../components/CustomNotification';


export default function DrawResult() {
    const [draws, setDraws] = useState([]);
    const [editDraw, setEditDraw] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [notification, setNotification] = useState({
        color: "",
        message: "Success",
        show: false,
    })
    function successMessage(msg) {
        setNotification({ ...notification, color: "success", show: true, message: msg })
    }
    function alertMessage(msg) {
        setNotification({ ...notification, color: "danger", show: true, message: msg })
    }

    const navigate = useNavigate();

    useEffect(() => {
        fetchDraws();
    }, []);

    if (!localStorageUtils.hasToken()) {
        window.location="/login"
    }
    if (localStorageUtils.getLoggedInUser().role != "admin") {
        window.location="/"
    }
    const fetchDraws = async () => {
        try {
            const response = await DrawAPIs.getAllDraws();
            const filteredDraws = response.draws.filter(draw => !draw.drawStatus || draw.drawExpired)
            setDraws(filteredDraws);
        } catch (error) {
            console.error("Error fetching draws", error);
        }
    };
    const handleModalOpen = (selectedDraw) => {
        setEditDraw(selectedDraw)
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditDraw(null);
    };

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
    function validEdits() {
        const validatePrize = (prize, name) => {
            if (prize.length === 1 || prize.length === 4) {
                if(prize.length===1 && prize!="0"){
                    alertMessage(`Invalid ${name}`);
                    return false;                        
                }
                return true
            }else{
                alertMessage(`Invalid ${name}`);
                return false;
            }
        };

        const prizes = [
            { prize: editDraw.prize.firstPrize, name: "First Prize" },
            { prize: editDraw.prize.secondPrize1, name: "Second Prize 1" },
            { prize: editDraw.prize.secondPrize2, name: "Second Prize 2" },
            { prize: editDraw.prize.secondPrize3, name: "Second Prize 3" },
            { prize: editDraw.prize.secondPrize4, name: "Second Prize 4" },
            { prize: editDraw.prize.secondPrize5, name: "Second Prize 5" },
        ];
        for (const { prize, name } of prizes) {
            if (!validatePrize(prize, name)) {
                return false;
            }
        }
        return true;
    }


    const handleDrawPrizeChange = (field, value) => {
        if (!isValidBundle(value)) {
            return
        }
        setEditDraw({
            ...editDraw,
            prize: {
                ...editDraw.prize,
                [field]: value
            }
        })
    }

    const saveDraw = async () => {
        try {
            if (!validEdits()) {
                return
            }
            await DrawAPIs.updateDraw({ ...editDraw });
            handleModalClose()
            await fetchDraws()
            successMessage("Draw Result Saved")
        } catch (e) {
            alertMessage("Draw Result Couldn't be saved")
        }
    }

    return (
        <div className='m-3'>
            <CustomNotification notification={notification} setNotification={setNotification} />

            <div className=''>
                <h3>Draw Results</h3>
                <hr />
            </div>
            <div className=''>
                <Table bordered hover size="sm" className="mt-3" style={{ fontSize: '0.8rem' }}>
                    <thead>
                        <tr>
                            {/* <th>Draw Title</th> */}
                            <th>Date</th>
                            <th>First Prize</th>
                            <th>Second Prize 1</th>
                            <th>Second Prize 2</th>
                            <th>Second Prize 3</th>
                            <th>Second Prize 4</th>
                            <th>Second Prize 5</th>
                        </tr>
                    </thead>
                    <tbody>
                        {draws.map(draw => (
                            <tr key={draw._id} >
                                {/* <td>{draw.title}</td> */}
                                <td>{`${formatDate(draw.drawDate)} ${formatTime(draw.drawTime)}`}</td>
                                <td>{draw.prize.firstPrize}</td>
                                <td>{draw.prize.secondPrize1}</td>
                                <td>{draw.prize.secondPrize2}</td>
                                <td>{draw.prize.secondPrize3}</td>
                                <td>{draw.prize.secondPrize4}</td>
                                <td>{draw.prize.secondPrize5}</td>
                                <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                                    <Button variant="primary btn btn-sm" onClick={() => handleModalOpen(draw)}>Edit</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <Modal show={showModal} onHide={handleModalClose} >
                    <Modal.Header closeButton>
                        <Modal.Title style={{ fontSize: '1.4rem' }}>Result Draw {editDraw && `${formatDate(editDraw.drawDate)} ${formatTime(editDraw.drawTime)}`}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form style={{ fontSize: '0.8rem' }}>
                            <Row>
                                <Col xs={6} md={6}>
                                    <Form.Group controlId="formDrawDate">
                                        <Form.Label>First Prize</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editDraw && editDraw.prize.firstPrize}
                                            onChange={(e) => handleDrawPrizeChange("firstPrize", e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={6} md={6}>
                                    <Form.Group controlId="formDrawDate">
                                        <Form.Label>Second Prize 1</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editDraw && editDraw.prize.secondPrize1}
                                            onChange={(e) => handleDrawPrizeChange("secondPrize1", e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={6} md={6}>
                                    <Form.Group controlId="formDrawDate">
                                        <Form.Label>Second Prize 2</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editDraw && editDraw.prize.secondPrize2}
                                            onChange={(e) => handleDrawPrizeChange("secondPrize2", e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={6} md={6}>
                                    <Form.Group controlId="formDrawDate">
                                        <Form.Label>Second Prize 3</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editDraw && editDraw.prize.secondPrize3}
                                            onChange={(e) => handleDrawPrizeChange("secondPrize3", e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={6} md={6}>
                                    <Form.Group controlId="formDrawDate">
                                        <Form.Label>Second Prize 4</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editDraw && editDraw.prize.secondPrize4}
                                            onChange={(e) => handleDrawPrizeChange("secondPrize4", e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={6} md={6}>
                                    <Form.Group controlId="formDrawDate">
                                        <Form.Label>Second Prize 5</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editDraw && editDraw.prize.secondPrize5}
                                            onChange={(e) => handleDrawPrizeChange("secondPrize5", e.target.value)}
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
                        <Button variant="primary btn btn-sm" onClick={saveDraw}>Save</Button>
                    </Modal.Footer>
                </Modal>

            </div>
        </div>
    );
}
