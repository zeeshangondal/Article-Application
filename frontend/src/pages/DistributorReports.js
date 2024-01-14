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

const DistributorReports = () => {
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
    const [totalLimitSaleForm, setTotalLimitSaleForm] = useState({
        date: '',
        limitType: 'upLimit'
    });

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
        setTotalLimitSaleForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

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
            setTotalSaleForm({
                date: '',
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
        if (selectedOption === 'dealerSaleVoucher') return 'Dealer Sale Voucher Report';
        if (selectedOption === 'totalLimitSale') return `Total ${localStorageUtils.getLoggedInUser().commission.shareEnabled ? "Share" : "Hadd"} Limit Sale`;
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


    const generateTotalSaleWihtoutGroup = () => {
        let savedPurchases = getTotalOfDistributorFromDraw(currentLoggedInUser.username)
        generateDealSaleVoucherWithoutGroup(savedPurchases, currentLoggedInUser)
    }

    const generateTotalSaleGroupWise = async () => {
        let savedPurchases = getTotalOfDistributorFromDraw(currentLoggedInUser.username)
        const pdfDoc = new jsPDF();
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.text("Total Sale Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0);
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
            }

        });

        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text("Total First: " + totalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total Second: " + totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total: " + total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.setFont("helvetica", "normal");

    }

    const generateDealSaleVoucherWithoutGroup = async (savedPurchases, targetUser, heading = "Dealer Sale Voucher Report") => {
        const pdfDoc = new jsPDF();
        const columns = ['Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd', 'Bun', '   1st', '   2nd'];
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.text(heading, pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });

        savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0);


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
        pdfDoc.text(dealerSaleVoucherForm.dealer == "allDealers" ? "All Dealers Sale Voucher Report" : "Dealer Sale Voucher Report", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
        let added = false
        let first = true;
        let firstTotal = 0, secondTotal = 0, total = 0;
        subUsers.forEach(user => {
            let savedPurchases = []
            if (user.role == "merchent") {
                savedPurchases = getTotalOfMerchentFromDraw(user.username)
            }
            else {
                savedPurchases = getTotalOfDistributorFromDraw(user.username)
            }
            savedPurchases.forEach(purchase => {
                firstTotal += Number(purchase.first)
                secondTotal += Number(purchase.second)
            })
        })
        total += firstTotal + secondTotal

        subUsers.forEach(user => {
            if (user.role == "merchent") {
                let savedPurchases = getTotalOfMerchentFromDraw(user.username)
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
            else if (user.role == "distributor") {
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
        if (targetUser.role == "merchent") {
            let savedPurchases = getTotalOfMerchentFromDraw(targetUser.username)
            generateDealSaleVoucherWithoutGroup(savedPurchases, targetUser)
            return
        } else {
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
            updatedSavedPurchases = updatedSavedPurchases.filter(purchase => {
                if (purchase.first > 0 || purchase.second > 0)
                    return true
                else
                    return false
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
    const getTotalOfDistributorFromDrawForTotalLimit = (targetUser) => {
        if (targetUser.commission.shareEnabled) {
            return getTotalOfDistributorFromDrawForTotalLimitShareEnabled(targetUser)
        } else if (targetUser.hadd.haddEnabled) {
            return getTotalOfDistributorFromDrawForTotalLimitHaddEnabled(targetUser)
        } else {
            return []
        }
    }

    const generateTotalLimitSaleWihtoutGroup = () => {
        let targetUser = {}
        targetUser = getAUser(currentLoggedInUser.username)

        let savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(targetUser);
        let heading = ""
        if (targetUser.commission.shareEnabled) {
            heading = "Distributor Share Limit Sale"
        } else if (targetUser.hadd.haddEnabled) {
            heading = "Distributor Hadd Limit Sale"
        } else {
            alert("Your Share is not enabled")
            return
        }
        generateDealSaleVoucherWithoutGroup(savedPurchases, targetUser, heading)
    }

    function getHeadingForLimitSaleNotPermission() {
        if (localStorageUtils.getLoggedInUser().creator.username == "admin") {
            return "Admin has not allowed"
        } else {
            return "Your Distributor has not allowed"
        }
    }
    return (
        <div className='container mt-4'>
            <CustomNotification notification={notification} setNotification={setNotification} />

            <h3>Distributor Reports</h3>
            <hr />
            <Row>
                <Col xs={12} md={4}>
                    <Card>
                        <Card.Header className=""><b>Actions</b></Card.Header>
                        <Card.Body>
                            <Nav className="flex-column" onSelect={handleSelect}>
                                <Nav.Link eventKey="totalSale" style={{ background: (selectedOption == "totalSale" ? "lightgray" : "") }}>Total Sale</Nav.Link>
                                <Nav.Link eventKey="dealerSaleVoucher" style={{ background: (selectedOption == "dealerSaleVoucher" ? "lightgray" : "") }} >Dealer Sale Voucher</Nav.Link>
                                <Nav.Link eventKey="totalLimitSale" style={{ background: (selectedOption == "totalLimitSale" ? "lightgray" : "") }} >Total {localStorageUtils.getLoggedInUser().commission.shareEnabled ? "Share" : "Hadd"} Limit Sale</Nav.Link>

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
                                                value={dealerSaleVoucherForm.dealerSaleVoucher}
                                                onChange={handleDealerSaleVoucherChange}
                                            >
                                                <option value="allDealers">All Dealers</option>
                                                {getSubUserusernames().map(user => {
                                                    return (
                                                        <option value={user.username} style={{ backgroundColor: user.role == "merchent" ? "red" : "blue" }}>{user.username}</option>
                                                    )
                                                })}
                                            </Form.Control>
                                        </Col>
                                    </Row>

                                </Form>
                            )}
                            {selectedOption === 'totalLimitSale' && !localStorageUtils.getLoggedInUser().generalInfo.enableLimitSaleReportView &&
                                <div className='d-flex justify-content-center'>
                                    {window.innerWidth <= 600 ?
                                        <h6>{getHeadingForLimitSaleNotPermission()}</h6>
                                        :
                                        <h4>{getHeadingForLimitSaleNotPermission()}</h4>
                                    }
                                </div>
                            }
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

export default DistributorReports;
