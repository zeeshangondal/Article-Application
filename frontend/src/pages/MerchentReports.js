import React, { useEffect, useState } from 'react';
import { Row, Col, Nav, Form, FormGroup, Button, Card } from 'react-bootstrap';
import DrawAPIs from '../APIs/draws';
import APIs from '../APIs/users';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { useNavigate } from 'react-router-dom';
import CustomNotification from '../components/CustomNotification';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { savePdfOnBackend } from '../APIs/utils';
import { columnStyles, styles } from './pdfTableStyle';
import { formatNumberWithTwoDecimals, formatTime } from '../Utils/Utils';


const MerchentReports = () => {
    const [selectedOption, setSelectedOption] = useState("totalSale");
    const [draws, setDraws] = useState([]);
    const [currentLoggedInUser, setCurrentLoggedInUser] = useState({});
    const [selectedDraw, setSelectedDraw] = useState(null)
    const [savedPurchasesInDraw, setSavedPurchasesInDraw] = useState(null)
    const [allUsers, setAllUsers] = useState([]);

    const [totalSheetSaleForm, setTotalSheetSaleForm] = useState({
        date: '',
        sheetNo: '',
        category: 'combined',
        reportType: 'withoutGroup',
    });
    const [billingSheetForm, setBillingSheetForm] = useState({
        date: '',
        type: 'general',
    });

    const [totalSaleForm, setTotalSaleForm] = useState({
        date: '',
        category: 'combined',
        reportType: 'withoutGroup',
    });
    const [totalLimitSaleForm, setTotalLimitSaleForm] = useState({
        date: '',
        limitType: 'upLimit'
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


    const handleBillingSheetChange = (e) => {
        const { name, value } = e.target;
        if (name == "date") {
            let tempDraw = draws.find(draw => draw.drawDate == value)
            if (!tempDraw) {
                alertMessage("No Record of Draw")
                return
            }
            setSelectedDraw(tempDraw)
        }
        setBillingSheetForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    const handleTotalLimitSaleChange = (e) => {
        const { name, value } = e.target;
        if (name == "date") {
            let tempDraw = draws.find(draw => draw.drawDate == value)
            if (!tempDraw) {
                alertMessage("No Record of Draw")
                return
            }
            setSelectedDraw(tempDraw)
            let targets = currentLoggedInUser.savedPurchasesFromDrawsData.filter(draw => draw.drawId == tempDraw._id)
            if (!targets) {
                alertMessage("You haven't purchased anything from this Draw")
                return
            }
            setSavedPurchasesInDraw(targets)
        }
        setTotalLimitSaleForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };
    const fetchLoggedInUser = async () => {
        try {
            const response = await APIs.getAllUsers();
            setAllUsers(response.users)
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
            filteredDraws = [...response.draws]
            setDraws(filteredDraws);
            return filteredDraws
        } catch (error) {
            console.error("Error fetching draws", error);
        }
    };
    const handleSelect = (selectedKey) => {
        setSelectedOption(selectedKey);
        if (selectedOption != selectedKey) {
            setTotalSheetSaleForm({
                date: '',
                sheetNo: '',
                category: 'combined',
                reportType: 'withoutGroup',
            })
            setBillingSheetForm({
                date: '',
                type: 'general',
            })

            setTotalSaleForm({
                date: '',
                category: 'combined',
                reportType: 'withoutGroup',
            })
        }
    };

    function successMessage(msg) {
        setNotification({ ...notification, color: "success", show: true, message: msg })
    }
    function alertMessage(msg) {
        setNotification({ ...notification, color: "danger", show: true, message: msg })
    }

    const handleTotalSaleChange = (e) => {
        const { name, value } = e.target;
        if (name == "date") {
            let tempDraw = draws.find(draw => draw.drawDate == value )
            if (!tempDraw) {
                alertMessage("No Record of Draw")
                return
            }
            if( tempDraw.drawStatus == true || tempDraw.drawExpired){
                alertMessage("Draw is active")
                return
            }
            setSelectedDraw(tempDraw)
            let targets = currentLoggedInUser.savedPurchasesFromDrawsData.filter(draw => draw.drawId == tempDraw._id)
            if (!targets) {
                alertMessage("You haven't purchased anything from this Draw")
                return
            }
            setSavedPurchasesInDraw(targets)
        }
        setTotalSaleForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };
    const handleTotalSheetSaleChange = (e) => {
        const { name, value } = e.target;
        if (name == "date") {
            let tempDraw = draws.find(draw => draw.drawDate == value)
            if (!tempDraw) {
                alertMessage("No Record of Draw")
                return
            }
            setSelectedDraw(tempDraw)
            let targets = currentLoggedInUser.savedPurchasesFromDrawsData.filter(draw => draw.drawId == tempDraw._id)
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
        if (selectedOption === 'totalSale') return 'Total Sale Report';
        if (selectedOption === 'totalSheetSale') return 'Total Sheet Sale Report';
        if (selectedOption === 'totalLimitSale') return 'Total Share Limit Sale Report';
        if (selectedOption === 'billingSheet') return 'Bill Sheet';
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


    function processAndAddTablesInPDF(pdfDoc, savedPurchases, sorted = false, marginTop = 34) {
        savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0)

        function dividePurchasesIntoArrays(purchases, parts) {
            const chunkSize = Math.ceil(purchases.length / parts);
            let dividedArrays = [];

            if (sorted) {
                purchases = purchases.sort((a, b) => {
                    return Number('1' + a.bundle) - Number('1' + b.bundle);
                });
            }

            for (let i = 0; i < purchases.length; i += chunkSize) {
                dividedArrays.push(purchases.slice(i, i + chunkSize));
            }

            return dividedArrays;
        }

        function generateTableData(purchases, dividedArrays, totalFirst, totalSecond) {
            let tableData = [];
            let total = 0;

            for (let i = 0; i < purchases.length / 4; i++) {
                let row = [];
                dividedArrays.forEach(array => {
                    if (array[i]) {
                        row.push(array[i].bundle);
                        row.push(array[i].first);
                        row.push(array[i].second);
                        totalFirst += array[i].first;
                        totalSecond += array[i].second;
                    }
                });
                tableData.push(row);
            }

            total = totalFirst + totalSecond;
            return { tableData, total, totalFirst, totalSecond };
        }

        const columns = ['Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd'];
        let bodyData = [];
        var wtotalFirst = 0, wtotalSecond = 0, wtotal = 0;

        function generateSectionReport(purchases, dividedArrays, totalFirst, totalSecond) {
            if (purchases.length > 0) {
                let sectionTableData = generateTableData(purchases, dividedArrays, totalFirst, totalSecond);
                bodyData = sectionTableData.tableData;
                wtotalFirst += sectionTableData.totalFirst
                wtotalSecond += sectionTableData.totalSecond
                wtotal += sectionTableData.total

                pdfDoc.setFontSize(10);
                pdfDoc.autoTable({
                    head: [columns],
                    body: bodyData,
                    theme: 'striped',
                    margin: { top: marginTop },
                    columnStyles: {
                        ...columnStyles
                    },
                    styles: {
                        ...styles
                    }

                });
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.text("Total First: " + sectionTableData.totalFirst, 15, pdfDoc.autoTable.previous.finalY + 5);
                pdfDoc.text("Total Second: " + sectionTableData.totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 5);
                pdfDoc.text("Total: " + sectionTableData.total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 5);
                pdfDoc.setFont("helvetica", "normal");

            }
        }

        let count = 0
        let oneDigitPurchases = savedPurchases.filter(purchase => purchase.bundle.length === 1)
        if (oneDigitPurchases.length > 0) {
            let oneDigitDividedArrays = dividePurchasesIntoArrays(oneDigitPurchases, 4);
            generateSectionReport(oneDigitPurchases, oneDigitDividedArrays, 0, 0);
            count++;
        }

        let twoDigitPurchases = savedPurchases.filter(purchase => purchase.bundle.length === 2)
        if (twoDigitPurchases.length > 0) {
            let twoDigitDividedArrays = dividePurchasesIntoArrays(twoDigitPurchases, 4);
            generateSectionReport(twoDigitPurchases, twoDigitDividedArrays, 0, 0);
            count++;
        }

        let threeDigitPurchases = savedPurchases.filter(purchase => purchase.bundle.length === 3)
        if (threeDigitPurchases.length > 0) {
            let threeDigitDividedArrays = dividePurchasesIntoArrays(threeDigitPurchases, 4);
            generateSectionReport(threeDigitPurchases, threeDigitDividedArrays, 0, 0);
            count++;
        }

        let fourDigitPurchases = savedPurchases.filter(purchase => purchase.bundle.length === 4)
        if (fourDigitPurchases.length > 0) {
            let fourDigitDividedArrays = dividePurchasesIntoArrays(fourDigitPurchases, 4);
            generateSectionReport(fourDigitPurchases, fourDigitDividedArrays, 0, 0);
            count++;
        }
        if (count > 1) {
            pdfDoc.setFont("helvetica", "bold");

            pdfDoc.text("Total First: " + wtotalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.text("Total Second: " + wtotalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.text("Total: " + wtotal, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.setFont("helvetica", "normal");

        }
        return wtotal;
    }

    function getAllTotal({ savedPurchases, savedOversales, purchases, oversales }) {
        let total = 0
        if (purchases) {
            savedPurchases.forEach(purchase => (total += Number(purchase.first) + Number(purchase.second)))
        }
        if (oversales) {
            savedOversales.forEach(purchase => (total += Number(purchase.first) + Number(purchase.second)))
        }
        return total;
    }


    const generateTotalSheetSaleGroupWiseInvoice = async ({ sorted = false }) => {
        let drawData = savedPurchasesInDraw.find(data => data._id === totalSheetSaleForm.sheetNo);
        let savedPurchases = [...drawData.savedPurchases];
        let savedOversales = [...drawData.savedOversales];
        savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0)
        savedOversales = savedOversales.filter(purchase => purchase.first != 0 || purchase.second != 0)


        const pdfDoc = new jsPDF();
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        let allTotal = 0;
        if (totalSheetSaleForm.category == "combined") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: true, oversales: true })
        } else if (totalSheetSaleForm.category == "general") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: true, oversales: false })
        } else if (totalSheetSaleForm.category == "oversale") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: false, oversales: true })
        }


        if (totalSheetSaleForm.category == "combined" || totalSheetSaleForm.category == "general") {
            pdfDoc.text("Total Sheet Sale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });

        } else {
            pdfDoc.text("Total Sheet Oversale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        }
        pdfDoc.setFontSize(10);
        pdfDoc.text(currentLoggedInUser.username + ", " + selectedDraw.title + " - Sheet: " + drawData.sheetName, 15, 30);
        // Text above the table on the right with adjusted font size
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 60, 30, { align: 'right' });
        pdfDoc.text("All Total: " + allTotal, pdfDoc.internal.pageSize.width - 20, 30, { align: 'right' });


        if (totalSheetSaleForm.category == "combined" || totalSheetSaleForm.category == "general") {
            processAndAddTablesInPDF(pdfDoc, savedPurchases, sorted, 32)

        }

        if (savedOversales.length > 0 && (totalSheetSaleForm.category == "combined" || totalSheetSaleForm.category == "oversale")) {
            // Add a new page for the Oversales content
            if (totalSheetSaleForm.category == "combined") {
                pdfDoc.addPage();
                pdfDoc.setFontSize(20);
                pdfDoc.text("OverSales", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
                processAndAddTablesInPDF(pdfDoc, savedOversales, sorted, 15)
            }
            else {
                processAndAddTablesInPDF(pdfDoc, savedOversales, sorted, 32)
            }
            //pdfDoc,savedPurchases, drawData, selectedDraw, sorted = false
        }

        const filename = 'sample.pdf';
        // pdfDoc.save(filename);
        const pdfContent = pdfDoc.output(); // Assuming pdfDoc is defined somewhere
        const formData = new FormData();
        formData.append('pdfContent', new Blob([pdfContent], { type: 'application/pdf' }));
        try {
            await savePdfOnBackend(formData);
            successMessage("Report generated successfully")
        } catch (e) {
            alertMessage("Due to an error could not make report")
        }
    };


    const generateTotalSheetSaleWihtoutGroupInvoice = async ({ sorted = false }) => {
        let drawData = savedPurchasesInDraw.find(data => data._id === totalSheetSaleForm.sheetNo);
        let savedPurchases = [...drawData.savedPurchases];
        savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0)
        let savedOversales = drawData.savedOversales;
        savedOversales = savedOversales.filter(purchase => purchase.first != 0 || purchase.second != 0)

        let allTotal = 0;
        if (totalSheetSaleForm.category == "combined") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: true, oversales: true })
        } else if (totalSheetSaleForm.category == "general") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: true, oversales: false })
        } else if (totalSheetSaleForm.category == "oversale") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: false, oversales: true })
        }

        const pdfDoc = new jsPDF();

        const columns = ['Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd'];

        pdfDoc.setFontSize(20);
        // Two centered headings
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });

        if (totalSheetSaleForm.category == "combined" || totalSheetSaleForm.category == "general") {
            pdfDoc.text("Total Sheet Sale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        }
        else {
            pdfDoc.text("Total Sheet Oversale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        }

        let parts = 4;
        let chunkSize = Math.ceil(savedPurchases.length / parts);
        let dividedArrays = [];
        if (sorted) {
            savedPurchases = savedPurchases.sort((a, b) => {
                return Number('1' + a.bundle) - Number('1' + b.bundle);
            });
        }

        for (let i = 0; i < savedPurchases.length; i += chunkSize) {
            dividedArrays.push(savedPurchases.slice(i, i + chunkSize));
        }


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
        pdfDoc.text(currentLoggedInUser.username + ", " + selectedDraw.title + " - Sheet: " + drawData.sheetName, 15, 30);
        // Text above the table on the right with adjusted font size
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 60, 30, { align: 'right' });
        pdfDoc.text("All Total: " + allTotal, pdfDoc.internal.pageSize.width - 20, 30, { align: 'right' });



        if (totalSheetSaleForm.category == "combined" || totalSheetSaleForm.category == "general") {
            // Add a table to the PDF
            pdfDoc.autoTable({
                head: [columns],
                body: bodyData,
                theme: 'striped',
                margin: { top: 32 }, // Adjusted top margin to leave space for the headings and texts
                columnStyles: {
                    ...columnStyles
                },
                styles: {
                    ...styles
                }

            });
        }
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text("Total First: " + totalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total Second: " + totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total: " + total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.setFont("helvetica", "normal");


        if (savedOversales.length > 0 && (totalSheetSaleForm.category == "combined" || totalSheetSaleForm.category == "oversale")) {
            // Add a new page for the Oversales content
            if (totalSheetSaleForm.category == "combined") {
                pdfDoc.addPage();
                pdfDoc.setFontSize(20);
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.text("Oversales", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setFontSize(10);


            }

            chunkSize = Math.ceil(savedOversales.length / parts);
            dividedArrays = [];

            if (sorted) {
                savedOversales = savedOversales.sort((a, b) => {
                    return Number('1' + a.bundle) - Number('1' + b.bundle);
                });
            }
            for (let i = 0; i < savedOversales.length; i += chunkSize) {
                dividedArrays.push(savedOversales.slice(i, i + chunkSize));
            }

            // Move the cursor down to leave space for the Oversales headings and table
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
                margin: { top: totalSheetSaleForm.category == "oversale" ? 32 : 15 }, // Adjusted top margin to leave space for the headings and texts
                columnStyles: {
                    ...columnStyles
                },
                styles: {
                    ...styles
                }

            });
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.text("Total First: " + totalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.text("Total Second: " + totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.text("Total: " + total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.setFont("helvetica", "normal");

        }
        const filename = 'sample.pdf';
        // pdfDoc.save(filename);
        const pdfContent = pdfDoc.output(); // Assuming pdfDoc is defined somewhere
        const formData = new FormData();
        formData.append('pdfContent', new Blob([pdfContent], { type: 'application/pdf' }));
        try {
            await savePdfOnBackend(formData);
            successMessage("Report generated successfully")
        } catch (e) {
            alertMessage("Due to an error could not make report")
        }
    };


    const generateTotalSaleGroupWiseInvoice = async ({ sorted = false }) => {
        const pdfDoc = new jsPDF();

        pdfDoc.setFontSize(20);
        // Two centered headings
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        if (totalSaleForm.category == "oversale") {
            pdfDoc.text("Total Oversale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        }
        else {
            pdfDoc.text("Total Sale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        }



        let groupedByBundle = savedPurchasesInDraw.flatMap(draw => draw.savedPurchases)
            .reduce((acc, purchase) => {
                const bundle = purchase.bundle;

                if (!acc[bundle]) {
                    acc[bundle] = { bundle, first: 0, second: 0 };
                }

                acc[bundle].first += purchase.first;
                acc[bundle].second += purchase.second;

                return acc;
            }, {});

        // Convert the grouped object back to an array
        let savedPurchases = Object.values(groupedByBundle);
        savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0)

        groupedByBundle = savedPurchasesInDraw.flatMap(draw => draw.savedOversales)
            .reduce((acc, purchase) => {
                const bundle = purchase.bundle;

                if (!acc[bundle]) {
                    acc[bundle] = { bundle, first: 0, second: 0 };
                }

                acc[bundle].first += purchase.first;
                acc[bundle].second += purchase.second;

                return acc;
            }, {});

        // Convert the grouped object back to an array
        let savedOversales = Object.values(groupedByBundle);
        savedOversales = savedOversales.filter(purchase => purchase.first != 0 || purchase.second != 0)


        let allTotal = 0;
        if (totalSaleForm.category == "combined") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: true, oversales: true })
        } else if (totalSaleForm.category == "general") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: true, oversales: false })
        } else if (totalSaleForm.category == "oversale") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: false, oversales: true })
        }

        pdfDoc.setFontSize(10);
        pdfDoc.text(currentLoggedInUser.username + ", " + "Draw: " + selectedDraw.title, 15, 30);
        // Text above the table on the right with adjusted font size
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 60, 30, { align: 'right' });
        pdfDoc.text("All Total: " + allTotal, pdfDoc.internal.pageSize.width - 20, 30, { align: 'right' });

        if (totalSaleForm.category == "combined" || totalSaleForm.category == "general") {
            processAndAddTablesInPDF(pdfDoc, savedPurchases, sorted, 32)
        }



        if (savedOversales.length > 0) {
            if (totalSaleForm.category == "combined" || totalSaleForm.category == "oversale") {
                // Add a new page for the Oversales content
                if (totalSaleForm.category == "combined") {
                    pdfDoc.addPage();
                    pdfDoc.setFontSize(20);
                    pdfDoc.setFont("helvetica", "bold");
                    pdfDoc.text("OverSales", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
                    pdfDoc.setFont("helvetica", "normal");
                    pdfDoc.setFontSize(10);

                }
                //pdfDoc,savedPurchases, drawData, selectedDraw, sorted = false
                processAndAddTablesInPDF(pdfDoc, savedOversales, sorted, totalSaleForm.category == "oversale" ? 32 : 15)

            }
        }

        const filename = 'sample.pdf';
        // pdfDoc.save(filename);
        const pdfContent = pdfDoc.output(); // Assuming pdfDoc is defined somewhere
        const formData = new FormData();
        formData.append('pdfContent', new Blob([pdfContent], { type: 'application/pdf' }));
        try {
            await savePdfOnBackend(formData);
            successMessage("Report generated successfully")
        } catch (e) {
            alertMessage("Due to an error could not make report")
        }
    };
    const getShareValue = (price, share) => {
        return Number(((share / 100) * price).toFixed(1))
    }



    const generateTotalLimitSaleWihtoutGroup = async () => {
        let targetUser = {}
        targetUser = currentLoggedInUser
        const pdfDoc = new jsPDF();
        const columns = ['Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd'];
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.text("Total Share Limit Sale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        let groupedByBundle = savedPurchasesInDraw.flatMap(draw => draw.savedPurchases)
            .reduce((acc, purchase) => {
                const bundle = purchase.bundle;

                if (!acc[bundle]) {
                    acc[bundle] = { bundle, first: 0, second: 0 };
                }

                acc[bundle].first += purchase.first;
                acc[bundle].second += purchase.second;

                return acc;
            }, {});
        let savedPurchases = Object.values(groupedByBundle);
        savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0)
        let share = Number(targetUser.commission.share)
        let pcPercentage = Number(targetUser.commission.pcPercentage)
        let updatedSavedPurchases = []
        if (totalLimitSaleForm.limitType == "upLimit") {
            updatedSavedPurchases = savedPurchases.map(purchase => {
                let newData = { ...purchase }
                if (purchase.bundle.length == 4) {
                    newData.first = Number(newData.first) - getShareValue(Number(newData.first), pcPercentage);
                    newData.second = Number(newData.second) - getShareValue(Number(newData.second), pcPercentage);
                } else {
                    newData.first = Number(newData.first) - getShareValue(Number(newData.first), share);
                    newData.second = Number(newData.second) - getShareValue(Number(newData.second), share);
                }
                return newData
            })

            updatedSavedPurchases = updatedSavedPurchases.map(purchase => {
                let newData = { ...purchase }
                if (newData.first < 0) {
                    newData.first = 0
                }
                if (newData.second < 0) {
                    newData.second = 0
                }
                return newData
            })
            updatedSavedPurchases = updatedSavedPurchases.filter(purchase => {
                if (purchase.first > 0 || purchase.second > 0)
                    return true
                else
                    return false
            })
        } else if (totalLimitSaleForm.limitType == "downLimit") {
            function getDownLimitProcessedPurchase(purchase) {
                let newData = { ...purchase }
                let shareOrPC = Number(targetUser.commission.share)
                if (newData.bundle.length == 4) {
                    shareOrPC = Number(targetUser.commission.pcPercentage)
                }
                if (Number(newData.first) > getShareValue(Number(newData.first), shareOrPC))
                    newData.first = getShareValue(Number(newData.first), shareOrPC)
                if (Number(newData.second) > getShareValue(Number(newData.second), shareOrPC))
                    newData.second = getShareValue(Number(newData.second), shareOrPC)
                return newData
            }
            updatedSavedPurchases = savedPurchases.map(purchase => {
                let newData = { ...purchase }
                newData = getDownLimitProcessedPurchase(newData)
                return newData
            })
            updatedSavedPurchases = updatedSavedPurchases.filter(purchase => {
                if (purchase.first > 0 || purchase.second > 0)
                    return true
                else
                    return false
            })
        }
        savedPurchases = updatedSavedPurchases
        savedPurchases = savedPurchases.filter(purchase => purchase.first > 0 || purchase.second > 0)
        pdfDoc.setFontSize(10);
        pdfDoc.text(currentLoggedInUser.username + ", " + "Draw: " + selectedDraw.title, 15, 30);
        // Text above the table on the right with adjusted font size
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 20, 30, { align: 'right' });
        // pdfDoc.text("All Total: " + allTotal, pdfDoc.internal.pageSize.width - 20, 30, { align: 'right' });

        let parts = 4;
        let chunkSize = Math.ceil(savedPurchases.length / parts);
        let dividedArrays = [];
        savedPurchases = savedPurchases.sort((a, b) => {
            return Number('1' + a.bundle) - Number('1' + b.bundle);
        });

        for (let i = 0; i < savedPurchases.length; i += chunkSize) {
            dividedArrays.push(savedPurchases.slice(i, i + chunkSize));
        }


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
        pdfDoc.autoTable({
            head: [columns],
            body: bodyData,
            theme: 'striped',
            margin: { top: 32 }, // Adjusted top margin to leave space for the headings and texts
            columnStyles: {
                ...columnStyles
            },
            styles: {
                ...styles
            }

        });
        pdfDoc.setFontSize(10);

        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text("Total First: " + totalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total Second: " + totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total: " + total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.setFont("helvetica", "normal");


        const filename = 'sample.pdf';
        // pdfDoc.save(filename);
        const pdfContent = pdfDoc.output(); // Assuming pdfDoc is defined somewhere
        const formData = new FormData();
        formData.append('pdfContent', new Blob([pdfContent], { type: 'application/pdf' }));
        try {
            await savePdfOnBackend(formData);
            successMessage("Report generated successfully")
        } catch (e) {
            alertMessage("Due to an error could not make report")
        }

        if (!targetUser.commission.shareEnabled) {
            alert("Your Share is not enabled")
            return
        }

    }



    const generateTotalSaleWihtoutGroupInvoice = async ({ sorted = false }) => {
        const pdfDoc = new jsPDF();

        const columns = ['Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd'];

        pdfDoc.setFontSize(20);
        // Two centered headings
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        if (totalSaleForm.category == "oversale") {
            pdfDoc.text("Total Oversale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        }
        else {
            pdfDoc.text("Total Sale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        }



        let groupedByBundle = savedPurchasesInDraw.flatMap(draw => draw.savedPurchases)
            .reduce((acc, purchase) => {
                const bundle = purchase.bundle;

                if (!acc[bundle]) {
                    acc[bundle] = { bundle, first: 0, second: 0 };
                }

                acc[bundle].first += purchase.first;
                acc[bundle].second += purchase.second;

                return acc;
            }, {});

        // Convert the grouped object back to an array
        let savedPurchases = Object.values(groupedByBundle);

        savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0)

        groupedByBundle = savedPurchasesInDraw.flatMap(draw => draw.savedOversales)
            .reduce((acc, purchase) => {
                const bundle = purchase.bundle;

                if (!acc[bundle]) {
                    acc[bundle] = { bundle, first: 0, second: 0 };
                }

                acc[bundle].first += purchase.first;
                acc[bundle].second += purchase.second;

                return acc;
            }, {});

        // Convert the grouped object back to an array
        let savedOversales = Object.values(groupedByBundle);
        savedOversales = savedOversales.filter(purchase => purchase.first != 0 || purchase.second != 0)

        let allTotal = 0;
        if (totalSaleForm.category == "combined") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: true, oversales: true })
        } else if (totalSaleForm.category == "general") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: true, oversales: false })
        } else if (totalSaleForm.category == "oversale") {
            allTotal = getAllTotal({ savedPurchases, savedOversales, purchases: false, oversales: true })
        }

        pdfDoc.setFontSize(10);
        pdfDoc.text(currentLoggedInUser.username + ", " + "Draw: " + selectedDraw.title, 15, 30);
        // Text above the table on the right with adjusted font size
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 60, 30, { align: 'right' });
        pdfDoc.text("All Total: " + allTotal, pdfDoc.internal.pageSize.width - 20, 30, { align: 'right' });

        let parts = 4;
        let chunkSize = Math.ceil(savedPurchases.length / parts);
        let dividedArrays = [];
        if (sorted) {
            savedPurchases = savedPurchases.sort((a, b) => {
                return Number('1' + a.bundle) - Number('1' + b.bundle);
            });
        }

        for (let i = 0; i < savedPurchases.length; i += chunkSize) {
            dividedArrays.push(savedPurchases.slice(i, i + chunkSize));
        }


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

        if (totalSaleForm.category == "combined" || totalSaleForm.category == "general") {
            // Add a table to the PDF
            pdfDoc.autoTable({
                head: [columns],
                body: bodyData,
                theme: 'striped',
                margin: { top: 32 }, // Adjusted top margin to leave space for the headings and texts
                columnStyles: {
                    ...columnStyles
                },
                styles: {
                    ...styles
                }

            });
            pdfDoc.setFontSize(10);

            pdfDoc.setFont("helvetica", "bold");

            pdfDoc.text("Total First: " + totalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.text("Total Second: " + totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.text("Total: " + total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.setFont("helvetica", "normal");

        }

        if (savedOversales.length > 0) {
            // Add a new page for the Oversales content

            chunkSize = Math.ceil(savedOversales.length / parts);
            dividedArrays = [];

            if (sorted) {
                savedOversales = savedOversales.sort((a, b) => {
                    return Number('1' + a.bundle) - Number('1' + b.bundle);
                });
            }
            for (let i = 0; i < savedOversales.length; i += chunkSize) {
                dividedArrays.push(savedOversales.slice(i, i + chunkSize));
            }

            // Move the cursor down to leave space for the Oversales headings and table
            pdfDoc.setFontSize(20);

            // Two centered headings for Oversales
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
            if (totalSaleForm.category == "combined" || totalSaleForm.category == "oversale") {
                if (totalSaleForm.category == "combined") {
                    pdfDoc.addPage();
                    pdfDoc.text("Oversales", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
                }
                pdfDoc.autoTable({
                    head: [columns],
                    body: bodyData,
                    theme: 'striped',
                    margin: { top: totalSaleForm.category == "combined" ? 15 : 32 }, // Adjusted top margin to leave space for the headings and texts
                    columnStyles: {
                        ...columnStyles
                    },
                    styles: {
                        ...styles
                    }

                });
                pdfDoc.setFontSize(10);

                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.text("Total First: " + totalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
                pdfDoc.text("Total Second: " + totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
                pdfDoc.text("Total: " + total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
                pdfDoc.setFont("helvetica", "normal");

            }
        }
        const filename = 'sample.pdf';
        // pdfDoc.save(filename);
        const pdfContent = pdfDoc.output(); // Assuming pdfDoc is defined somewhere
        const formData = new FormData();
        formData.append('pdfContent', new Blob([pdfContent], { type: 'application/pdf' }));
        try {
            await savePdfOnBackend(formData);
            successMessage("Report generated successfully")
        } catch (e) {
            alertMessage("Due to an error could not make report")
        }
    };

    const addBillSheetOfAMerchent = async (pdfDoc, targetUser, result) => {
        let x1 = 5, x2 = 140;
        let y = 20, ySpace = 7
        pdfDoc.setFontSize(20);
        let head1="Bill Sheet";
        pdfDoc.text("Bill Sheet"+(billingSheetForm.type=="general"? " - General":" - Oversale"), pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.setFontSize(12);
        pdfDoc.text("Draw date:", x1, y); pdfDoc.text(selectedDraw.drawDate + ", " + "Draw: " + selectedDraw.title, x1 + 30, y);
        pdfDoc.text("Dealer Code:", x2, y); pdfDoc.text(targetUser.userId + "", x2 + 27, y);


        pdfDoc.text("Commission:", x1, y + ySpace); pdfDoc.text(targetUser.commission.commision + " %", x1 + 30, y + ySpace);
        pdfDoc.text("Name:", x2, y + ySpace); pdfDoc.text(targetUser.generalInfo.name + "", x2 + 27, y + ySpace);


        pdfDoc.text("PC:", x1, y + 2 * ySpace); pdfDoc.text(targetUser.commission.pcPercentage + " %", x1 + 30, y + 2 * ySpace);
        pdfDoc.text("Address:", x2, y + 2 * ySpace); pdfDoc.text(targetUser.generalInfo.address, x2 + 27, y + 2 * ySpace);


        pdfDoc.text("Share:", x1, y + 3 * ySpace); pdfDoc.text(targetUser.commission.share + " %", x1 + 30, y + 3 * ySpace);
        pdfDoc.text("PC Share:", x1 + 50 + 20, y + 3 * ySpace); pdfDoc.text(targetUser.commission.pcShare + "%", x1 + 40 + 50 + 5, y + 3 * ySpace);

        pdfDoc.text("Contact:", x2, y + 3 * ySpace); pdfDoc.text(targetUser.generalInfo.contactNumber, x2 + 27, y + 3 * ySpace);


        pdfDoc.autoTable({
            head: [["Total Prize", "Total Sale", "Draw Time"]],
            body: [[result.totalPrize, result.totalSale, formatTime(selectedDraw.drawTime)]],
            theme: '',
            margin: { top: y + 4 * ySpace },
            styles: {
                fontStyle: 'bold',
                textColor: [0, 0, 0],
                lineWidth: 0.2,  // Set the border width to 0
                lineColor: [0, 0, 0],  // Set the border color to match the background
                fillStyle: 'DF',
                fillColor: [255, 255, 255],
                head: {
                    fontStyle: 'bold',
                    halign: 'center',
                    fillColor: [255, 0, 0],
                    textColor: [255, 255, 255],
                },
            }
        });
        pdfDoc.autoTable({
            head: [["First Prize", "Second Prize 1", "Second Prize 2", "Second Prize 3", "Second Prize 4", "Second Prize 5"]],
            body: [[selectedDraw.prize.firstPrize, selectedDraw.prize.secondPrize1, selectedDraw.prize.secondPrize2, selectedDraw.prize.secondPrize3, selectedDraw.prize.secondPrize4, selectedDraw.prize.secondPrize5]],
            theme: '',
            margin: { top: y + 30 * ySpace },
            styles: {
                fontStyle: 'bold',
                textColor: [0, 0, 0],
                lineWidth: 0.2,  // Set the border width to 0
                lineColor: [0, 0, 0],  // Set the border color to match the background
                fillStyle: 'DF',
                fillColor: [255, 255, 255],
                head: {
                    fontStyle: 'bold',
                    halign: 'center',
                    fillColor: [255, 0, 0],
                    textColor: [255, 255, 255],
                },
            }
        });
        const lineY = y + 10 * ySpace;  // Adjust the Y coordinate as needed
        pdfDoc.line(x1, lineY, pdfDoc.internal.pageSize.width - x1, lineY);


        x2 = 120
        pdfDoc.text("A+B+C First:", x1, y + 11 * ySpace); pdfDoc.text(result.ABCFirstTotal + "", x1 + 40, y + 11 * ySpace);
        pdfDoc.text("D First:", x2, y + 11 * ySpace); pdfDoc.text(result.DFirstTotal + "", x2 + 40, y + 11 * ySpace);

        pdfDoc.text("A+B+C Second:", x1, y + 12 * ySpace); pdfDoc.text(result.ABCSecondTotal + "", x1 + 40, y + 12 * ySpace);
        pdfDoc.text("D Second:", x2, y + 12 * ySpace); pdfDoc.text(result.DSecondTotal + "", x2 + 40, y + 12 * ySpace);

        pdfDoc.text("Total Sale:", x1, y + 13 * ySpace); pdfDoc.text(result.ABCTotalSale + "", x1 + 40, y + 13 * ySpace);//ABC total
        pdfDoc.text("Total Sale:", x2, y + 13 * ySpace); pdfDoc.text(result.DTotalSale + "", x2 + 40, y + 13 * ySpace);//D total

        pdfDoc.text("Commission:", x1, y + 14 * ySpace); pdfDoc.text(result.commission + "", x1 + 40, y + 14 * ySpace);
        pdfDoc.text("PC Commsion:", x2, y + 14 * ySpace); pdfDoc.text(result.PCCommission + "", x2 + 40, y + 14 * ySpace);


        pdfDoc.text("Total Sale:", x1, y + 15 * ySpace); pdfDoc.text(result.totalSale + "", x1 + 40, y + 15 * ySpace);
        pdfDoc.text("Total Commission:", x2, y + 15 * ySpace); pdfDoc.text(result.totalCommission + "", x2 + 40, y + 15 * ySpace);

        pdfDoc.text("Extra Sale:", x1, y + 16 * ySpace); pdfDoc.text(result.extraSale + "", x1 + 40, y + 16 * ySpace);
        pdfDoc.text("ABC Extra:", x1 + 50 + 20, y + 16 * ySpace); pdfDoc.text(result.ABCExtraSale + "", x1 + 40 + 50 + 5, y + 16 * ySpace);
        pdfDoc.text("D Extra:", x2 + 10, y + 16 * ySpace); pdfDoc.text(result.DExtraSale + "", x2 + 40, y + 16 * ySpace);

        pdfDoc.text("Total Prize:", x1, y + 17 * ySpace); pdfDoc.text(result.totalPrize + "", x1 + 40, y + 17 * ySpace);
        pdfDoc.text("ABC Prize:", x1 + 50 + 20, y + 17 * ySpace); pdfDoc.text(result.ABCPrize + "", x1 + 40 + 50 + 5, y + 17 * ySpace);
        pdfDoc.text("D Prize:", x2 + 10, y + 17 * ySpace); pdfDoc.text(result.DPrize + "", x2 + 40, y + 17 * ySpace);

        pdfDoc.text("Bill:", x1, y + 18 * ySpace); pdfDoc.text(result.bill + "", x1 + 40, y + 18 * ySpace);
        pdfDoc.text("ABC Bill:", x1 + 50 + 20, y + 18 * ySpace); pdfDoc.text(result.ABCBill + "", x1 + 40 + 50 + 5, y + 18 * ySpace);
        pdfDoc.text("D Bill:", x2 + 10, y + 18 * ySpace); pdfDoc.text(result.DBill + "", x2 + 40, y + 18 * ySpace);


        pdfDoc.text("Total Share:", x1, y + 19 * ySpace); pdfDoc.text(result.totalShare + "", x1 + 40, y + 19 * ySpace);
        pdfDoc.text("ABC Share:", x1 + 50 + 20, y + 19 * ySpace); pdfDoc.text(result.ABCShare + "", x1 + 40 + 50 + 5, y + 19 * ySpace);
        pdfDoc.text("D Share:", x2 + 10, y + 19 * ySpace); pdfDoc.text(result.DShare + "", x2 + 40, y + 19 * ySpace);

        pdfDoc.text("Total Bill:", x1, y + 20 * ySpace); pdfDoc.text(result.totalBill + "", x1 + 40, y + 20 * ySpace);
        pdfDoc.text("Total Bill:", x1 + 50 + 20, y + 20 * ySpace); pdfDoc.text(result.totalABCBill + "", x1 + 40 + 50 + 5, y + 20 * ySpace);
        pdfDoc.text("Total Bill:", x2 + 10, y + 20 * ySpace); pdfDoc.text(result.totalDBill + "", x2 + 40, y + 20 * ySpace);
    }

    const calculateTotalsInFormat = (savedPurchases) => {
        let ABCFirstTotal = 0, ABCSecondTotal = 0, DFirstTotal = 0, DSecondTotal = 0
        savedPurchases.forEach(purchase => {
            if (purchase.bundle.length == 4) {
                DFirstTotal += Number(purchase.first)
                DSecondTotal += Number(purchase.second)
            } else {
                ABCFirstTotal += Number(purchase.first)
                ABCSecondTotal += Number(purchase.second)
            }
        })
        return { ABCFirstTotal, ABCSecondTotal, DFirstTotal, DSecondTotal }
    }
    const calculatePrize = (targetUser, savedPurchases) => {
        function getFirstOfBundle(bundle) {
            let res = null
            savedPurchases.forEach(purchase => {
                if (purchase.bundle == bundle) {
                    res = Number(purchase.first)
                }
            })
            return res
        }
        function getSecondOfBundle(bundle) {
            let res = null
            savedPurchases.forEach(purchase => {
                if (purchase.bundle == bundle) {
                    res = Number(purchase.second)
                }
            })
            return res
        }
        function getFormatArray(prize) {
            const output = [];
            for (let i = 1; i <= prize.length; i++) {
                output.push(prize.substring(0, i));
            }
            return output;
        }
        let rewardObj = targetUser.rewardCommission
        function getRewardForBundle(bundle) {
            if (bundle.length == 1) return Number(rewardObj.firstA)
            if (bundle.length == 2) return Number(rewardObj.firstB)
            if (bundle.length == 3) return Number(rewardObj.firstC)
            if (bundle.length == 4) return Number(rewardObj.firstD)
        }
        let drawPrizeObj = selectedDraw.prize;
        let ABCFirstTotalPrize = 0, DFirstTotalPrize = 0, ABCSecondTotalPrize = 0, DSecondTotalPrize = 0
        if (drawPrizeObj.firstPrize.length == 4) {
            getFormatArray(drawPrizeObj.firstPrize).forEach(bundle => {
                if (bundle.length == 4) {
                    let tempV = getFirstOfBundle(bundle)
                    if (tempV)
                        DFirstTotalPrize += tempV * getRewardForBundle(bundle)
                } else {
                    let tempV = getFirstOfBundle(bundle)
                    if (tempV)
                        ABCFirstTotalPrize += tempV * getRewardForBundle(bundle)
                }
            })
        }
        let drawSecondPrizes = []
        let count = 0
        if (drawPrizeObj.secondPrize1.length == 4) { drawSecondPrizes.push(drawPrizeObj.secondPrize1); count++ }
        if (drawPrizeObj.secondPrize2.length == 4) { drawSecondPrizes.push(drawPrizeObj.secondPrize2); count++ }
        if (drawPrizeObj.secondPrize3.length == 4) { drawSecondPrizes.push(drawPrizeObj.secondPrize3); count++ }
        if (drawPrizeObj.secondPrize4.length == 4) { drawSecondPrizes.push(drawPrizeObj.secondPrize4); count++ }
        if (drawPrizeObj.secondPrize5.length == 4) { drawSecondPrizes.push(drawPrizeObj.secondPrize5); count++ }
        drawSecondPrizes.forEach(tempSecondPrize => {
            getFormatArray(tempSecondPrize).forEach(bundle => {
                if (bundle.length == 4) {
                    let tempV = getSecondOfBundle(bundle)
                    if (tempV)
                        DSecondTotalPrize += Number((getSecondOfBundle(bundle) * getRewardForBundle(bundle) / count).toFixed(1))
                } else {
                    let tempV = getSecondOfBundle(bundle)
                    if (tempV)
                        ABCSecondTotalPrize += Number((getSecondOfBundle(bundle) * getRewardForBundle(bundle) / count).toFixed(1))
                }
            })
        })
        // console.log(ABCFirstTotalPrize , ABCSecondTotalPrize,DFirstTotalPrize ,DSecondTotalPrize )
        let ABCPrize = formatNumberWithTwoDecimals(ABCFirstTotalPrize + ABCSecondTotalPrize)
        let DPrize = formatNumberWithTwoDecimals(DFirstTotalPrize + DSecondTotalPrize)
        return { ABCPrize, DPrize, totalPrize: formatNumberWithTwoDecimals(ABCPrize + DPrize) }
    }
    const calculateResultOfMerchent = (targetUser, savedPurchases) => {
        let { ABCFirstTotal, ABCSecondTotal, DFirstTotal, DSecondTotal } = calculateTotalsInFormat(savedPurchases)
        let ABCTotalSale = formatNumberWithTwoDecimals(ABCFirstTotal + ABCSecondTotal);
        let DTotalSale = formatNumberWithTwoDecimals(DFirstTotal + DSecondTotal);
        let commission = formatNumberWithTwoDecimals(Number(((Number(targetUser.commission.commision) / 100) * ABCTotalSale).toFixed(1)))
        let PCCommission =formatNumberWithTwoDecimals( Number(((Number(targetUser.commission.pcPercentage) / 100) * DTotalSale).toFixed(1)))
        let totalSale = formatNumberWithTwoDecimals(ABCTotalSale + DTotalSale)
        let totalCommission = formatNumberWithTwoDecimals(commission + PCCommission)
        let extraSale = formatNumberWithTwoDecimals(totalSale - totalCommission)
        let ABCExtraSale = formatNumberWithTwoDecimals(ABCTotalSale - commission)
        let DExtraSale = formatNumberWithTwoDecimals(DTotalSale - PCCommission)

        let prize = calculatePrize(targetUser, savedPurchases)
        let bill = formatNumberWithTwoDecimals(extraSale - prize.totalPrize)
        let ABCBill = formatNumberWithTwoDecimals(ABCExtraSale - prize.ABCPrize)
        let DBill = formatNumberWithTwoDecimals(DExtraSale - prize.DPrize)
        let ABCShare = formatNumberWithTwoDecimals(ABCBill * (Number(targetUser.commission.share) / 100))
        let DShare = formatNumberWithTwoDecimals(DBill * (Number(targetUser.commission.pcShare) / 100))
        let totalShare = formatNumberWithTwoDecimals(ABCShare + DShare)
        let totalABCBill = formatNumberWithTwoDecimals(ABCBill - ABCShare)
        let totalDBill = formatNumberWithTwoDecimals(DBill - DShare)
        let totalBill = formatNumberWithTwoDecimals(totalABCBill + totalDBill)
        totalBill=-totalBill              /// plus should indicate balance to be added in user's account

        let result = {
            ABCFirstTotal, ABCSecondTotal, DFirstTotal, DSecondTotal, ABCTotalSale, DTotalSale, commission, PCCommission,
            totalSale, totalCommission, extraSale, ABCPrize: prize.ABCPrize, DPrize: prize.DPrize, totalPrize: prize.totalPrize,
            ABCExtraSale, DExtraSale, bill, ABCBill, DBill, ABCShare, DShare, totalShare, totalABCBill, totalDBill, totalBill
        }
        for (let key in result) {
            result[key] = Number(result[key].toFixed(1))
        }
        return result
    }
    const getAUser = (username) => {
        return allUsers.find(user => user.username == username)
    }

    const getTotalGeneralSalesOfMerchentFromDraw = (username,general=false,oversale=false) => {
        let targetUser = getAUser(username)
        if(general){
            let drawDataArray = targetUser.savedPurchasesFromDrawsData.filter(data => {
                return data.drawId == selectedDraw._id
            })
            let groupedByBundle = drawDataArray.flatMap(draw => draw.savedPurchases)
                .reduce((acc, purchase) => {
                    const bundle = purchase.bundle;
    
                    if (!acc[bundle]) {
                        acc[bundle] = { bundle, first: 0, second: 0 };
                    }
    
                    acc[bundle].first += purchase.first;
                    acc[bundle].second += purchase.second;
    
                    return acc;
                }, {});
            let savedPurchases = Object.values(groupedByBundle);
            return savedPurchases    
        }else if(oversale){
            let drawDataArray = targetUser.savedPurchasesFromDrawsData.filter(data => {
                return data.drawId == selectedDraw._id
            })
            let groupedByBundle = drawDataArray.flatMap(draw => draw.savedOversales)
                .reduce((acc, purchase) => {
                    const bundle = purchase.bundle;
    
                    if (!acc[bundle]) {
                        acc[bundle] = { bundle, first: 0, second: 0 };
                    }
    
                    acc[bundle].first += purchase.first;
                    acc[bundle].second += purchase.second;
    
                    return acc;
                }, {});
            let savedOversales = Object.values(groupedByBundle);
            return savedOversales
        }
        return []

    }
    
    const generateBillingSheet = async () => {
        let targetUser=getAUser(localStorageUtils.getLoggedInUser().username)
        const pdfDoc = new jsPDF();
        let purchases=[]
        if(billingSheetForm.type=="oversale"){
            purchases=getTotalGeneralSalesOfMerchentFromDraw(targetUser.username,true,false)
        }else{
            purchases=getTotalGeneralSalesOfMerchentFromDraw(targetUser.username,false,true)
        }

        let result = calculateResultOfMerchent(targetUser, purchases)
        addBillSheetOfAMerchent(pdfDoc, targetUser, result)

        const pdfContent = pdfDoc.output(); // Assuming pdfDoc is defined somewhere
        const formData = new FormData();
        formData.append('pdfContent', new Blob([pdfContent], { type: 'application/pdf' }));
        try {
            await savePdfOnBackend(formData);
            successMessage("Report generated successfully")
        } catch (e) {
            alertMessage("Due to an error could not make report")
        }
    }

    

    const generateBillingSheetSummary = async () => {
        let targetUser = getAUser(currentLoggedInUser.username)
        const pdfDoc = new jsPDF();
        pdfDoc.setFontSize(20);
        pdfDoc.text("Bill Sheet Summary", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.setFontSize(12);
        pdfDoc.text("Client: " + targetUser.username + ", " + "Draw: " + selectedDraw.title, 15, 25);
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 20, 25, { align: 'right' });

        const columns = ['Sheet No', 'Sheet Name', 'Sheet Total', 'Total Prize'];
        let bodyData = []
        let savedDataOfUser=targetUser.savedPurchasesFromDrawsData.filter(data=> data.drawId==selectedDraw._id)
        for(let i=0;i<savedDataOfUser.length;i++){
            let sheetNo=i+1
            let sheetName=savedDataOfUser[i].sheetName
            // savedPurchases, savedOversales, purchases, oversales
            let totalSale=getAllTotal({
                savedPurchases: savedDataOfUser[i].savedPurchases,
                savedOversales:savedDataOfUser[i].savedOversales,
                purchases:true,oversales:true
             })

             let sheetSavedPurchasesPrize=calculateResultOfMerchent(targetUser,savedDataOfUser[i].savedPurchases).totalPrize
             let sheetSavedOversalesPrize=calculateResultOfMerchent(targetUser,savedDataOfUser[i].savedOversales).totalPrize
             let totalPrize=sheetSavedPurchasesPrize+sheetSavedOversalesPrize
             bodyData.push([sheetNo, sheetName,totalSale,totalPrize])
        }
        pdfDoc.autoTable({
            head: [columns],
            body: bodyData,
            theme: '',
            margin: { top: 28 },
            styles: {
                fontStyle: 'bold',
                textColor: [0, 0, 0],
                lineWidth: 0.2,  // Set the border width to 0
                lineColor: [0, 0, 0],  // Set the border color to match the background
                fillStyle: 'DF',
                fillColor: [255, 255, 255],
                head: {
                    fontStyle: 'bold',
                    halign: 'center',
                    fillColor: [255, 0, 0],
                    textColor: [255, 255, 255],
                },
            }
        });

        const pdfContent = pdfDoc.output(); // Assuming pdfDoc is defined somewhere
        const formData = new FormData();
        formData.append('pdfContent', new Blob([pdfContent], { type: 'application/pdf' }));
        try {
            await savePdfOnBackend(formData);
            successMessage("Report generated successfully")
        } catch (e) {
            alertMessage("Due to an error could not make report")
        }
    }


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
                                <Nav.Link eventKey="billingSheet" style={{ background: (selectedOption == "billingSheet" ? "lightgray" : "") }} >Bill Sheet</Nav.Link>

                                {localStorageUtils.getLoggedInUser().role != "merchent"
                                    &&
                                    <Nav.Link eventKey="totalLimitSale" style={{ background: (selectedOption == "totalLimitSale" ? "lightgray" : "") }} >Total Share Limit Sale</Nav.Link>
                                }
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
                                    <Row>
                                        <Col>
                                            <Form.Label>Date</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                type="date"
                                                name="date"
                                                value={totalSaleForm.date}
                                                onChange={handleTotalSaleChange}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className='mt-3'>
                                        <Col>
                                            <Form.Label>Category</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="category"
                                                value={totalSaleForm.category}
                                                onChange={handleTotalSaleChange}
                                            >
                                                <option value="combined">Combined</option>
                                                <option value="general">General</option>
                                                <option value="oversale">Oversale</option>
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
                                                value={totalSaleForm.reportType}
                                                onChange={handleTotalSaleChange}
                                            >
                                                <option value="withoutGroup">Without Group</option>
                                                <option value="groupWise">Group-Wise</option>
                                            </Form.Control>
                                        </Col>
                                    </Row>
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
                                            <Form.Label>Category</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="category"
                                                value={totalSheetSaleForm.category}
                                                onChange={handleTotalSheetSaleChange}
                                            >
                                                <option value="combined">Combined</option>
                                                <option value="general">General</option>
                                                <option value="oversale">Oversale</option>
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
                                                <option value="withoutGroup">Without Group</option>
                                                <option value="groupWise">Group-Wise</option>
                                            </Form.Control>
                                        </Col>
                                    </Row>
                                </Form>
                            )}
                            {selectedOption === 'totalLimitSale' && localStorageUtils.getLoggedInUser().generalInfo.enableLimitSaleReportView && (
                                <Form>
                                    <Row>
                                        <Col>
                                            <Form.Label>Date</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                type="date"
                                                name="date"
                                                value={totalLimitSaleForm.date}
                                                onChange={handleTotalLimitSaleChange}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className='mt-3'>
                                        <Col>
                                            <Form.Label>Limit Type</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="limitType"
                                                value={totalLimitSaleForm.limitType}
                                                onChange={handleTotalLimitSaleChange}
                                            >
                                                <option value="upLimit">Up Limit</option>
                                                <option value="downLimit">Down Limit</option>
                                            </Form.Control>
                                        </Col>
                                    </Row>

                                </Form>
                            )}
                            {selectedOption === 'totalLimitSale' && !localStorageUtils.getLoggedInUser().generalInfo.enableLimitSaleReportView &&
                                <div className='d-flex justify-content-center'>
                                    {window.innerWidth <= 600 ?
                                        <h6>Your Distributor has not allowed</h6>
                                        :
                                        <h4>Your Distributor has not allowed</h4>
                                    }
                                </div>
                            }
                            {selectedOption === 'billingSheet' && (
                                <Form>
                                    <Row>
                                        <Col>
                                            <Form.Label>Date</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                type="date"
                                                name="date"
                                                value={billingSheetForm.date}
                                                onChange={handleBillingSheetChange}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className='mt-3'>
                                        <Col>
                                            <Form.Label>Type</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="type"
                                                value={billingSheetForm.type}
                                                onChange={handleBillingSheetChange}
                                            >
                                                <option value="general">General</option>
                                                <option value="oversale">OverSale</option>
                                            </Form.Control>
                                        </Col>
                                    </Row>

                                </Form>
                            )}

                        </Card.Body>
                        {selectedOption === 'totalSheetSale' && (
                            <Card.Footer>
                                <div className="d-flex flex-wrap justify-content-start">
                                    <Button variant="primary btn btn-sm m-1"
                                        onClick={() => (totalSheetSaleForm.reportType == "withoutGroup" ? generateTotalSheetSaleWihtoutGroupInvoice({ sorted: false }) : generateTotalSheetSaleGroupWiseInvoice({ sorted: false }))}
                                        disabled={!totalSheetSaleForm.date || !totalSheetSaleForm.sheetNo || !totalSheetSaleForm.reportType}
                                    >
                                        Invoice Report
                                    </Button>
                                    <Button variant="primary btn btn-sm m-1"
                                        onClick={() => (totalSheetSaleForm.reportType == "withoutGroup" ? generateTotalSheetSaleWihtoutGroupInvoice({ sorted: true }) : generateTotalSheetSaleGroupWiseInvoice({ sorted: true }))}
                                        disabled={!totalSheetSaleForm.date || !totalSheetSaleForm.sheetNo || !totalSheetSaleForm.reportType}

                                    >
                                        Report
                                    </Button>
                                </div>
                            </Card.Footer>
                        )}
                        {selectedOption === 'totalSale' && (
                            <Card.Footer>
                                <div className="d-flex flex-wrap justify-content-start">
                                    <Button variant="primary btn btn-sm m-1"
                                        onClick={() => (totalSaleForm.reportType == "withoutGroup" ? generateTotalSaleWihtoutGroupInvoice({ sorted: false }) : generateTotalSaleGroupWiseInvoice({ sorted: false }))}
                                        disabled={!totalSaleForm.date || !totalSaleForm.category || !totalSaleForm.reportType}
                                    >
                                        Invoice Report
                                    </Button>
                                    <Button variant="primary btn btn-sm m-1"
                                        onClick={() => (totalSaleForm.reportType == "withoutGroup" ? generateTotalSaleWihtoutGroupInvoice({ sorted: true }) : generateTotalSaleGroupWiseInvoice({ sorted: true }))}
                                        disabled={!totalSaleForm.date || !totalSaleForm.category || !totalSaleForm.reportType}

                                    >
                                        Report
                                    </Button>

                                </div>
                            </Card.Footer>
                        )}
                        {selectedOption === 'billingSheet' && (
                            <Card.Footer>
                                <div className="d-flex flex-wrap justify-content-start">
                                    <Button variant="primary btn btn-sm m-1"
                                        onClick={() => generateBillingSheet()}
                                        disabled={!billingSheetForm.date || !billingSheetForm.type}
                                    >
                                        Bill Sheet
                                    </Button>
                                    <Button variant="primary btn btn-sm m-1"
                                        onClick={() => generateBillingSheetSummary()}
                                        disabled={!billingSheetForm.date}
                                    >
                                        Summarized Bill Sheet
                                    </Button>
                                </div>
                            </Card.Footer>
                        )}

                        {selectedOption === 'totalLimitSale' && localStorageUtils.getLoggedInUser().generalInfo.enableLimitSaleReportView && (
                            <Card.Footer>
                                <div className="d-flex flex-wrap justify-content-start">
                                    <Button variant="primary btn btn-sm m-1"
                                        onClick={() => generateTotalLimitSaleWihtoutGroup()}
                                        disabled={!totalLimitSaleForm.date || !totalLimitSaleForm.limitType}
                                    >
                                        Report
                                    </Button>

                                </div>
                            </Card.Footer>
                        )}

                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default MerchentReports;
