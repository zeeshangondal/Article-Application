import React, { useEffect, useState } from 'react';
import { Row, Col, Nav, Form, FormGroup, Button, Card } from 'react-bootstrap';
import DrawAPIs from '../APIs/draws';
import APIs from '../APIs/users';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { useNavigate } from 'react-router-dom';
import CustomNotification from '../components/CustomNotification';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getPrizeBundlesArray, savePdfOnBackend } from '../APIs/utils';
import { columnStyles, styles } from './pdfTableStyle';
import { formatNumberWithTwoDecimals, formatTime } from '../Utils/Utils';

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
    const [billingSheetForm, setBillingSheetForm] = useState({
        date: '',
        dealer: 'allDealers',
        limitType: 'apply'
    });
    let prizeBundles = []
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


    const getTheMainCreatorOfUser = (_id) => {
        try {
            if(allUsers.length==0){
                return false
            }
    
            // Find the admin user
            let adminUser = allUsers.find(user => user.role === "admin");
            let adminId = adminUser._id;
    
            // Helper function to get user data by ID
            const getUserDataById = (usersArray, userId) => {
                return usersArray.find(user => user._id === userId);
            };
    
            let mainCreator = {};
            let askingUser = _id;
    
            // Loop until we find the main creator
            while (true) {
                mainCreator = getUserDataById(allUsers, askingUser);
    
                if (!mainCreator) {
                    // User not found
                    throw new Error('User not found');
                }
    
                if (mainCreator.creator === adminId) {
                    // If the creator is the admin, return the main creator
                    return mainCreator;
                }
    
                askingUser = mainCreator.creator;
            }
        } catch (e) {
            console.error("Error:", e);
        }
    };
    let parentCreator={generalInfo:{active:true}}
    let tempParent=getTheMainCreatorOfUser(localStorageUtils.getLoggedInUser()._id)
    if(tempParent){
        parentCreator=tempParent
    }
    if (!localStorageUtils.hasToken()) {
        navigate(`/login`);
    }
    if(!(localStorageUtils.getLoggedInUser().generalInfo.active) || !(parentCreator.generalInfo.active)){
        localStorage.removeItem("jwt_token");
        localStorageUtils.removeLoggedInUser();
        window.location = "/login";
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
            setDealerSaleVoucherForm({
                date: '',
                dealer: 'allDealers',
            })
            setTotalSaleForm({
                date: '',
                reportType: 'withoutGroup',
            })
            setBillingSheetForm({
                date: '',
                dealer: 'allDealers',
                limitType: 'apply'
            })
            setTotalLimitSaleForm({
                date: '',
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
    function isDrawResultPosted(draw) {
        if (draw.prize.firstPrize || draw.prize.secondPrize1 || draw.prize.secondPrize2 || draw.prize.secondPrize3 || draw.prize.secondPrize4 || draw.prize.secondPrize5)
            return true
        return false
    }
    const handleBillingSheetChange = (e) => {
        const { name, value } = e.target;
        if (name == "date") {
            let tempDraw = draws.find(draw => draw.drawDate == value)
            if (!tempDraw) {
                alertMessage("No Record of Draw")
                return
            }
            if (!isDrawResultPosted(tempDraw)) {
                alertMessage("Draw result is not posted yet")
                return
            }
            setSelectedDraw(tempDraw)
        }
        setBillingSheetForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

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
        if (selectedOption === 'billingSheet') return 'Bill Sheet';

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

    // function getPrizeBundlesArray(draw) {
    //     function isDrawResultPosted(draw) {
    //         if (draw.prize.firstPrize || draw.prize.secondPrize1 || draw.prize.secondPrize2 || draw.prize.secondPrize3 || draw.prize.secondPrize4 || draw.prize.secondPrize5)
    //             return true
    //         return false
    //     }
    //     if (!isDrawResultPosted(draw)) {
    //         return []
    //     }
    //     let resultArray = []
    //     function getFormatArray(prize) {
    //         const output = [];
    //         for (let i = 1; i <= prize.length; i++) {
    //             output.push(prize.substring(0, i));
    //         }
    //         return output;
    //     }
    //     let arrayOfPrizesStr = []
    //     let { firstPrize, secondPrize1, secondPrize2, secondPrize3, secondPrize4, secondPrize5 } = draw.prize
    //     if (firstPrize) { arrayOfPrizesStr.push(firstPrize) }
    //     if (secondPrize1) { arrayOfPrizesStr.push(secondPrize1) }
    //     if (secondPrize2) { arrayOfPrizesStr.push(secondPrize2) }
    //     if (secondPrize3) { arrayOfPrizesStr.push(secondPrize3) }
    //     if (secondPrize4) { arrayOfPrizesStr.push(secondPrize4) }
    //     if (secondPrize5) { arrayOfPrizesStr.push(secondPrize5) }
    //     arrayOfPrizesStr.forEach(str => {
    //         resultArray = [...resultArray, ...getFormatArray(str)]
    //     })
    //     return resultArray
    // }

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
                prizeBundles = getPrizeBundlesArray(selectedDraw)

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
                    didParseCell: handleParseCell,

                });

                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.text("Total First: " + formatNumberWithTwoDecimals(sectionTableData.totalFirst), 15, pdfDoc.autoTable.previous.finalY + 5);
                pdfDoc.text("Total Second: " + formatNumberWithTwoDecimals(sectionTableData.totalSecond), pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 5);
                pdfDoc.setFontSize(12);
                pdfDoc.setFont("helvetica", "bold");

                pdfDoc.text("Total: " + formatNumberWithTwoDecimals(sectionTableData.total), pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 5);
                pdfDoc.setFontSize(10);

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
            pdfDoc.text("Total First: " + formatNumberWithTwoDecimals(wtotalFirst), 15, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.text("Total Second: " + formatNumberWithTwoDecimals(wtotalSecond), pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.setFontSize(12);

            pdfDoc.text("Total: " + formatNumberWithTwoDecimals(wtotal), pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
            pdfDoc.setFontSize(10);

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
        let unSavedPurchases = targetUser.purchasedFromDrawData.find(data => data.drawId == selectedDraw._id)
        if (unSavedPurchases) {
            drawDataArray = [...drawDataArray, unSavedPurchases]
        }
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
            pdfDoc.setFontSize(12);
            pdfDoc.setFont("helvetica", "bold");

            pdfDoc.text("All total " + AllTotal, pdfDoc.internal.pageSize.width - 20, tableMarginTop == 32 ? 30 : 10, { align: 'right' });
            pdfDoc.setFontSize(10);
            pdfDoc.setFont("helvetica", "normal");

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

        prizeBundles = getPrizeBundlesArray(selectedDraw)

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
            didParseCell: handleParseCell,

        });

        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text("Total First: " + formatNumberWithTwoDecimals(totalFirst), 15, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total Second: " + formatNumberWithTwoDecimals(totalSecond), pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.setFontSize(12);

        pdfDoc.text("Total: " + formatNumberWithTwoDecimals(total), pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.setFontSize(10);

        pdfDoc.setFont("helvetica", "normal");

    }

    const handleParseCell = (data) => {
        function isInPrizeFirst(bundle){
            for(let i=0;i < prizeBundles.length;i++){
                let prizeData=prizeBundles[i]
                if(prizeData[0]==bundle && prizeData[1]=="f"){
                    return true
                }    
            }
            return false            
        }
        function isInPrizeSecond(bundle){
            for(let i=0;i < prizeBundles.length;i++){
                let prizeData=prizeBundles[i]
                if(prizeData[0]==bundle && prizeData[1]=="s"){
                    return true
                }    
            }
            return false            
        }
        if (data.column.index % 3 === 0) {
            let bundleInCell = data.cell.raw + ""
            if (isInPrizeFirst(bundleInCell)) {
                data.cell.styles = {
                    ...data.cell.styles,
                    textColor: 'red', // Keep the red color
                    fontSize: 11, // Increase font size to 12 (customize as needed)
                    fontStyle: 'bold', // Set font style to bold
                };
                data.row.cells[data.column.index+1].styles.textColor='red'
                data.row.cells[data.column.index+2].styles.textColor='red'    
            }
            if (isInPrizeSecond(bundleInCell)) {
                data.cell.styles = {
                    ...data.cell.styles,
                    textColor: 'blue', // Keep the red color
                    fontSize: 11, // Increase font size to 12 (customize as needed)
                    fontStyle: 'bold', // Set font style to bold
                };
                data.row.cells[data.column.index+1].styles.textColor='blue'
                data.row.cells[data.column.index+2].styles.textColor='blue'    
            }

        }
    };

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
        prizeBundles = getPrizeBundlesArray(selectedDraw)

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
            },
            didParseCell: handleParseCell,
        });
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text("Total First: " + formatNumberWithTwoDecimals(totalFirst), 15, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total Second: " + formatNumberWithTwoDecimals(totalSecond), pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.setFontSize(12);

        pdfDoc.text("Total: " + formatNumberWithTwoDecimals(total), pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.setFontSize(10);

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
            let unSavedPurchases = merchent.purchasedFromDrawData.find(data => data.drawId == selectedDraw._id)
            if (unSavedPurchases) {
                drawDataArray = [...drawDataArray, unSavedPurchases]
            }
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

    const getTotalOfDistributorFromDrawForTotalLimitShareEnabled = (targetUser, billing = false) => {
        let share = Number(targetUser.commission.share)
        let pcPercentage = Number(targetUser.commission.pcPercentage)

        let savedPurchases = getTotalOfDistributorFromDraw(targetUser.username)
        let updatedSavedPurchases = []
        if (billing || totalLimitSaleForm.limitType == "upLimit") {
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


    const getTotalOfDistributorFromDrawForTotalLimitHaddEnabled = (targetUser, billing = false) => {
        let hadd = {};
        hadd = targetUser.hadd;
        let savedPurchases = getTotalOfDistributorFromDraw(targetUser.username)
        let updatedSavedPurchases = []
        if (billing || totalLimitSaleForm.limitType == "upLimit") {
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
    const getTotalOfDistributorFromDrawForTotalLimit = (targetUser, billing = false) => {
        if (targetUser.commission.shareEnabled) {
            return getTotalOfDistributorFromDrawForTotalLimitShareEnabled(targetUser, billing).map(data => ({ ...data, first: formatNumberWithTwoDecimals(data.first), second: formatNumberWithTwoDecimals(data.second) }))
        } else if (targetUser.hadd.haddEnabled) {
            return getTotalOfDistributorFromDrawForTotalLimitHaddEnabled(targetUser, billing).map(data => ({ ...data, first: formatNumberWithTwoDecimals(data.first), second: formatNumberWithTwoDecimals(data.second) }))
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

    const addBillSheetOfADistributor = async (pdfDoc, targetUser, result) => {
        if(result.totalSale<=0){
            return
        }
        let x1 = 5, x2 = 140;
        let y = 20, ySpace = 7
        pdfDoc.setFontSize(20);
        let head1 = "Bill Sheet";
        if (targetUser.role == "distributor" && billingSheetForm.limitType == "apply") {
            head1 += targetUser.haddEnabled ? "- Hadd Sale" : "- Share Sale"
        }
        if (targetUser.role == "distributor") {
            pdfDoc.setTextColor(0, 0, 255);
        } else {
            pdfDoc.setTextColor(255, 0, 0);
        }
        pdfDoc.text(head1, pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.setTextColor(0, 0, 0);
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
        // pdfDoc.text("A+B+C First:", x1, y + 11 * ySpace); pdfDoc.text(result.ABCFirstTotal + "", x1 + 40, y + 11 * ySpace);
        // pdfDoc.text("D First:", x2, y + 11 * ySpace); pdfDoc.text(result.DFirstTotal + "", x2 + 40, y + 11 * ySpace);

        // pdfDoc.text("A+B+C Second:", x1, y + 12 * ySpace); pdfDoc.text(result.ABCSecondTotal + "", x1 + 40, y + 12 * ySpace);
        // pdfDoc.text("D Second:", x2, y + 12 * ySpace); pdfDoc.text(result.DSecondTotal + "", x2 + 40, y + 12 * ySpace);

        pdfDoc.text("ABC Total Sale:", x1, y + 11 * ySpace); pdfDoc.text(result.ABCTotalSale + "", x1 + 40, y + 11 * ySpace);//ABC total
        pdfDoc.text("PC Total Sale:", x2, y + 11 * ySpace); pdfDoc.text(result.DTotalSale + "", x2 + 40, y + 11 * ySpace);//D total

        pdfDoc.text("ABC Commission:", x1, y + 12 * ySpace); pdfDoc.text(result.commission + "", x1 + 40, y + 12 * ySpace);
        pdfDoc.text("PC Commission:", x2, y + 12 * ySpace); pdfDoc.text(result.PCCommission + "", x2 + 40, y + 12 * ySpace);


        // pdfDoc.text("Total Sale:", x1, y + 15 * ySpace); pdfDoc.text(result.totalSale + "", x1 + 40, y + 15 * ySpace);
        // pdfDoc.text("Total Commission:", x2, y + 15 * ySpace); pdfDoc.text(result.totalCommission + "", x2 + 40, y + 15 * ySpace);

        pdfDoc.text("ABC Extra:", x1, y + 13 * ySpace); pdfDoc.text(result.ABCExtraSale + "", x1 + 40, y + 13 * ySpace);
        pdfDoc.text("PC Safi Sale:", x2, y + 13 * ySpace); pdfDoc.text(result.DExtraSale + "", x2 + 40, y + 13 * ySpace);

        pdfDoc.text("ABC Prize:", x1, y + 14 * ySpace); pdfDoc.text(result.ABCPrize + "", x1 + 40, y + 14 * ySpace);
        // pdfDoc.text("D Prize:", x2 + 10, y + 17 * ySpace); pdfDoc.text(result.DPrize + "", x2 + 40, y + 17 * ySpace);
        pdfDoc.text("PC Prize:", x2, y + 14 * ySpace); pdfDoc.text(result.DPrize + "", x2 + 40, y + 14 * ySpace);

        pdfDoc.text("ABC Bill:", x1, y + 15 * ySpace); pdfDoc.text(result.ABCBill + "", x1 + 40, y + 15 * ySpace);
        // pdfDoc.text("D Bill:", x2 + 10, y + 18 * ySpace); pdfDoc.text(result.DBill + "", x2 + 40, y + 18 * ySpace);
        pdfDoc.text("PC Bill:", x2, y + 15 * ySpace); pdfDoc.text(result.DBill + "", x2 + 40, y + 15 * ySpace);


        pdfDoc.text("ABC Share:", x1, y + 16 * ySpace); pdfDoc.text(result.ABCShare + "", x1 + 40, y + 16 * ySpace);
        // pdfDoc.text("D Share:", x2 + 10, y + 19 * ySpace); pdfDoc.text(result.DShare + "", x2 + 40, y + 19 * ySpace);
        pdfDoc.text("PC Share:", x2, y + 16 * ySpace); pdfDoc.text(result.DShare + "", x2 + 40, y + 16 * ySpace);

        pdfDoc.text("ABC Bill:", x1, y + 17 * ySpace); pdfDoc.text(result.totalABCBill + "", x1 + 40, y + 17 * ySpace);

        pdfDoc.setFontSize(13);
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text("Total Bill:", x1 + 50 + 20, y + 17 * ySpace); pdfDoc.text(result.totalBill + "", x1 + 40 + 50 + 5, y + 17 * ySpace);
        pdfDoc.setFont("helvetica", "normal");
        pdfDoc.setFontSize(12);

        // pdfDoc.text("ABC Bill:", x1 + 50 + 20, y + 20 * ySpace); pdfDoc.text(result.totalABCBill + "", x1 + 40 + 50 + 5, y + 20 * ySpace);
        pdfDoc.text("PC Bill:", x2 + 10, y + 17 * ySpace); pdfDoc.text(result.totalDBill + "", x2 + 40, y + 17 * ySpace);
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
        let ABCTotalSale = formatNumberWithTwoDecimals(ABCFirstTotal + ABCSecondTotal);
        let DTotalSale = formatNumberWithTwoDecimals(DFirstTotal + DSecondTotal);
        let commission = formatNumberWithTwoDecimals(Number(((Number(targetUser.commission.commision) / 100) * ABCTotalSale).toFixed(1)))
        let PCCommission = formatNumberWithTwoDecimals(Number(((Number(targetUser.commission.pcPercentage) / 100) * DTotalSale).toFixed(1)))
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
        totalBill = -totalBill              /// plus should indicate balance to be added in user's account

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
                if (targetUser.role == "distributor") {
                    if (billingSheetForm.limitType == "apply") {
                        savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(targetUser, true)
                    } else {
                        savedPurchases = getTotalOfDistributorFromDraw(targetUser.username)
                    }
                } else {
                    savedPurchases = getTotalOfMerchentFromDraw(targetUser.username)
                }
                let result = calculateResultOfDistributor(targetUser, savedPurchases)
                addBillSheetOfADistributor(pdfDoc, targetUser, result)
                if (i + 1 < subUsers.length) {
                    let targetUser2 = getAUser(subUsers[i+1].username)
                    let savedPurchases2 = []
                    if (billingSheetForm.limitType == "apply") {
                        savedPurchases2 = getTotalOfDistributorFromDrawForTotalLimit(targetUser2)
                    } else {
                        savedPurchases2 = getTotalOfDistributorFromDraw(targetUser2.username)
                    }
                    let result2 = calculateResultOfDistributor(targetUser2, savedPurchases2)
                    if (result2.totalSale == 0) {
                        continue
                    }
                    pdfDoc.addPage()
                }
            }
        } else {
            let targetUser = getAUser(billingSheetForm.dealer)
            let savedPurchases = []
            if (targetUser.role == "distributor") {
                if (billingSheetForm.limitType == "apply") {
                    savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(targetUser, true)
                } else {
                    savedPurchases = getTotalOfDistributorFromDraw(targetUser.username)
                }

            } else {
                savedPurchases = getTotalOfMerchentFromDraw(targetUser.username)
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
        let targetUser = getAUser(localStorageUtils.getLoggedInUser().username)
        const pdfDoc = new jsPDF();
        pdfDoc.setFontSize(20);
        pdfDoc.text("Bill Sheet Summary" + (billingSheetForm.limitType == "apply" ? " - Limit Sale" : ""), pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.setFontSize(12);
        pdfDoc.text("Client: " + targetUser.username + ", " + "Draw: " + selectedDraw.title, 15, 25);
        pdfDoc.text("Draw date: " + selectedDraw.drawDate, pdfDoc.internal.pageSize.width - 20, 25, { align: 'right' });

        const columns = ['Id', 'Name', 'Ammount', 'Commission', 'Gross', 'Prize', 'NetBalance', 'Share', 'Result'];
        let bodyData = []
        let tempSubUsers = subUsers
        for (let i = 0; i < tempSubUsers.length; i++) {
            let targetUser = getAUser(tempSubUsers[i].username)
            let savedPurchases = []
            if (targetUser.role == "distributor") {
                if (billingSheetForm.limitType == "apply") {
                    savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(targetUser, true)
                } else {
                    savedPurchases = getTotalOfDistributorFromDraw(targetUser.username)
                }
            } else {
                savedPurchases = getTotalOfMerchentFromDraw(targetUser.username)
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
            outputResult = -outputResult
            if(result.totalSale!=0)
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
                                        disabled={!billingSheetForm.date || !billingSheetForm.dealer}
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

export default DistributorReports;
