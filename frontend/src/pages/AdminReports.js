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
    const [totalLimitSaleForm, setTotalLimitSaleForm] = useState({
        date: '',
        reportType: 'withoutGroup',
        dealer: 'allDealersCombined',
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
            setTotalSaleForm({
                date: '',
                reportType: 'withoutGroup',
            })
            setTotalLimitSaleForm({
                date: '',
                reportType: 'withoutGroup',
                dealer: 'allDealersCombined',
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
        if (selectedOption === 'totalLimitSale') return 'Total Limit Sale Report';

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

        const columns = ['Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd'];
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
                        0: { fillColor: [192, 192, 192] },
                        3: { fillColor: [192, 192, 192] },
                        6: { fillColor: [192, 192, 192] },
                        9: { fillColor: [192, 192, 192] }
                    },
                });

                pdfDoc.setFontSize(10);
                pdfDoc.text("Total First: " + sectionTableData.totalFirst, 15, pdfDoc.autoTable.previous.finalY + 5);
                pdfDoc.text("Total Second: " + sectionTableData.totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 5);
                pdfDoc.text("Total: " + sectionTableData.total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 5);
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

        const columns = ['Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd'];

        // Convert the data to a format compatible with jsPDF autoTable
        let bodyData = newData;
        pdfDoc.autoTable({
            head: [columns],
            body: bodyData,
            theme: 'striped',
            margin: { top: tableMarginTop }, // Adjusted top margin to leave space for the headings and texts
            columnStyles: {
                0: { fillColor: [192, 192, 192] },
                3: { fillColor: [192, 192, 192] },
                6: { fillColor: [192, 192, 192] },
                9: { fillColor: [192, 192, 192] }
            },
        });

        // Display totals
        pdfDoc.setFontSize(10);
        pdfDoc.text("Total First: " + totalFirst, 15, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total Second: " + totalSecond, pdfDoc.internal.pageSize.width / 3, pdfDoc.autoTable.previous.finalY + 10);
        pdfDoc.text("Total: " + total, pdfDoc.internal.pageSize.width * 2 / 3, pdfDoc.autoTable.previous.finalY + 10);

    }

    const generateDealSaleVoucherWithoutGroup = async (savedPurchases, targetUser, heading = "Distributor Sale Report") => {
        const pdfDoc = new jsPDF();
        const columns = ['Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd'];
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
    const getTotalOfDistributorFromDrawForTotalLimit = (targetUser) => {
        let hadd = {};
        if (targetUser.username == "admin") {
            hadd = { hindsyKiHad1: 0, hindsyKiHad2: 0, akraKiHad1: 0, akraKiHad2: 0, firstTendolaKiHad: 0, secondTendolaKiHad: 0, firstPangodaKiHad: 0, secondPangodaKiHad: 0 };
            subUsers.forEach(user => {
                hadd.hindsyKiHad1 += user.hadd.hindsyKiHad1;
                hadd.hindsyKiHad2 += user.hadd.hindsyKiHad2;
                hadd.akraKiHad1 += user.hadd.akraKiHad1;
                hadd.akraKiHad2 += user.hadd.akraKiHad2;
                hadd.firstTendolaKiHad += user.hadd.firstTendolaKiHad;
                hadd.secondTendolaKiHad += user.hadd.secondTendolaKiHad;
                hadd.firstPangodaKiHad += user.hadd.firstPangodaKiHad;
                hadd.secondPangodaKiHad += user.hadd.secondPangodaKiHad;

            })
        } else {
            hadd = targetUser.hadd;
        }
        let savedPurchases = getTotalOfDistributorFromDraw(targetUser.username)
        let updatedSavedPurchases = savedPurchases.map(purchase => {
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
        return updatedSavedPurchases;
    }
    const generateTotalLimitSaleForAllDealersSeparateWithoutGroup = async () => {
        const pdfDoc = new jsPDF();
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.text(totalLimitSaleForm.dealer.includes("allDealers") ? "All Distributors Limit Sale" : "Distributor Sale Limit", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
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
        let targetUser = {}
        if (totalLimitSaleForm.dealer == "allDealersCombined") {
            targetUser = getAUser("admin")
        }else if(totalLimitSaleForm.dealer == "allDealersSeparate"){
            generateTotalLimitSaleForAllDealersSeparateWithoutGroup()
            return
        }
         else {
            targetUser = getAUser(totalLimitSaleForm.dealer)
        }
        let savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(targetUser);
        generateDealSaleVoucherWithoutGroup(savedPurchases, targetUser, totalLimitSaleForm.dealer.includes("allDealers") ? "All Distributors Limit Sale" : "Distributor Limit Sale")
    }

    const generateTotalLimitSaleGroupWise = async () => {

        let targetUser = {}
        if(totalLimitSaleForm.dealer=="allDealersSeparate")
            return
        if (totalLimitSaleForm.dealer == "allDealersCombined") {
            targetUser = getAUser("admin")
        } else {
            targetUser = getAUser(totalLimitSaleForm.dealer)
        }
        let savedPurchases = getTotalOfDistributorFromDrawForTotalLimit(targetUser);

        const pdfDoc = new jsPDF();
        const columns = ['Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd', 'Bundle', '1st', '2nd'];
        pdfDoc.setFontSize(20);
        pdfDoc.text("Report", pdfDoc.internal.pageSize.width / 2, 10, { align: 'center' });
        pdfDoc.text(totalLimitSaleForm.dealer == "allDealers" ? "All Distributors Limit Sale" : "Distributor Limit Sale", pdfDoc.internal.pageSize.width / 2, 20, { align: 'center' });
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
                                <Nav.Link eventKey="dealerSaleVoucher" style={{ background: (selectedOption == "dealerSaleVoucher" ? "lightgray" : "") }} >Distributors Sale Voucher</Nav.Link>
                                <Nav.Link eventKey="totalLimitSale" style={{ background: (selectedOption == "totalLimitSale" ? "lightgray" : "") }} >Total Limit Sale</Nav.Link>

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

                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminReports;
