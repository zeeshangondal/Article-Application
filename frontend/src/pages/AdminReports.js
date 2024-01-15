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
import { formatTime } from '../Utils/Utils';

const AdminReports = () => {
    const [selectedOption, setSelectedOption] = useState("totalSale");
    const [draws, setDraws] = useState([]);
    const [currentLoggedInUser, setCurrentLoggedInUser] = useState({});
    const [subUsers, setSubUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedDraw, setSelectedDraw] = useState(null)
    const [totalSaleForm, setTotalSaleForm] = useState({
        date: '',
        reportType: 'withoutGroup',
    });

    const [dealerSaleVoucherForm, setDealerSaleVoucherForm] = useState({
        date: '',
        dealer: 'allDealers',
    });

    const [billingSheetForm, setBillingSheetForm] = useState({
        date: '',
        dealer: 'allDealers',
        limitType: 'apply'
    });

    const [totalLimitSaleForm, setTotalLimitSaleForm] = useState({
        date: '',
        reportType: 'withoutGroup',
        dealer: 'allDealersCombined',
        limitType: 'upLimit'
    });
    const [limitCuttingForm, setLimitCuttingForm] = useState({
        date: '',
        bundleType: 'A',
        indFirst: null,
        indSecond: null,
        firstA: null,
        secondA: null,
        firstB: null,
        secondB: null,
        firstC: null,
        secondC: null,
        firstD: null,
        secondD: null,
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
        fetchSubUsersOf()
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
    const fetchSubUsersOf = async () => {
        try {
            const response = await APIs.getAllUsers();
            setAllUsers(response.users)
            let subUsers = response.users.filter(user => user.role != "admin" && user.creator._id == localStorageUtils.getLoggedInUser()._id);
            setSubUsers(subUsers)
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
        if (selectedOption != selectedKey) {
            setDealerSaleVoucherForm({
                date: '',
                dealer: 'allDealers',
            })
            setBillingSheetForm({
                date: '',
                dealer: 'allDealers',
                limitType: 'apply'

            })
            setTotalSaleForm({
                date: '',
                reportType: 'withoutGroup',
            })
            setTotalLimitSaleForm({
                date: '',
                reportType: 'withoutGroup',
                dealer: 'allDealersCombined',
                limitType: 'upLimit'
            })
            setLimitCuttingForm({
                date: '',
                bundleType: 'A',
                indFirst: null,
                indSecond: null,
                firstA: null,
                secondA: null,
                firstB: null,
                secondB: null,
                firstC: null,
                secondC: null,
                firstD: null,
                secondD: null,
                limitType: 'upLimit'
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
            let tempDraw = draws.find(draw => draw.drawDate == value)
            if (!tempDraw) {
                alertMessage("No Record of Draw")
                return
            }
            setSelectedDraw(tempDraw)
        }
        setTotalSaleForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };
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
        }
        let tempUpdate = {
            ...totalLimitSaleForm,
            [name]: value,
        }
        if (tempUpdate.dealer == "allDealersSeparate" && tempUpdate.reportType == "groupWise") {
            tempUpdate = {
                ...tempUpdate,
                reportType: 'withoutGroup',
            }
        }
        setTotalLimitSaleForm(tempUpdate);
    };

    const handleLimitCuttingChange = (e) => {
        const { name, value } = e.target;
        if (name == "date") {
            let tempDraw = draws.find(draw => draw.drawDate == value)
            if (!tempDraw) {
                alertMessage("No Record of Draw")
                return
            }
            setSelectedDraw(tempDraw)
        }
        if (name != "date" && name != "bundleType" && name != "limitType") {
            try {
                if (Number(value) < 0) {
                    return
                }
            } catch {
                return;
            }
        }
        let tempUpdate = {
            ...limitCuttingForm,
            [name]: value,
        }
        setLimitCuttingForm(tempUpdate);
    };

    const handleDealerSaleVoucherChange = (e) => {
        const { name, value } = e.target;
        if (name == "date") {
            let tempDraw = draws.find(draw => draw.drawDate == value)
            if (!tempDraw) {
                alertMessage("No Record of Draw")
                return
            }
            setSelectedDraw(tempDraw)
        }
        setDealerSaleVoucherForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    const getTitle = () => {
        if (selectedOption === 'totalSale') return 'Total Sale Report';
        if (selectedOption === 'dealerSaleVoucher') return 'Distributors Sale Voucher Report';
        if (selectedOption === 'totalLimitSale') return 'Total Share/Hadd Limit Sale Report';
        if (selectedOption === 'limitCutting') return 'Limit Cutting Report';
        if (selectedOption === 'billingSheet') return 'Bill Sheet ';
        return '';
    };
    const getSubUserusernames = () => {
        if (subUsers) {
            return subUsers.map(subUser => {
                return {
                    username: subUser.username,
                    role: subUser.role
                }
            })
        }
        return []
    }

    function processAndAddTablesInPDF(pdfDoc, savedPurchases, sorted = false, marginTop = 34) {
        // savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0)

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
                    },
                });

                pdfDoc.setFontSize(10);
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
            pdfDoc.setFontSize(12);
            pdfDoc.text("Total First: " + wtotalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.text("Total Second: " + wtotalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.text("Total: " + wtotal, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
        }
        return wtotal;
    }


    const generateTotalSaleWihtoutGroup = () => {
        let savedPurchases = getTotalOfDistributorFromDraw(currentLoggedInUser.username)
        generateDealSaleVoucherWithoutGroup(savedPurchases, currentLoggedInUser)
    }

    const generateTotalSaleGroupWise = async () => {
        let savedPurchases = getTotalOfDistributorFromDraw(currentLoggedInUser.username)
        const pdfDoc = new jsPDF();
        const columns = ['Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd'];
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.text("Total Sale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        // savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0);
        pdfDoc.setFontSize(10);
        pdfDoc.text("Client: " + currentLoggedInUser.username + ", " + "Draw: " + selectedDraw.title, 15, 30);
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 20, 30, { align: 'right' });
        processAndAddTablesInPDF(pdfDoc, savedPurchases, true, 32)
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
    }

    const getAUser = (username) => {
        return allUsers.find(user => user.username == username)
    }
    const getTotalOfMerchentFromDraw = (username) => {
        let targetUser = getAUser(username)
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
    }

    const addOneTableForDitributor = (pdfDoc, targetUser, savedPurchases, tableMarginTop, isFirst, AllTotal) => {

        // Set font size and display client information
        pdfDoc.setFontSize(10);
        pdfDoc.text("Client: " + targetUser.username + ", " + "Draw: " + selectedDraw.title, 15, tableMarginTop == 32 ? 30 : 10);
        if (isFirst) {
            pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 60, tableMarginTop == 32 ? 30 : 10, { align: 'right' });
            pdfDoc.text("All total " + AllTotal, pdfDoc.internal.pageSize.width - 20, tableMarginTop == 32 ? 30 : 10, { align: 'right' });

        }

        // Divide savedPurchases into parts
        let parts = 4;
        let chunkSize = Math.ceil(savedPurchases.length / parts);
        let dividedArrays = [];

        savedPurchases = savedPurchases.sort((a, b) => {
            return Number('1' + a.bundle) - Number('1' + b.bundle);
        });

        for (let i = 0; i < savedPurchases.length; i += chunkSize) {
            dividedArrays.push(savedPurchases.slice(i, i + chunkSize));
        }

        // Process data and calculate totals
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
        total = totalFirst + totalSecond;

        const columns = ['Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd'];

        // Convert the data to a format compatible with jsPDF autoTable
        let bodyData = newData;
        pdfDoc.autoTable({
            head: [columns],
            body: bodyData,
            theme: 'striped',
            margin: { top: tableMarginTop }, // Adjusted top margin to leave space for the headings and texts
            columnStyles: {
                ...columnStyles
            },
            styles: {
                ...styles
            },
        });

        // Display totals
        pdfDoc.setFontSize(10);
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text("Total First: " + totalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total Second: " + totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total: " + total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.setFont("helvetica", "normal");

    }

    const generateDealSaleVoucherWithoutGroup = async (savedPurchases, targetUser, heading = "Distributor Sale Report") => {
        const pdfDoc = new jsPDF();
        const columns = ['Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd'];
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.text(heading, pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });

        // savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0);


        pdfDoc.setFontSize(10);
        pdfDoc.text("Client: " + targetUser.username + ", " + "Draw: " + selectedDraw.title, 15, 30);
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 20, 30, { align: 'right' });

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
    };


    const isParentOf = (parentUserId, targetUserId) => {
        const findUserById = (userId) => allUsers.find(user => user._id === userId);
        const isDescendant = (ancestor, descendant) => {
            if (!descendant.creator || !ancestor) {
                return false;
            }
            if (descendant.creator._id === ancestor._id) {
                return true;
            }
            return isDescendant(ancestor, findUserById(descendant.creator._id));
        };
        const parentUser = findUserById(parentUserId);
        const targetUser = findUserById(targetUserId);
        if (!parentUser || !targetUser) {
            return false;
        }
        return isDescendant(parentUser, targetUser);
    };

    const getTotalOfDistributorFromDraw = (username) => {
        let targetUser = getAUser(username)
        let targetsMerchents = []  //it inlcludes all kind of child merchents at any level
        allUsers.forEach(user => {
            if (user.role == "merchent" && isParentOf(targetUser._id, user._id)) {
                targetsMerchents.push(user)
            }
        })

        let drawDataArray = []
        targetsMerchents.forEach(merchent => {
            let merchentsDrawDataArray = merchent.savedPurchasesFromDrawsData.filter(data => data.drawId == selectedDraw._id)
            drawDataArray = [...drawDataArray, ...merchentsDrawDataArray]
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
    }

    const generateDealSaleVoucherForAllDealersWithoutGroup = async () => {
        const pdfDoc = new jsPDF();
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.text(dealerSaleVoucherForm.dealer == "allDealers" ? "All Distributors Sale Voucher" : "Distributor Sale Voucher", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        let added = false
        let first = true;

        let firstTotal = 0, secondTotal = 0, total = 0;
        subUsers.forEach(user => {
            let savedPurchases = getTotalOfDistributorFromDraw(user.username)
            savedPurchases.forEach(purchase => {
                firstTotal += Number(purchase.first)
                secondTotal += Number(purchase.second)
            })
        })
        total += firstTotal + secondTotal
        subUsers.forEach(user => {
            if (user.role == "distributor") {
                let savedPurchases = getTotalOfDistributorFromDraw(user.username)
                if (savedPurchases.length > 0) {
                    if (added) {
                        pdfDoc.addPage()
                    }
                    if (first) {
                        addOneTableForDitributor(pdfDoc, user, savedPurchases, 32, true, total)
                        first = false;
                    } else {
                        addOneTableForDitributor(pdfDoc, user, savedPurchases, 12, false, total)
                    }
                    added = true
                }
            }
        })
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
    }
    const generateDealerSaleVoucherWihtoutGroup = () => {
        let targetUser = getAUser(dealerSaleVoucherForm.dealer)
        if (dealerSaleVoucherForm.dealer == "allDealers") {
            generateDealSaleVoucherForAllDealersWithoutGroup()
            return;
        }
        else {
            let savedPurchases = getTotalOfDistributorFromDraw(targetUser.username)
            generateDealSaleVoucherWithoutGroup(savedPurchases, targetUser)
        }
    }
    const getShareValue = (price, share) => {
        return Number(((share / 100) * price).toFixed(1))
    }

    const getTotalOfDistributorFromDrawForTotalLimitShareEnabled = (targetUser) => {
        let share = Number(targetUser.commission.share)
        let pcPercentage = Number(targetUser.commission.pcPercentage)

        let savedPurchases = getTotalOfDistributorFromDraw(targetUser.username)
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
            return updatedSavedPurchases;
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
            return updatedSavedPurchases;
        }
    }


    const getTotalOfDistributorFromDrawForTotalLimitHaddEnabled = (targetUser) => {
        let hadd = {};
        hadd = targetUser.hadd;
        let savedPurchases = getTotalOfDistributorFromDraw(targetUser.username)
        let updatedSavedPurchases = []
        if (totalLimitSaleForm.limitType == "upLimit") {
            updatedSavedPurchases = savedPurchases.map(purchase => {
                let newData = { ...purchase }
                if (purchase.bundle.length == 1) {
                    newData.first = Number(newData.first) - Number(hadd.hindsyKiHad1);
                    newData.second = Number(newData.second) - Number(hadd.hindsyKiHad2);
                } else if (purchase.bundle.length == 2) {
                    newData.first = Number(newData.first) - Number(hadd.akraKiHad1);
                    newData.second = Number(newData.second) - Number(hadd.akraKiHad2);
                } else if (purchase.bundle.length == 3) {
                    newData.first = Number(newData.first) - Number(hadd.firstTendolaKiHad);
                    newData.second = Number(newData.second) - Number(hadd.secondTendolaKiHad);
                } else if (purchase.bundle.length == 4) {
                    newData.first = Number(newData.first) - Number(hadd.firstPangodaKiHad);
                    newData.second = Number(newData.second) - Number(hadd.secondPangodaKiHad);
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
            return updatedSavedPurchases;
        } else if (totalLimitSaleForm.limitType == "downLimit") {
            function getDownLimitProcessedPurchase(purchase, had1, had2) {
                let newData = { ...purchase }
                if (Number(newData.first) > Number(had1))
                    newData.first = Number(had1)
                if (Number(newData.second) > Number(had2))
                    newData.second = Number(had2)
                return newData
            }
            updatedSavedPurchases = savedPurchases.map(purchase => {
                let newData = { ...purchase }
                if (purchase.bundle.length == 1) {
                    newData = getDownLimitProcessedPurchase(newData, hadd.hindsyKiHad1, hadd.hindsyKiHad2)
                } else if (purchase.bundle.length == 2) {
                    newData = getDownLimitProcessedPurchase(newData, hadd.akraKiHad1, hadd.akraKiHad2)
                } else if (purchase.bundle.length == 3) {
                    newData = getDownLimitProcessedPurchase(newData, hadd.firstTendolaKiHad, hadd.secondTendolaKiHad)
                } else if (purchase.bundle.length == 4) {
                    newData = getDownLimitProcessedPurchase(newData, hadd.firstPangodaKiHad, hadd.secondPangodaKiHad)
                }
                return newData
            })
            return updatedSavedPurchases;
        }
    }

    function aggregateSavedPurchases(savedPurchases) {
        const result = [];
        function getPurchaseFromResult(purchase) {
            return result.find(rePurchase => rePurchase.bundle == purchase.bundle)
        }
        savedPurchases.forEach((purchase) => {
            let purchaseFromResult = getPurchaseFromResult(purchase)
            if (purchaseFromResult) {
                purchaseFromResult.first += Number(purchase.first)
                purchaseFromResult.second += Number(purchase.second)
            } else {
                let newData = { ...purchase }
                newData.first = Number(newData.first)
                newData.second = Number(newData.second)
                result.push(newData)
            }
        });
        return result;
    }
    const getTotalOfDistributorFromDrawForTotalLimit = (targetUser) => {
        if (targetUser.username == "admin") {
            let savedPurchases = []
            subUsers.forEach(subUser => {
                let tempSavedPurchases = []
                if (subUser.commission.shareEnabled) {
                    tempSavedPurchases = getTotalOfDistributorFromDrawForTotalLimitShareEnabled(subUser)
                } else if (subUser.hadd.haddEnabled) {
                    tempSavedPurchases = getTotalOfDistributorFromDrawForTotalLimitHaddEnabled(subUser)
                } else {
                    return []
                }
                savedPurchases = [...savedPurchases, ...tempSavedPurchases]
            })
            return aggregateSavedPurchases(savedPurchases)
        } else {
            if (targetUser.commission.shareEnabled) {
                return getTotalOfDistributorFromDrawForTotalLimitShareEnabled(targetUser)
            } else if (targetUser.hadd.haddEnabled) {
                return getTotalOfDistributorFromDrawForTotalLimitHaddEnabled(targetUser)
            } else {
                return []
            }
        }
    }
    const getAllDirectSubUsersOf = (username) => {
        let directSubUsers = []
        return allUsers.filter(subUser => ((subUser.username != "admin" && subUser.creator.username == username)))
    }
    const generateTotalLimitSaleForAllDealersSeparateWithoutGroup = async () => {
        const pdfDoc = new jsPDF();
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });

        pdfDoc.text(totalLimitSaleForm.dealer.includes("allDealers") ? "All Distributors Share/Hadd Limit Sale" : "Distributor Share/Hadd Limit Sale ", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        let added = false
        let first = true;

        let firstTotal = 0, secondTotal = 0, total = 0;
        subUsers.forEach(user => {
            let savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(getAUser(user.username));

            savedPurchases.forEach(purchase => {
                firstTotal += Number(purchase.first)
                secondTotal += Number(purchase.second)
            })
        })
        total += firstTotal + secondTotal

        subUsers.forEach(user => {
            if (user.role == "distributor") {
                let savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(getAUser(user.username));
                if (savedPurchases.length > 0) {
                    if (added) {
                        pdfDoc.addPage()
                    }
                    if (first) {
                        addOneTableForDitributor(pdfDoc, user, savedPurchases, 32, true, total)
                        first = false;
                    } else {
                        addOneTableForDitributor(pdfDoc, user, savedPurchases, 12, false, total)
                    }
                    added = true
                }
            }
        })
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
    }
    const generateTotalLimitSaleWihtoutGroup = () => {
        let savedPurchases = [];
        let heading = ""
        let targetUser = {}
        if (totalLimitSaleForm.dealer == "allDealersCombined") {
            targetUser = getAUser("admin")
            savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(targetUser)
        } else if (totalLimitSaleForm.dealer == "allDealersSeparate") {
            generateTotalLimitSaleForAllDealersSeparateWithoutGroup()
            return
        }
        else {
            targetUser = getAUser(totalLimitSaleForm.dealer)
            if (targetUser.commission.shareEnabled) {
                heading = "Distributor Share Limit Sale"
            } else if (targetUser.hadd.haddEnabled) {
                heading = "Distributor Hadd Limit Sale"
            } else {
                alert("No option is enabled from Share or Hadd")
                return
            }
            savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(targetUser)
        }
        generateDealSaleVoucherWithoutGroup(savedPurchases, targetUser, totalLimitSaleForm.dealer.includes("allDealers") ? "All Distributors Hadd/Share Limit Sale" : heading)
    }

    const generateTotalLimitSaleGroupWise = async () => {
        let targetUser = {}
        let savedPurchases = [];
        let heading = ""

        if (totalLimitSaleForm.dealer == "allDealersSeparate")
            return
        if (totalLimitSaleForm.dealer == "allDealersCombined") {
            targetUser = getAUser("admin")
        } else {
            targetUser = getAUser(totalLimitSaleForm.dealer)
            if (targetUser.commission.shareEnabled) {
                heading = "Distributor Share Limit Sale"
            } else if (targetUser.hadd.haddEnabled) {
                heading = "Distributor Hadd Limit Sale"
            } else {
                alert("No option is enabled from Share or Hadd")
                return
            }
        }


        savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(targetUser)
        const pdfDoc = new jsPDF();
        const columns = ['Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd'];
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.text(totalLimitSaleForm.dealer.includes("allDealers") ? "All Distributors Share/Hadd Limit Sale" : heading, pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        // savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0);
        pdfDoc.setFontSize(10);
        pdfDoc.text("Client: " + targetUser.username + ", " + "Draw: " + selectedDraw.title, 15, 30);
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 20, 30, { align: 'right' });
        processAndAddTablesInPDF(pdfDoc, savedPurchases, true, 32)
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
    }



    const getTotalOfDistributorFromDrawForLimitCutting = () => {
        let savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(getAUser("admin"))
        if (limitCuttingForm.bundleType != "all") {
            if (limitCuttingForm.bundleType == "A")
                savedPurchases = savedPurchases.filter(purchase => purchase.bundle.length == "1")
            if (limitCuttingForm.bundleType == "B")
                savedPurchases = savedPurchases.filter(purchase => purchase.bundle.length == "2")
            if (limitCuttingForm.bundleType == "C")
                savedPurchases = savedPurchases.filter(purchase => purchase.bundle.length == "3")
            if (limitCuttingForm.bundleType == "D")
                savedPurchases = savedPurchases.filter(purchase => purchase.bundle.length == "4")
        }
        let updatedSavedPurchases = []
        if (limitCuttingForm.limitType == "upLimit") {
            if (limitCuttingForm.bundleType == "all") {
                updatedSavedPurchases = savedPurchases.map(purchase => {
                    let newData = { ...purchase }
                    if (purchase.bundle.length == 1) {
                        newData.first = Number(newData.first) - Number(limitCuttingForm.firstA);
                        newData.second = Number(newData.second) - Number(limitCuttingForm.secondA);
                    } else if (purchase.bundle.length == 2) {
                        newData.first = Number(newData.first) - Number(limitCuttingForm.firstB);
                        newData.second = Number(newData.second) - Number(limitCuttingForm.secondB);
                    } else if (purchase.bundle.length == 3) {
                        newData.first = Number(newData.first) - Number(limitCuttingForm.firstC);
                        newData.second = Number(newData.second) - Number(limitCuttingForm.secondC);
                    } else if (purchase.bundle.length == 4) {
                        newData.first = Number(newData.first) - Number(limitCuttingForm.firstD);
                        newData.second = Number(newData.second) - Number(limitCuttingForm.secondD);
                    }
                    return newData
                })
            } else {
                updatedSavedPurchases = savedPurchases.map(purchase => {
                    let newData = { ...purchase }
                    newData.first = Number(newData.first) - Number(limitCuttingForm.indFirst);
                    newData.second = Number(newData.second) - Number(limitCuttingForm.indSecond);
                    return newData
                })
            }

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
            return updatedSavedPurchases;
        } else if (limitCuttingForm.limitType == "downLimit") {
            function getDownLimitProcessedPurchase(purchase, had1, had2) {
                let newData = { ...purchase }
                if (Number(newData.first) > Number(had1))
                    newData.first = Number(had1)
                if (Number(newData.second) > Number(had2))
                    newData.second = Number(had2)
                return newData
            }
            if (limitCuttingForm.bundleType == "all") {
                updatedSavedPurchases = savedPurchases.map(purchase => {
                    let newData = { ...purchase }
                    if (purchase.bundle.length == 1) {
                        newData = getDownLimitProcessedPurchase(newData, limitCuttingForm.firstA, limitCuttingForm.secondA)
                    } else if (purchase.bundle.length == 2) {
                        newData = getDownLimitProcessedPurchase(newData, limitCuttingForm.firstB, limitCuttingForm.secondB)
                    } else if (purchase.bundle.length == 3) {
                        newData = getDownLimitProcessedPurchase(newData, limitCuttingForm.firstC, limitCuttingForm.secondC)
                    } else if (purchase.bundle.length == 4) {
                        newData = getDownLimitProcessedPurchase(newData, limitCuttingForm.firstD, limitCuttingForm.secondD)
                    }
                    return newData
                })
            } else {
                updatedSavedPurchases = savedPurchases.map(purchase => {
                    let newData = { ...purchase }
                    newData = getDownLimitProcessedPurchase(newData, limitCuttingForm.indFirst, limitCuttingForm.indSecond)
                    return newData
                })
            }
            return updatedSavedPurchases;
        }
    }

    const generateLimitCuttingGroupWise = async () => {
        let targetUser = {}
        targetUser = getAUser(currentLoggedInUser.username)
        let savedPurchases = getTotalOfDistributorFromDrawForLimitCutting();

        const pdfDoc = new jsPDF();
        const columns = ['Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd'];
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.text("Limit Cutting Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        // savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0);
        pdfDoc.setFontSize(10);
        pdfDoc.text("Client: " + targetUser.username + ", " + "Draw: " + selectedDraw.title, 15, 30);
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 20, 30, { align: 'right' });
        processAndAddTablesInPDF(pdfDoc, savedPurchases, true, 32)
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
    }

    function checkForButton() {
        if (limitCuttingForm.bundleType == "all") {
            let notAllow = (!limitCuttingForm.firstA || !limitCuttingForm.secondA || !limitCuttingForm.firstB || !limitCuttingForm.secondB || !limitCuttingForm.firstC || !limitCuttingForm.secondC || !limitCuttingForm.firstD || !limitCuttingForm.secondD)
            return !notAllow
        } else {
            let notAllow = (!limitCuttingForm.indFirst || !limitCuttingForm.indSecond)
            return !notAllow
        }
    }
    let enableLimitCuttinButton = checkForButton()


    const addBillSheetOfADistributor = async (pdfDoc, targetUser, result) => {
        let x1 = 5, x2 = 140;
        let y = 20, ySpace = 7
        pdfDoc.setFontSize(20);
        let head1="Bill Sheet";
        if(billingSheetForm.limitType=="apply"){
            head1+=targetUser.haddEnabled? "- Hadd Sale": "- Share Sale"
        }

        pdfDoc.text(head1 , pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        // pdfDoc.text("Limit Cutting Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
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
            body: [[0, result.totalSale, formatTime(selectedDraw.drawTime)]],
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
        let ABCPrize = ABCFirstTotalPrize + ABCSecondTotalPrize
        let DPrize = DFirstTotalPrize + DSecondTotalPrize
        return { ABCPrize, DPrize, totalPrize: ABCPrize + DPrize }
    }
    const calculateResultOfDistributor = (targetUser, savedPurchases) => {
        let { ABCFirstTotal, ABCSecondTotal, DFirstTotal, DSecondTotal } = calculateTotalsInFormat(savedPurchases)
        let ABCTotalSale = ABCFirstTotal + ABCSecondTotal;
        let DTotalSale = DFirstTotal + DSecondTotal;
        let commission = Number(((Number(targetUser.commission.commision) / 100) * ABCTotalSale).toFixed(1))
        let PCCommission = Number(((Number(targetUser.commission.pcPercentage) / 100) * DTotalSale).toFixed(1))
        let totalSale = ABCTotalSale + DTotalSale
        let totalCommission = commission + PCCommission
        let extraSale = totalSale - totalCommission
        let ABCExtraSale = ABCTotalSale - commission
        let DExtraSale = DTotalSale - PCCommission

        let prize = calculatePrize(targetUser, savedPurchases)
        let bill = extraSale - prize.totalPrize
        let ABCBill = ABCExtraSale - prize.ABCPrize
        let DBill = DExtraSale - prize.DPrize
        let ABCShare = ABCBill * (Number(targetUser.commission.share) / 100)
        let DShare = DBill * (Number(targetUser.commission.pcShare) / 100)
        let totalShare = ABCShare + DShare
        let totalABCBill = ABCBill - ABCShare
        let totalDBill = DBill - DShare
        let totalBill = totalABCBill + totalDBill
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
    const generateBillingSheet = async () => {
        const pdfDoc = new jsPDF();
        if (billingSheetForm.dealer == "allDealers") {
            for (let i = 0; i < subUsers.length; i++) {
                let targetUser = getAUser(subUsers[i].username)
                let savedPurchases = []
                if (billingSheetForm.limitType == "apply") {
                    savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(targetUser)
                } else {
                    savedPurchases = getTotalOfDistributorFromDraw(targetUser.username)
                }
                let result = calculateResultOfDistributor(targetUser, savedPurchases)
                addBillSheetOfADistributor(pdfDoc, targetUser, result)
                if (i + 1 < subUsers.length) {
                    pdfDoc.addPage()
                }
            }
        } else {
            let targetUser = getAUser(billingSheetForm.dealer)
            let savedPurchases = []
            if (billingSheetForm.limitType == "apply") {
                savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(targetUser)
            } else {
                savedPurchases = getTotalOfDistributorFromDraw(targetUser.username)
            }

            let result = calculateResultOfDistributor(targetUser, savedPurchases)
            addBillSheetOfADistributor(pdfDoc, targetUser, result)
        }
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
        let targetUser = getAUser("admin")
        const pdfDoc = new jsPDF();
        pdfDoc.setFontSize(20);
        pdfDoc.text("Bill Sheet Summary"+(billingSheetForm.limitType=="apply" ? " - Limit Sale":""), pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.setFontSize(12);
        pdfDoc.text("Client: " + targetUser.username + ", " + "Draw: " + selectedDraw.title, 15, 25);
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 20, 25, { align: 'right' });

        const columns = ['Id', 'Name', 'Ammount', 'Commission', 'Gross', 'Prize', 'NetBalance', 'Share', 'Result'];
        let bodyData = []
        for (let i = 0; i < subUsers.length; i++) {
            let targetUser = getAUser(subUsers[i].username)
            let savedPurchases = []
            if(billingSheetForm.limitType=="apply"){
                savedPurchases =getTotalOfDistributorFromDrawForTotalLimit(targetUser)
            }else{
                savedPurchases =getTotalOfDistributorFromDraw(targetUser.username)
            }
            let result = calculateResultOfDistributor(targetUser, savedPurchases)
            let id = targetUser.userId, name = targetUser.generalInfo.name;
            let amount = result.totalSale;
            let commission = result.totalCommission
            let gross = Number((amount - commission).toFixed(1))
            let prize = result.totalPrize
            let netBalance = Number((gross - prize).toFixed(1))
            let share = result.totalShare
            let outputResult = Number((netBalance - share).toFixed(1))
            bodyData.push([id, name, amount, commission, gross, prize, netBalance, share, outputResult])
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

            <h3>Admin Reports</h3>
            <hr />
            <Row>
                <Col xs={12} md={4}>
                    <Card>
                        <Card.Header className=""><b>Actions</b></Card.Header>
                        <Card.Body>
                            <Nav className="flex-column" onSelect={handleSelect}>
                                <Nav.Link eventKey="totalSale" style={{ background: (selectedOption == "totalSale" ? "lightgray" : "") }}>Total Sale</Nav.Link>
                                <Nav.Link eventKey="totalLimitSale" style={{ background: (selectedOption == "totalLimitSale" ? "lightgray" : "") }} >Total Share/Hadd Limit Sale Report</Nav.Link>
                                <Nav.Link eventKey="dealerSaleVoucher" style={{ background: (selectedOption == "dealerSaleVoucher" ? "lightgray" : "") }} >Distributors Sale Voucher</Nav.Link>
                                <Nav.Link eventKey="limitCutting" style={{ background: (selectedOption == "limitCutting" ? "lightgray" : "") }} >Limit Cutting</Nav.Link>
                                <Nav.Link eventKey="billingSheet" style={{ background: (selectedOption == "billingSheet" ? "lightgray" : "") }} >Bill Sheet</Nav.Link>

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
                                            <Form.Label>Dealer</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="dealer"
                                                value={billingSheetForm.dealer}
                                                onChange={handleBillingSheetChange}
                                            >
                                                <option value="allDealers">All Distributors</option>
                                                {getSubUserusernames().map(user => {
                                                    return (
                                                        <option value={user.username} >{user.username}</option>
                                                    )
                                                })}
                                            </Form.Control>
                                        </Col>
                                    </Row>
                                    <Row className='mt-3'>
                                        <Col>
                                            <Form.Label>Limit/Share</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="limitType"
                                                value={billingSheetForm.limitType}
                                                onChange={handleBillingSheetChange}
                                            >
                                                <option value="apply">Apply</option>
                                                <option value="notApply">Not Apply</option>
                                            </Form.Control>
                                        </Col>
                                    </Row>
                                </Form>
                            )}

                            {selectedOption === 'totalLimitSale' && (
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
                                            <Form.Label>Dealer</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="dealer"
                                                value={totalLimitSaleForm.dealer}
                                                onChange={handleTotalLimitSaleChange}
                                            >
                                                <option value="allDealersCombined">All Distributors Combined</option>
                                                <option value="allDealersSeparate">All Distributors Separate</option>
                                                {getSubUserusernames().map(user => {
                                                    return (
                                                        <option value={user.username} >{user.username}</option>
                                                    )
                                                })}
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
                                                value={totalLimitSaleForm.reportType}
                                                onChange={handleTotalLimitSaleChange}
                                            >
                                                <option value="withoutGroup">Without Group</option>
                                                <option value="groupWise">Group-Wise</option>
                                            </Form.Control>
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

                            {selectedOption === 'dealerSaleVoucher' && (
                                <Form>
                                    <Row>
                                        <Col>
                                            <Form.Label>Date</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                type="date"
                                                name="date"
                                                value={dealerSaleVoucherForm.date}
                                                onChange={handleDealerSaleVoucherChange}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className='mt-3'>
                                        <Col>
                                            <Form.Label>Dealer</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="dealer"
                                                value={dealerSaleVoucherForm.dealer}
                                                onChange={handleDealerSaleVoucherChange}
                                            >
                                                <option value="allDealers">All Distributors</option>
                                                {getSubUserusernames().map(user => {
                                                    return (
                                                        <option value={user.username} >{user.username}</option>
                                                    )
                                                })}
                                            </Form.Control>
                                        </Col>
                                    </Row>

                                </Form>
                            )}

                            {selectedOption === 'limitCutting' && (
                                <Form>
                                    <Row>
                                        <Col>
                                            <Form.Label>Date</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                type="date"
                                                name="date"
                                                value={limitCuttingForm.date}
                                                onChange={handleLimitCuttingChange}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className='mt-3'>
                                        <Col>
                                            <Form.Label>Bundle</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="bundleType"
                                                value={limitCuttingForm.bundleType}
                                                onChange={handleLimitCuttingChange}
                                            >
                                                <option value="all">All</option>
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                            </Form.Control>
                                        </Col>
                                    </Row>
                                    {limitCuttingForm.bundleType == "all" &&
                                        <>
                                            <Row className='mt-3'>
                                                <Col>
                                                    <Form.Label>First A</Form.Label>
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        type="number"
                                                        name="firstA"
                                                        value={limitCuttingForm.firstA}
                                                        onChange={handleLimitCuttingChange}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row className='mt-3'>
                                                <Col>
                                                    <Form.Label>Second A</Form.Label>
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        type="number"
                                                        name="secondA"
                                                        value={limitCuttingForm.secondA}
                                                        onChange={handleLimitCuttingChange}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row className='mt-3'>
                                                <Col>
                                                    <Form.Label>First B</Form.Label>
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        type="number"
                                                        name="firstB"
                                                        value={limitCuttingForm.firstB}
                                                        onChange={handleLimitCuttingChange}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row className='mt-3'>
                                                <Col>
                                                    <Form.Label>Second B</Form.Label>
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        type="number"
                                                        name="secondB"
                                                        value={limitCuttingForm.secondB}
                                                        onChange={handleLimitCuttingChange}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row className='mt-3'>
                                                <Col>
                                                    <Form.Label>First C</Form.Label>
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        type="number"
                                                        name="firstC"
                                                        value={limitCuttingForm.firstC}
                                                        onChange={handleLimitCuttingChange}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row className='mt-3'>
                                                <Col>
                                                    <Form.Label>Second C</Form.Label>
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        type="number"
                                                        name="secondC"
                                                        value={limitCuttingForm.secondC}
                                                        onChange={handleLimitCuttingChange}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row className='mt-3'>
                                                <Col>
                                                    <Form.Label>First D</Form.Label>
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        type="number"
                                                        name="firstD"
                                                        value={limitCuttingForm.firstD}
                                                        onChange={handleLimitCuttingChange}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row className='mt-3'>
                                                <Col>
                                                    <Form.Label>Second D</Form.Label>
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        type="number"
                                                        name="secondD"
                                                        value={limitCuttingForm.secondD}
                                                        onChange={handleLimitCuttingChange}
                                                    />
                                                </Col>
                                            </Row>
                                        </>
                                    }


                                    {limitCuttingForm.bundleType != "all" &&
                                        <>
                                            <Row className='mt-3'>
                                                <Col>
                                                    <Form.Label>First</Form.Label>
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        type="number"
                                                        name="indFirst"
                                                        value={limitCuttingForm.indFirst}
                                                        onChange={handleLimitCuttingChange}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row className='mt-3'>
                                                <Col>
                                                    <Form.Label>Second</Form.Label>
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        type="number"
                                                        name="indSecond"
                                                        value={limitCuttingForm.indSecond}
                                                        onChange={handleLimitCuttingChange}
                                                    />
                                                </Col>
                                            </Row>
                                        </>
                                    }


                                    <Row className='mt-3'>
                                        <Col>
                                            <Form.Label>Limit Type</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                name="limitType"
                                                value={limitCuttingForm.limitType}
                                                onChange={handleLimitCuttingChange}
                                            >
                                                <option value="upLimit">Up Limit</option>
                                                <option value="downLimit">Down Limit</option>
                                            </Form.Control>
                                        </Col>
                                    </Row>

                                </Form>
                            )}

                        </Card.Body>
                        {selectedOption === 'dealerSaleVoucher' && (
                            <Card.Footer>
                                <div className="d-flex flex-wrap justify-content-start">
                                    <Button variant="primary btn btn-sm m-1"
                                        onClick={() => { generateDealerSaleVoucherWihtoutGroup() }}
                                        disabled={!dealerSaleVoucherForm.date || !dealerSaleVoucherForm.dealer}
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
                                        onClick={() => (totalSaleForm.reportType == "withoutGroup" ? generateTotalSaleWihtoutGroup() : generateTotalSaleGroupWise())}
                                        disabled={!totalSaleForm.date || !totalSaleForm.reportType}
                                    >
                                        Report
                                    </Button>

                                </div>
                            </Card.Footer>
                        )}
                        {selectedOption === 'totalLimitSale' && (
                            <Card.Footer>
                                <div className="d-flex flex-wrap justify-content-start">
                                    <Button variant="primary btn btn-sm m-1"
                                        onClick={() => (totalLimitSaleForm.reportType == "withoutGroup" ? generateTotalLimitSaleWihtoutGroup() : generateTotalLimitSaleGroupWise())}
                                        disabled={!totalLimitSaleForm.date || !totalLimitSaleForm.reportType || !totalLimitSaleForm.dealer}
                                    >
                                        Report
                                    </Button>

                                </div>
                            </Card.Footer>
                        )}
                        {selectedOption === 'limitCutting' && (
                            <Card.Footer>
                                <div className="d-flex flex-wrap justify-content-start">
                                    <Button variant="primary btn btn-sm m-1"
                                        onClick={() => generateLimitCuttingGroupWise()}
                                        disabled={!limitCuttingForm.date || !limitCuttingForm.bundleType || !limitCuttingForm.limitType || !enableLimitCuttinButton}
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
                                        disabled={!billingSheetForm.date || !billingSheetForm.dealer}
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
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminReports;
