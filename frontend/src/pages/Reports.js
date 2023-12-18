import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Nav, Form, FormGroup, Button, Card } from 'react-bootstrap';
import DrawAPIs from '../APIs/draws';
import APIs from '../APIs/users';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { Link, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import CustomNotification from '../components/CustomNotification';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { savePdfOnBackend } from '../APIs/utils';

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



    const generateTotalSheetSaleInvoice = async () => {
        let drawData = savedPurchasesInDraw.find(data => data._id === totalSheetSaleForm.sheetNo);
        let savedPurchases = drawData.savedPurchases;

        let parts = 4;
        let chunkSize = Math.ceil(savedPurchases.length / parts);
        let dividedArrays = [];

        for (let i = 0; i < savedPurchases.length; i += chunkSize) {
            dividedArrays.push(savedPurchases.slice(i, i + chunkSize));
        }

        const pdfDoc = new jsPDF();

        const columns = ['Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd'];

        pdfDoc.setFontSize(20);
        // Two centered headings
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.text("Total Sheet Sale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });

        let newData = [];
        let totalFirst = 0, totalSecond = 0, total = 0;
        for (let i = 0; i < savedPurchases.length / 4; i++) {
            let row = [];
            dividedArrays.forEach(array => {
                if (array[i]) {
                    row.push(array[i].bundle)
                    row.push(array[i].first)
                    row.push(array[i].second)
                    totalFirst += array[i].first
                    totalSecond += array[i].second
                }
            });
            newData.push(row);
        }
        total = totalFirst + totalSecond
        // Convert the data to a format compatible with jsPDF autoTable
        let bodyData = newData;

        pdfDoc.setFontSize(10);
        pdfDoc.text("Sheet: " + drawData.sheetName, 15, 30);
        // Text above the table on the right with adjusted font size
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 15, 30, { align: 'right' });

        // Add a table to the PDF
        pdfDoc.autoTable({
            head: [columns],
            body: bodyData,
            theme: 'striped',
            margin: { top: 34 }, // Adjusted top margin to leave space for the headings and texts
            columnStyles: {
                0: { fillColor: [192, 192, 192] },
                3: { fillColor: [192, 192, 192] },
                6: { fillColor: [192, 192, 192] },
                9: { fillColor: [192, 192, 192] }
            },
        });

        pdfDoc.setFontSize(10);
        pdfDoc.text("Total First: " + totalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total Second: " + totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total: " + total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);

        // Add a new page for the Oversales content
        pdfDoc.addPage();

        let savedOversales = drawData.savedOversales;

        chunkSize = Math.ceil(savedPurchases.length / parts);
        dividedArrays = [];

        for (let i = 0; i < savedOversales.length; i += chunkSize) {
            dividedArrays.push(savedOversales.slice(i, i + chunkSize));
        }

        // Move the cursor down to leave space for the Oversales headings and table
        pdfDoc.setFontSize(15);

        // Two centered headings for Oversales
        pdfDoc.text("Oversales", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        newData = [];

        totalFirst = 0;
        totalSecond = 0;
        total = 0;
        for (let i = 0; i < savedOversales.length / 4; i++) {
            let row = [];
            dividedArrays.forEach(array => {
                if (array[i]) {
                    row.push(array[i].bundle)
                    row.push(array[i].first)
                    row.push(array[i].second)
                    totalFirst += array[i].first
                    totalSecond += array[i].second
                }
            });
            newData.push(row);
        }
        total = totalFirst + totalSecond

        // Convert the data to a format compatible with jsPDF autoTable
        bodyData = newData;
        // Add a table to the PDF
        pdfDoc.autoTable({
            head: [columns],
            body: bodyData,
            theme: 'striped',
            margin: { top: 15 }, // Adjusted top margin to leave space for the headings and texts
            columnStyles: {
                0: { fillColor: [192, 192, 192] },
                3: { fillColor: [192, 192, 192] },
                6: { fillColor: [192, 192, 192] },
                9: { fillColor: [192, 192, 192] }
            },
        });
        pdfDoc.setFontSize(10);
        pdfDoc.text("Total First: " + totalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total Second: " + totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total: " + total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
        const filename = 'sample.pdf';
        // pdfDoc.save(filename);
        const pdfContent = pdfDoc.output(); // Assuming pdfDoc is defined somewhere
        const formData = new FormData();
        formData.append('pdfContent', new Blob([pdfContent], { type: 'application/pdf' }));
        try {
            await savePdfOnBackend(formData);
        } catch (error) {
        }
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