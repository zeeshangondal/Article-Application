import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Nav, Form, FormGroup, Button, Card } from 'react-bootstrap';
import DrawAPIs from '../APIs/draws';
import APIs from '../APIs/users';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { Link, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import CustomNotification from '../components/CustomNotification';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reports = () => {
    const [selectedOption, setSelectedOption] = useState("totalSheetSale");
    const [draws, setDraws] = useState([]);
    const [currentLoggedInUser, setCurrentLoggedInUser] = useState({});
    const [selectedDraw, setSelectedDraw] = useState(null)
    const [savedPurchasesInDraw, setSavedPurchasesInDraw] = useState(null)
    const [totalSheetSaleForm, setTotalSheetSaleForm] = useState({
        date: '',
        sheetNo: '',
        reportType: '',
    });
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
    const handleSelect = (selectedKey) => {
        setSelectedOption(selectedKey);
        setTotalSheetSaleForm({
            date: '',
            sheetNo: '',
            reportType: '',
        })
    };

    function successMessage(msg) {
        setNotification({ ...notification, color: "success", show: true, message: msg })
    }
    function alertMessage(msg) {
        setNotification({ ...notification, color: "danger", show: true, message: msg })
    }

    const handleTotalSheetSaleChange = (e) => {
        const { name, value } = e.target;
        if (name == "date") {
            let tempDraw = draws.find(draw => draw.drawDate == value)
            if (!tempDraw) {
                alertMessage("No Record of Draw")
                return
            }
            setSelectedDraw(tempDraw)
            let targets = currentLoggedInUser.savedPurchasesFromDrawsData.filter(draw => tempDraw._id)
            if (!targets) {
                alertMessage("You haven't purchased anything from this Draw")
                return
            }
            setSavedPurchasesInDraw(targets)
        }
        setTotalSheetSaleForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    const getTitle = () => {
        if (selectedOption === 'totalSale') return 'Total Sale';
        if (selectedOption === 'totalSheetSale') return 'Total Sheet Sale';
        return '';
    };
    const getSheetNames = () => {
        if (savedPurchasesInDraw) {
            return savedPurchasesInDraw.map(data => {
                return { _id: data._id, sheetName: data.sheetName }
            });
        }
        return []
    }


    const generateTotalSheetSaleInvoice = () => {
        let savedPurchases = savedPurchasesInDraw.find(data => data._id === totalSheetSaleForm.sheetNo).savedPurchases;
        console.log(savedPurchases)

        const parts = 4;
        const chunkSize = Math.ceil(savedPurchases.length / parts);
        const dividedArrays = [];
        
        for (let i = 0; i < savedPurchases.length; i += chunkSize) {
          dividedArrays.push(savedPurchases.slice(i, i + chunkSize));
        }

        const pdfDoc = new jsPDF();

        const columns = ['Bundle', 'First', 'Second', 'Bundle', 'First', 'Second', 'Bundle', 'First', 'Second', 'Bundle', 'First', 'Second'];

        const data = [
            { name: 'John Doe', age: 30, city: 'New York' },
            { name: 'Jane Doe', age: 25, city: 'San Francisco' },
            { name: 'Bob Smith', age: 35, city: 'Los Angeles' },
            { name: 'Alice Johnson', age: 28, city: 'Chicago' },
        ];
        const newData=[]
        for (let i = 0; i < savedPurchases.length/4; i++) {
            let row=[]
            dividedArrays.forEach(array=>{
                if(array[i]){
                    row.push(array[i].bundle)
                    row.push(array[i].first)
                    row.push(array[i].second)    
                }
            })
            newData.push(row)
          }
  


        // Convert the data to a format compatible with jsPDF autoTable
        const bodyData = newData

        // Add a table to the PDF
        pdfDoc.autoTable({
            head: [columns],
            body: bodyData,
            theme: 'striped',
            margin: { top: 10 },
        });

        // Save the PDF
        const filename = 'sample.pdf';
        pdfDoc.save(filename);
    };

    const generateTotalSheetSaleInvoicess = () => {
        let savedPurchases = savedPurchasesInDraw.find(data => data._id === totalSheetSaleForm.sheetNo).savedPurchases;

        const pdfDoc = new jsPDF();

        const columns = ['Bundle', 'First', 'Second', 'Bundle', 'First', 'Second', 'Bundle', 'First', 'Second', 'Bundle', 'First', 'Second'];

        const numRows = savedPurchases.length;
        const parts = 4;
        const rowsPerPart = Math.ceil(numRows / parts);

        const createTable = (start, end, startY) => {
            const bodyData = savedPurchases.slice(start, end).map(row => [row.bundle, row.first, row.second]);
            pdfDoc.autoTable({
                body: bodyData,
                columns: columns.map((col, index) => ({ header: col, dataKey: index })),
                startY: startY,
                theme: 'striped',
                margin: { top: 10 },
            });
        };

        let startY = 20;
        for (let part = 0; part < parts; part++) {
            const start = part * rowsPerPart;
            const end = Math.min((part + 1) * rowsPerPart, numRows);
            createTable(start, end, startY);

            if (part < parts - 1) {
                startY = pdfDoc.autoTable.previous.finalY + 10; // Add some space between tables
            }
        }

        const filename = 'totalSheetSaleInvoice.pdf';
        pdfDoc.save(filename);
    };

    return (
        <div className='container mt-4'>
            <CustomNotification notification={notification} setNotification={setNotification} />

            <h3>Reports</h3>
            <hr />
            <Row>
                {/* Left side on larger screens */}
                <Col xs={12} md={4}>
                    <Card>
                        <Card.Header className=""><b>Actions</b></Card.Header>
                        <Card.Body>
                            <Nav className="flex-column" onSelect={handleSelect}>
                                <Nav.Link eventKey="totalSale" style={{ background: (selectedOption == "totalSale" ? "lightgray" : "") }}>Total Sale</Nav.Link>
                                <Nav.Link eventKey="totalSheetSale" style={{ background: (selectedOption == "totalSheetSale" ? "lightgray" : "") }} >Total Sheet Sale</Nav.Link>
                            </Nav>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12} md={8}>
                    <Card>
                        <Card.Header className=""><b>{getTitle()}</b></Card.Header>
                        <Card.Body>
                            {selectedOption === 'totalSale' && (
                                <Form>
                                    <FormGroup>
                                        {/* Add form fields for Total Sale here */}
                                    </FormGroup>
                                </Form>
                            )}

                            {selectedOption === 'totalSheetSale' && (
                                <Form>
                                    <Row>
                                        <Col>
                                            <Form.Label>Date</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                type="date"
                                                name="date"
                                                value={totalSheetSaleForm.date}
                                                onChange={handleTotalSheetSaleChange}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className='mt-3'>
                                        <Col>
                                            <Form.Label>Sheet No</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="sheetNo"
                                                value={totalSheetSaleForm.sheetNo}
                                                onChange={handleTotalSheetSaleChange}
                                            >
                                                <option value="">-</option>
                                                {getSheetNames().map(data => (
                                                    <option value={data._id}>{data.sheetName}</option>
                                                ))}
                                            </Form.Control>
                                        </Col>
                                    </Row>

                                    <Row className='mt-3'>
                                        <Col>
                                            <Form.Label>Report</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="reportType"
                                                value={totalSheetSaleForm.reportType}
                                                onChange={handleTotalSheetSaleChange}
                                            >
                                                <option value="">-</option>
                                                <option value="withoutGroup">Without Group</option>
                                                <option value="group">Group-Wise</option>
                                            </Form.Control>
                                        </Col>
                                    </Row>
                                </Form>
                            )}
                        </Card.Body>
                        {selectedOption === 'totalSheetSale' && (
                            <Card.Footer>
                                <div className="d-flex flex-wrap justify-content-start">
                                    <Button variant="primary btn btn-sm m-1" onClick={generateTotalSheetSaleInvoice}>Invoice Report</Button>
                                    <Button variant="primary btn btn-sm m-1">Report</Button>
                                </div>
                            </Card.Footer>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Reports;
