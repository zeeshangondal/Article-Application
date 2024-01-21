import React, { useState, useEffect, useRef } from 'react';
import APIs from '../APIs/users';
import articlesAPI from '../APIs/articles';

import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';
import { Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { localStorageUtils } from '../APIs/localStorageUtils';
import DrawAPIs from '../APIs/draws';
import { formatDate, formatTime } from '../Utils/Utils';
import CustomNotification from '../components/CustomNotification';


export default function Merchent() {
    const [currentLoggedInUser, setCurrentLoggedInUser] = useState({ generalInfo: { name: '' }, username: '' });
    const [showModal, setShowModal] = useState(false);
    const [showSheetModal, setShowSheetModal] = useState(false);
    const [showOversaleEditModal, setShowOversaleEditModal] = useState(false);
    const [auto, setAuto] = useState(false);
    const [checkedSavedPurchases, setCheckedSavedPurchases] = useState([])
    const [checkedOversales, setCheckedOversales] = useState([])
    const [deleteAllCheckedOversalesInput, setDeleteAllCheckedOversalesInput] = useState(false)

    const [timeRemaining, setTimeRemaining] = useState("")
    const [sheetName, setSheetName] = useState('');
    const [message, setMessage] = useState('');
    const [messagePurchases, setMessagePurchases] = useState([]);
    const [oversales, setOversales] = useState([]);
    const [showOversaleModal, setShowOversaleModal] = useState(false);
    const [overSaleOption, setOverSaleOption] = useState(3)
    const [deleteAllSelected, setDeleteAllSelected] = useState(false)
    const [currentFocused, setCurrentFocused] = useState(1)
    const [draws, setDraws] = useState([]);
    const [currentDraw, setCurrentDraw] = useState(null)
    const [savedPurchases, setSavedPurchases] = useState([]);
    const [availableArticles, setAvailableArticles] = useState(null)
    const [notification, setNotification] = useState({
        color: "",
        message: "Success",
        show: false,
    })

    const [form, setForm] = useState({
        selectedDraw: '',
        bundle: '',
        first: '',
        second: '',
    });
    const [oversaleForm, setOversaleForm] = useState({
        bundle: '',
        first: '',
        second: '',
    });
    const [oversaleEditForm, setOversaleEditForm] = useState({
        bundle: '',
        first: '',
        second: '',
        _id: ''
    });
    const bundleRef = useRef(null);
    const firstRef = useRef(null);
    const secondRef = useRef(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';

        fetchLoggedInUser();
        fetchDraws();
        // setInterval(calculateRemainingTime,500)
        return () => {
            document.body.style.overflow = 'auto'; // Set to 'auto' or 'visible' based on your preference
        };
    }, []);

    const fetchDraws = async () => {
        try {
            const response = await DrawAPIs.getAllDraws();
            let filteredDraws = response.draws.filter(draw => draw.drawStatus == true && !draw.drawExpired)
            setDraws(filteredDraws);
            return filteredDraws
        } catch (error) {
            console.error("Error fetching draws", error);
        }
    };
    const fetchLoggedInUser = async () => {
        try {
            const response = await APIs.getAllUsers();
            let tempUser = response.users.find(user => user._id == localStorageUtils.getLoggedInUser()._id);
            setCurrentLoggedInUser(tempUser);
            localStorageUtils.setLoggedInUser(JSON.stringify(tempUser));
            if (form.selectedDraw.length > 0) {
                getSavedPurchasesOfCurrentDraw(form.selectedDraw)
            }
        } catch (error) {
            console.error('Error fetching users', error);
        }
    };

    const getSavedPurchasesOfCurrentDraw = (selectedDraw) => {
        let purchasedFromDrawData = currentLoggedInUser.purchasedFromDrawData
        let purchasedDrawData = purchasedFromDrawData.find(data => data.drawId === selectedDraw)

        try {
            setSavedPurchases([...purchasedDrawData.savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0)])
            setOversales([...purchasedDrawData.savedOversales.filter(purchase => purchase.first != 0 || purchase.second != 0)])
        } catch (e) {
            setSavedPurchases([])
        }
    }
    const handleModalClose = () => {
        setShowModal(false);
    };
    const handleSheetModalClose = () => {
        setShowSheetModal(false);
    };
    const handleOversaleEditModalClose = () => {
        setShowOversaleEditModal(false);
    };

    const updateCurrentLoggedInUser = async () => {
        await APIs.updateUser(currentLoggedInUser)
        fetchLoggedInUser()
    }
    const handlePurchaseOne = async (bundle, first, second, availableFirstPrice, availableSecondPrice) => {
        if (!auto) {
            if (currentFocused < 3) {
                setCurrentFocused(currentFocused + 1)
                return
            }
            if (currentFocused == 3) {
                setCurrentFocused((1))
            }
        } else {
            if (currentFocused != 1) {
                if (currentFocused == 3) {
                    setCurrentFocused(1)
                    return
                }
                setCurrentFocused(currentFocused + 1)
                return
            }
        }
        if (!first || !second || !bundle) {
            return
        }

        if (first == 0 && second == 0) {
            return
        }

        let purchasedFromDrawData = currentLoggedInUser.purchasedFromDrawData
        let purchasedDrawData = purchasedFromDrawData.find(data => data.drawId === form.selectedDraw)
        let overSaleFirst = 0
        let overSaleSecond = 0
        if (first > availableFirstPrice) {
            overSaleFirst = first - availableFirstPrice
            first = availableFirstPrice
        }
        if (second > availableSecondPrice) {
            overSaleSecond = second - availableSecondPrice
            second = availableSecondPrice
        }

        if ((Number(first) + Number(second)) > currentLoggedInUser.balance) {
            alert("You dont have enough balance for this purchase.")
            return
        }

        if (purchasedDrawData) {
            purchasedDrawData.savedPurchases.push({
                bundle, first, second
            })
            if (overSaleFirst > 0 || overSaleSecond > 0) {
                purchasedDrawData.savedOversales.push({
                    bundle, first: overSaleFirst, second: overSaleSecond
                })
            }
        } else {
            purchasedDrawData = {
                drawId: form.selectedDraw,
                savedPurchases: [{
                    bundle, first, second
                }]
            }
            if (overSaleFirst > 0 || overSaleSecond > 0) {
                purchasedDrawData = {
                    ...purchasedDrawData,
                    savedOversales: [{
                        bundle, first: overSaleFirst, second: overSaleSecond
                    }]
                }
            }
            purchasedFromDrawData.push(purchasedDrawData)

        }
        // firstDigitId, secondDigitId, bundle , purchaseFirst ,purchaseSecond, type
        let data = getDataForBundle(bundle, currentDraw)
        data = {
            ...data,
            purchaseFirst: first,
            purchaseSecond: second,
            type: "-",
            askingUser: localStorageUtils.getLoggedInUser()._id
        }
        successMessage("Purcahse added successfuly")
        await articlesAPI.updateDigit(data)
        currentLoggedInUser.balance = currentLoggedInUser.balance - (Number(first) + Number(second))
        updateCurrentLoggedInUser()
        setForm({ ...form, bundle: '' })
        // handleBundleChange(bundle)
        // setShowModal(false);
    };
    function successMessage(msg) {
        setNotification({ ...notification, color: "", show: true, message: msg })
    }
    function alertMessage(msg) {
        setNotification({ ...notification, color: "danger", show: true, message: msg })
    }


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

    const getDataForBundle = (bundle, currentDraw) => {
        let data = {
            firstDigitId: "",
            secondDigitId: "",
            bundle,
            askingUser: localStorageUtils.getLoggedInUser()._id,
            firstLimitOfDraw: 0,
            secondLimitOfDraw: 0,
        };

        if (bundle.length > 0) {
            if (bundle.length === 1) {
                data.firstDigitId = currentDraw.oneDigitFirst.digit;
                data.secondDigitId = currentDraw.oneDigitSecond.digit;
                data.firstLimitOfDraw = currentDraw.oneDigitFirst.price
                data.secondLimitOfDraw = currentDraw.oneDigitSecond.price
            } else if (bundle.length === 2) {
                data.firstDigitId = currentDraw.twoDigitFirst.digit;
                data.secondDigitId = currentDraw.twoDigitSecond.digit;
                data.firstLimitOfDraw = currentDraw.twoDigitFirst.price
                data.secondLimitOfDraw = currentDraw.twoDigitSecond.price

            } else if (bundle.length === 3) {
                data.firstDigitId = currentDraw.threeDigitFirst.digit;
                data.secondDigitId = currentDraw.threeDigitSecond.digit;
                data.firstLimitOfDraw = currentDraw.threeDigitFirst.price
                data.secondLimitOfDraw = currentDraw.threeDigitSecond.price

            } else if (bundle.length === 4) {
                data.firstDigitId = currentDraw.fourDigitFirst.digit;
                data.secondDigitId = currentDraw.fourDigitSecond.digit;
                data.firstLimitOfDraw = currentDraw.fourDigitFirst.price
                data.secondLimitOfDraw = currentDraw.fourDigitSecond.price

            }
        }
        return data;
    };

    const handleBundleChange = async (bundle) => {
        if (isValidBundle(bundle)) {
            setForm({ ...form, bundle: bundle });

            if (bundle.length > 0) {
                const data = getDataForBundle(bundle, currentDraw);
                const response = await articlesAPI.getFirstAndSecond(data);
                setAvailableArticles({ ...response.data });
                return;
            }
            setAvailableArticles(null);
        }
    };

    const handleChangeDraw = async (event) => {
        let value = event.target.value
        setForm({ ...form, selectedDraw: value })
        if (value == '') {
            setCurrentDraw(null)
            setSavedPurchases([])
            setOversales([])
            return
        }
        let fetchedDraws = await fetchDraws()
        setCurrentDraw(fetchedDraws.find(draw => draw._id == value))
        getSavedPurchasesOfCurrentDraw(value)
        setInterval(() => calculateRemainingTime(fetchedDraws.find(draw => draw._id == value)), 1000)
    }

    const getCount = () => {
        return savedPurchases.length
    }
    const getTotalFirsts = () => {
        let total = 0
        savedPurchases.forEach((purchase) => {
            total += Number(purchase.first)
        })
        return total
    }
    const getTotalSeconds = () => {
        let total = 0
        savedPurchases.forEach((purchase) => {
            total += Number(purchase.second)
        })
        return total
    }
    const getTotalBoth = () => {
        return (getTotalFirsts() + getTotalSeconds())
    }

    const handleConfirmSavePurchases = () => {
        let purchasedFromDrawData = currentLoggedInUser.purchasedFromDrawData
        let savingPurchasedDrawData = purchasedFromDrawData.find(data => data.drawId === form.selectedDraw)
        currentLoggedInUser.purchasedFromDrawData = purchasedFromDrawData.filter(data => data.drawId != form.selectedDraw)
        delete savingPurchasedDrawData._id
        currentLoggedInUser.savedPurchasesFromDrawsData.push({ ...savingPurchasedDrawData, sheetName })
        updateCurrentLoggedInUser()
        successMessage("Sheet Saved Successfully")
        setSheetName('')
        setSavedPurchases([])
        setOversales([])
        setShowSheetModal(false)
    }

    function parseInputMessage(message) {
        if (message.length == 0) {
            setMessagePurchases([])
            return
        }
        try {
            let tempMessagePurchases = []
            let tempMessage = message.replace(/\s/g, '');
            let lines = tempMessage.split(",")
            lines.forEach(line => {
                let lineSplits = line.split(".")
                let second = Number((lineSplits[lineSplits.length - 1]).slice(1))
                let first = Number((lineSplits[lineSplits.length - 2]).slice(1))
                for (let i = 0; i < lineSplits.length - 2; i++) {
                    tempMessagePurchases.push({ bundle: lineSplits[i], first, second })
                }
            })
            setMessagePurchases([...tempMessagePurchases])
        } catch (e) {
        }
    }
    const handleMakeMessagePurchases = async () => {
        let allDone = true
        messagePurchases.forEach(async (purchase) => {
            try {
                // await handleBundleChange(purchase.bundle)
                const data = getDataForBundle(purchase.bundle, currentDraw);
                const response = await articlesAPI.getFirstAndSecond(data);
                let availableFirstPrice = response.data.firstPrice
                let availableSecondPrice = response.data.secondPrice
                if (currentLoggedInUser.balance < (Number(purchase.first) + Number(purchase.second))) {
                    alertMessage("Insuffiecent balance for purchase\n" + "Num: " + purchase.bundle + " , First: " + purchase.first + " , Second: " + purchase.second)
                    return
                }
                await handlePurchaseOne(purchase.bundle, purchase.first, purchase.second, availableFirstPrice, availableSecondPrice)
            } catch (e) {
                allDone = false
                let msg = `Due to an error couldn't add Bundle: ${purchase.bundle} First: ${purchase.first} Second: ${purchase.second}`
                alert(msg)
            }
        })
        if (allDone) {
            setMessagePurchases([])
        }
        successMessage("Purchases Added")

    }
    const handleRemovingSavedPurchase = async (_id) => {
        try {
            let purchasedData = currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId === form.selectedDraw)
            let purchases = purchasedData.savedPurchases
            let target = purchases.find(purchase => purchase._id === _id)
            let updated = purchases.filter(purchase => purchase._id !== _id)
            purchasedData.savedPurchases = [...updated]
            currentLoggedInUser.balance = currentLoggedInUser.balance + (Number(target.first) + Number(target.second))
            updateCurrentLoggedInUser()
            let data = getDataForBundle(target.bundle, currentDraw)
            data = {
                ...data,
                purchaseFirst: target.first,
                purchaseSecond: target.second,
                type: "+"
            }
            handleBundleChange(target.bundle)
            successMessage("Removed Successfully")
            await articlesAPI.updateDigit(data)
        } catch (e) { }
    }

    const handleCheckedOverSaleDeletes = async () => {
        if (!window.confirm("You are deleting " + checkedOversales.length + " entries. Are you sure?")) {
            return
        }
        try {
            checkedOversales.forEach(purchase => {
                let _id = purchase._id
                let purchasedData = currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId === form.selectedDraw)
                let oversales = purchasedData.savedOversales
                let updated = oversales.filter(purchase => purchase._id !== _id)
                purchasedData.savedOversales = [...updated]
                let oldRecs = currentLoggedInUser.savedPurchasesFromDrawsData.filter(data => data.drawId == currentDraw._id)
                for (let i = 0; i < oldRecs.length; i++) {
                    let oldRec = oldRecs[i]
                    let updatedOversales = oldRec.savedOversales.filter(purchase => purchase._id !== _id)
                    oldRec.savedOversales = [...updatedOversales]
                }
            })
            updateCurrentLoggedInUser()
            successMessage("Removed Successfully")
            setCheckedOversales([])
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            await sleep(3000);
            if (overSaleOption == 3) {
                handleCurrentOversale()
            } else if (overSaleOption == 1) {
                handleInvoiceOversales()
            }
        } catch (e) { }

    }
    const handleRemovingOversalePurchase = (_id) => {
        if (!window.confirm("Do you want to remove this?")) {
            return;
        }
        try {
            let purchasedData = currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId === form.selectedDraw)
            let oversales = purchasedData.savedOversales
            let updated = oversales.filter(purchase => purchase._id !== _id)
            purchasedData.savedOversales = [...updated]
            let oldRecs = currentLoggedInUser.savedPurchasesFromDrawsData.filter(data => data.drawId == currentDraw._id)
            for (let i = 0; i < oldRecs.length; i++) {
                let oldRec = oldRecs[i]
                let updatedOversales = oldRec.savedOversales.filter(purchase => purchase._id !== _id)
                oldRec.savedOversales = [...updatedOversales]
            }
            updateCurrentLoggedInUser()
            successMessage("Removed Successfully")
        } catch (e) { }
    }

    const handleAddNewOversale = async () => {
        let purchasedFromDrawData = currentLoggedInUser.purchasedFromDrawData
        let purchasedDrawData = purchasedFromDrawData.find(data => data.drawId === form.selectedDraw)
        let overSaleFirst = oversaleForm.first
        let overSaleSecond = oversaleForm.second
        if (overSaleFirst == 0 && overSaleSecond == 0) {
            return
        }
        let bundle = oversaleForm.bundle
        if (purchasedDrawData) {
            purchasedDrawData.savedOversales.push({
                bundle, first: overSaleFirst, second: overSaleSecond
            })
        } else {
            purchasedDrawData = {
                drawId: form.selectedDraw,
                savedOversales: [{
                    bundle, first: overSaleFirst, second: overSaleSecond
                }]
            }
            purchasedFromDrawData.push(purchasedDrawData)
        }
        successMessage("Oversale added successfuly")
        updateCurrentLoggedInUser()
        // setOversales([...purchasedDrawData.savedOversales])
    };

    function successMessage(msg) {
        setNotification({ ...notification, color: "", show: true, message: msg })
    }
    function alertMessage(msg) {
        setNotification({ ...notification, color: "danger", show: true, message: msg })
    }

    const handleEditOversale = () => {
        let purchasedFromDrawData = currentLoggedInUser.purchasedFromDrawData
        let purchasedDrawData = purchasedFromDrawData.find(data => data.drawId === form.selectedDraw)
        let overSaleFirst = oversaleEditForm.first
        let overSaleSecond = oversaleEditForm.second
        let bundle = oversaleEditForm.bundle
        let oldOverSale = purchasedDrawData.savedOversales.find(oversale => oversale._id == oversaleEditForm._id)
        oldOverSale.bundle = bundle
        oldOverSale.first = overSaleFirst
        oldOverSale.second = overSaleSecond
        successMessage("Oversale added successfuly")
        updateCurrentLoggedInUser()
    }

    function handleCheckedPurchases(purchase, checked) {
        if (checked) {
            setCheckedSavedPurchases([...checkedSavedPurchases, purchase])
        } else {
            setCheckedSavedPurchases([...checkedSavedPurchases.filter(p => p._id != purchase._id)])
        }
    }
    function handleCheckedOversales(oversale, checked) {
        if (checked) {
            setCheckedOversales([...checkedOversales, oversale])
        } else {
            setCheckedOversales([...checkedOversales.filter(p => p._id != oversale._id)])
        }
    }
    const handleMultipleSavedPurchaseDelete = () => {
        try {
            if (!window.confirm("You are deleting " + checkedSavedPurchases.length + " entries. Do you confirm ?")) {
                return
            }
            checkedSavedPurchases.forEach(async purchase => {
                await handleRemovingSavedPurchase(purchase._id)
            })
            setCheckedSavedPurchases([])
        } catch (e) {
        }
    }

    function calculateRemainingTime(currentDraw) {
        if (currentDraw) {
            let drawDate = currentDraw.drawDate
            let drawTime = currentDraw.drawTime

            const drawDateTime = new Date(`${drawDate}T${drawTime}`);
            if (isNaN(drawDateTime.getTime())) {
                console.error("Invalid draw date or time format.");
                return null;
            }
            const timeDifference = drawDateTime - new Date();
            if (timeDifference <= 0) {
                console.log("Draw date and time have already passed.");
                return null;
            }
            // Calculate remaining hours, minutes, and seconds
            const hours = Math.floor(timeDifference / (1000 * 60 * 60));
            const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
            let temp = hours + "hrs " + minutes + " mins " + seconds + " secs"
            setTimeRemaining(temp)
        }
    }

    const handleInvoiceOversales = () => {
        let savedOversales = []
        savedOversales = [...(currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId == currentDraw._id).savedOversales)]
        let oldRecs = currentLoggedInUser.savedPurchasesFromDrawsData.filter(data => data.drawId == currentDraw._id)
        if (oldRecs) {
            oldRecs.forEach(rec => {
                savedOversales = [...savedOversales, ...rec.savedOversales]
            })
        }
        savedOversales.filter(purchase => purchase.first != 0 || purchase.second != 0)
        setOversales(savedOversales)
    }
    const handleTotalOversales = () => {
        let savedOversales = []
        savedOversales = [...(currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId == currentDraw._id).savedOversales)]
        let oldRecs = currentLoggedInUser.savedPurchasesFromDrawsData.filter(data => data.drawId == currentDraw._id)
        if (oldRecs) {
            oldRecs.forEach(rec => {
                savedOversales = [...savedOversales, ...rec.savedOversales]
            })
        }
        const bundleMap = new Map();
        savedOversales.forEach(item => {
            const bundle = item.bundle;
            const first = item.first;
            const second = item.second;
            if (bundleMap.has(bundle)) {
                const existingValues = bundleMap.get(bundle);
                bundleMap.set(bundle, {
                    first: existingValues.first + first,
                    second: existingValues.second + second,
                });
            } else {
                bundleMap.set(bundle, { first, second });
            }
        });
        let result = Array.from(bundleMap, ([bundle, values]) => ({ bundle, ...values }));
        result = result.sort((a, b) => {
            return Number('1' + a.bundle) - Number('1' + b.bundle);
        });
        setOversales(result)
    }
    const handleCurrentOversale = () => {
        setOversales([...currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId == currentDraw._id).savedOversales.filter(purchase => purchase.first != 0 || purchase.second != 0)])
    }
    function backOne() {
        if (currentFocused == 1) {
            let updt = form.bundle.substring(0, form.bundle.length - 1)
            setForm({
                ...form,
                bundle: updt
            })
            handleBundleChange(updt)
        } else if (currentFocused == 2) {
            let updt = form.first.toString()
            updt = updt.substring(0, updt.length - 1)
            updt = Number(updt)
            if (updt == 0) {
                setForm({
                    ...form,
                    first: ""
                })
                return
            }
            setForm({
                ...form,
                first: updt
            })
        } else if (currentFocused == 3) {
            let updt = form.second.toString()
            updt = updt.substring(0, updt.length - 1)
            updt = Number(updt)
            if (updt == 0) {
                setForm({
                    ...form,
                    second: ""
                })
                return
            }

            setForm({
                ...form,
                second: updt
            })
        }
    }
    const handleInput = (input) => {
        if (input == "+") {
            return
        }
        if (input == "<") {
            backOne()
            return
        }
        if (currentFocused == 1) {
            if (form.bundle.length == 4) {
                return
            }
            setForm({
                ...form,
                bundle: form.bundle + input
            })
            handleBundleChange(form.bundle + input)
            return
        } else if (currentFocused == 2) {
            let updt = form.first.toString()
            updt += input
            updt = Number(updt)
            setForm({
                ...form,
                first: updt
            })
        } else if (currentFocused == 3) {
            let updt = form.second.toString()
            updt += input
            updt = Number(updt)
            setForm({
                ...form,
                second: updt
            })
        }
    }

    return (
        <div className='app-container'>
            <div className='d-flex justify-content-around ' style={{ backgroundColor: "green", }}>
                <h6 style={{ color: "white", fontSize: "0.8rem", }}>{currentLoggedInUser.username}</h6>
                <h6 style={{ color: "white", fontSize: "0.8rem", }}>{currentLoggedInUser && currentLoggedInUser?.balance?.toFixed(1)}</h6>
                {/* <h6 style={{color:"white"}}>Avaliable Balance: {currentLoggedInUser.availableBalance}</h6> */}
            </div>
            <div className='d-flex justify-content-around' style={{ backgroundColor: "black", marginTop: "1px" }}>
                <h6 style={{ color: "white", fontSize: "0.8rem", marginLeft: "5px" }}>{currentDraw ? currentDraw.title : "Draw"}</h6>
                <h6 style={{ color: "white", fontSize: "0.8rem", }}>{timeRemaining}</h6>
                {/* <h6 style={{color:"white"}}>Avaliable Balance: {currentLoggedInUser.availableBalance}</h6> */}
            </div>
            <div className='d-flex justify-content-around' style={{ backgroundColor: "black" }}>
                <select onChange={handleChangeDraw} style={{ textAlign: "center", fontSize: "0.8rem", width: "100vw", color: "white", backgroundColor: "black", height: "4vh" }}>
                    <option value="">Select Draw</option>
                    {draws.map((draw) => (
                        <option key={draw._id} value={draw._id}>
                            {formatDate(draw.drawDate) + " , " + formatTime(draw.drawTime)}
                        </option>
                    ))}
                </select>
            </div>
            <div className='row' >
                <div className='col-7'>
                    <div className='row'>
                        <div className='col-8'>
                            <Table bordered hover size="sm" className="" style={{ fontSize: '0.7rem', marginLeft: "10px" }}>
                                <thead>
                                    <tr>
                                        <th>Co</th>
                                        <th>F</th>
                                        <th>S</th>
                                        <th>T</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr >
                                        <td style={{ fontWeight: "bold" }}>{getCount()}</td>
                                        <td style={{ fontWeight: "bold" }}>{getTotalFirsts()}</td>
                                        <td style={{ fontWeight: "bold" }}>{getTotalSeconds()}</td>
                                        <td style={{ fontWeight: "bold" }}>{getTotalBoth()}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </div>
                        <div className='col-4' style={{ marginTop: "20px" }}>
                            <div className='d-flex justify-content-end' >
                                <Button variant="btn btn-sm btn-danger" style={{ fontSize: "0.7rem" }} onClick={handleMultipleSavedPurchaseDelete} disabled={checkedSavedPurchases.length <= 0}>Delete</Button>
                            </div>

                        </div>
                    </div>
                    <div style={{ marginTop: "-15px" }}>
                        <Table bordered hover size="sm" className="" style={{ fontSize: '0.8rem', }}>
                            <thead>
                                <tr>
                                    <th className='col-1'>
                                        <Form.Check
                                            type="checkbox"
                                            checked={deleteAllSelected}
                                            onClick={(e) => {
                                                if (e.target.checked) {
                                                    setCheckedSavedPurchases([...savedPurchases]);
                                                } else {
                                                    setCheckedSavedPurchases([]);
                                                }
                                                setDeleteAllSelected(e.target.checked)
                                            }}
                                            style={{ marginLeft: "8px" }}

                                        />
                                    </th>
                                    <th className='col-2'>No</th>
                                    <th className='col-2'>F</th>
                                    <th className='col-2'>S</th>
                                </tr>
                            </thead>
                        </Table>
                    </div>
                    <div style={{ height: '180px', overflowY: 'auto', marginTop: "-15px" }}>
                        <Table bordered hover size="sm" className="" style={{ fontSize: '0.8rem', }}>
                            <tbody>
                                {savedPurchases.map(purchase => (
                                    <tr key={purchase._id} >
                                        <td className='col-1' >
                                            <Form.Check
                                                type="checkbox"
                                                checked={checkedSavedPurchases.find(p => p._id == purchase._id)}
                                                onChange={e => handleCheckedPurchases(purchase, e.target.checked)}
                                                style={{ marginLeft: "8px" }}
                                            />
                                        </td>

                                        <td className='col-2' style={{ fontWeight: "bold" }}>{purchase.bundle}</td>
                                        <td className='col-2' style={{ fontWeight: "bold" }}>{purchase.first}</td>
                                        <td className='col-2' style={{ fontWeight: "bold" }}>{purchase.second}</td>
                                        {/* <td>
                                        <div className=''>
                                            <Button variant="btn btn-sm btn-danger" style={{ fontSize: "0.5rem" }} onClick={() => handleRemovingSavedPurchase(purchase._id)}>D</Button>
                                        </div>
                                    </td> */}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>
                <div className='col-5 mt-1 bg-dark' style={{ marginLeft: "-11px" }}>
                    <div className=''>
                        <div className='d-flex justify-content-between  '>
                            <Button variant='btn btn-primary  btn-sm'
                                style={{ fontSize: "0.7rem", marginTop: "0px" }} onClick={() => { setShowOversaleModal(true); handleCurrentOversale(); setOverSaleOption(3) }}>
                                Oversales
                            </Button>
                            <Button variant='primary btn btn-sm ' onClick={() => setShowSheetModal(true)} disabled={savedPurchases.length <= 0} style={{ fontSize: "0.7rem", marginRight: "8px" }}>
                                Save
                            </Button>

                        </div>
                        <div >
                            <Table boarded hover size="sm" className="mt-2" style={{ fontSize: '0.8rem', marginTop: "-5px", }}>
                                <thead>
                                    <tr>
                                        <th className='col-2'>No</th>
                                        <th className='col-2'>F</th>
                                        <th className='col-2'>S</th>
                                    </tr>
                                </thead>
                            </Table>
                        </div>

                        <div style={{ height: '170px', overflowY: 'auto', marginTop: "-7px" }}>
                            <Table boarded hover size="sm" className="" style={{ fontSize: '0.8rem', marginTop: "-5px", fontWeight: "bold" }}>
                                <tbody>
                                    {oversales.map(purchase => (
                                        <tr  >
                                            <td>{purchase.bundle}</td>
                                            <td>{purchase.first}</td>
                                            <td>{purchase.second}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ marginTop: "-11px" }}>
                <hr />
            </div>
            <div className='d-flex justify-content-start' style={{ marginTop: "-12px" }}>
                <div className='col-3' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className='d-flex justify-content-between' style={{ fontWeight: 'normal', fontSize: '0.8rem', marginTop: "2px" }}>
                        <Form.Label style={{ marginLeft: '0px', }}>Auto</Form.Label>
                        <Form.Check
                            type="checkbox"
                            style={{ marginLeft: "8px" }}
                            checked={auto}
                            onClick={(e) => setAuto(e.target.checked)}
                        />
                    </div>
                    <input className={"" + currentFocused == 1 ? "temp-border" : ""}
                        type='text'
                        ref={bundleRef}
                        placeholder='Num'
                        readOnly
                        value={form.bundle}
                        // onChange={(e) => handleBundleChange(e.target.value)}
                        onClick={() => { bundleRef.current.focus(); setCurrentFocused(1) }}
                        disabled={currentDraw == null}
                        style={{ width: "60px", fontSize: "0.9rem", marginLeft: "4px", fontWeight: "bold", marginTop: "1px" }}
                    />
                </div>
                <div className='col-3' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h6 className='text-center' style={{ fontWeight: 'normal', fontSize: '0.8rem', marginTop: "4px" }}>
                        {availableArticles ? availableArticles.firstPrice : '.'}
                    </h6>
                    <input className={"" + currentFocused == 2 ? "temp-border" : ""}
                        type='number'
                        ref={firstRef}
                        placeholder='F'
                        readOnly
                        value={form.first}
                        onChange={(e) => setForm({ ...form, first: e.target.value })}
                        onClick={() => { firstRef.current.focus(); setCurrentFocused(2) }}
                        disabled={currentDraw == null}
                        style={{ width: '70px', fontSize: '0.9rem', fontWeight: 'bold', marginTop: "3px" }}
                    />
                </div>
                <div className='col-3' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h6 className='text-center' style={{ fontWeight: 'normal', fontSize: "0.8rem", marginTop: "4px" }}>
                        {availableArticles ? availableArticles.secondPrice : "."}
                    </h6>
                    <input className={"" + currentFocused == 3 ? "temp-border" : ""}
                        ref={secondRef}
                        type='number'
                        placeholder='S'
                        readOnly
                        value={form.second}
                        onChange={(e) => setForm({ ...form, second: e.target.value })}
                        onClick={() => { secondRef.current.focus(); setCurrentFocused(3) }}
                        disabled={currentDraw == null}
                        style={{ width: "70px", fontSize: "0.9rem", fontWeight: "bold", marginTop: "3px" }}
                    />
                </div>
                <div className='col-2' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Button variant='primary btn btn-sm'
                        style={{ fontSize: "0.7rem" }}
                        onClick={() => setShowModal(true)}>
                        SMS
                    </Button>


                    <Button variant='primary btn btn-sm'
                        style={{ width: "40px", fontSize: "0.7rem", marginTop: "2px" }}
                        onClick={() => handlePurchaseOne(form.bundle, form.first, form.second, availableArticles.firstPrice, availableArticles.secondPrice)} >
                        Add
                    </Button>
                </div>
            </div>
            <div>
                <div data-v-ffceccfa="" class="keyboard-panel">
                    <div data-v-ffceccfa="" class="keyboard-wrapper">
                        <div data-v-ffceccfa="" class="num" onClick={() => handleInput("1")}>1</div>
                        <div data-v-ffceccfa="" class="num" onClick={() => handleInput("2")}>2</div>
                        <div data-v-ffceccfa="" class="num" onClick={() => handleInput("3")}>3</div>
                        <div data-v-ffceccfa="" class="num" onClick={() => handleInput("4")}>4</div>
                        <div data-v-ffceccfa="" class="num" onClick={() => handleInput("5")}>5</div>
                        <div data-v-ffceccfa="" class="num" onClick={() => handleInput("6")}>6</div>
                        <div data-v-ffceccfa="" class="num" onClick={() => handleInput("7")}>7</div>
                        <div data-v-ffceccfa="" class="num" onClick={() => handleInput("8")}>8</div>
                        <div data-v-ffceccfa="" class="num" onClick={() => handleInput("9")}>9</div>
                        <div data-v-ffceccfa="" id="key-plus1" class="num" onClick={() => handleInput("+")}>+</div>
                        <div data-v-ffceccfa="" class="num" onClick={() => handleInput("0")}>0</div>
                        <div data-v-ffceccfa="" class="num" style={{ fontWeight: "bold" }} onClick={() => handleInput("<")}>
                            {"<"}
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <Modal show={showOversaleModal} onHide={() => { setCheckedOversales([]); handleCurrentOversale(); setShowOversaleModal(false) }}>
                    <Modal.Header closeButton>
                        <Modal.Title>Oversales</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <div className='d-flex justify-content-between'>
                            <div>
                                <h6>
                                    {overSaleOption == 1 && "Invoice"}
                                    {overSaleOption == 2 && "All Total"}
                                    {overSaleOption == 3 && "Current"}
                                </h6>
                            </div>
                            <div className='d-flex justify-content-end'>
                                <Button variant='btn btn-danger  btn-sm'
                                    style={{ fontSize: "0.8rem", marginTop: "-20px", marginRight: "3px" }}
                                    onClick={() => { handleCheckedOverSaleDeletes(); }}
                                >
                                    Delete
                                </Button>
                                <Button variant='btn btn-primary  btn-sm'
                                    style={{ fontSize: "0.8rem", marginTop: "-20px", marginRight: "3px" }} onClick={() => { handleInvoiceOversales(); setOverSaleOption(1) }}>
                                    Invoice
                                </Button>
                                <Button variant='btn btn-primary  btn-sm'
                                    style={{ fontSize: "0.8rem", marginTop: "-20px", marginRight: "3px" }} onClick={() => { handleTotalOversales(); setOverSaleOption(2); setCheckedOversales([]) }}>
                                    All Total
                                </Button>
                                <Button variant='btn btn-primary  btn-sm'
                                    style={{ fontSize: "0.8rem", marginTop: "-20px" }} onClick={() => { handleCurrentOversale(); setOverSaleOption(3) }}>
                                    Current
                                </Button>

                            </div>
                        </div>
                        <Table bordered hover size="sm" className="" style={{ fontSize: '0.8rem', marginTop: "3px" }}>
                            <thead>
                                <tr>
                                    {(overSaleOption == 1 || overSaleOption == 3) &&
                                        <>
                                            <th className='col-1'>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={deleteAllCheckedOversalesInput}
                                                    onClick={(e) => {
                                                        if (e.target.checked) {
                                                            setCheckedOversales([...oversales]);
                                                        } else {
                                                            setCheckedOversales([]);
                                                        }
                                                        setDeleteAllCheckedOversalesInput(e.target.checked)
                                                    }}
                                                    style={{ marginLeft: "8px" }}
                                                />
                                            </th>
                                            <th className='col-3'>No</th>
                                            <th className='col-3'>F</th>
                                            <th className='col-3'>S</th>
                                            <th className='col-2'></th>

                                        </>
                                    }
                                    {overSaleOption == 2 &&
                                        <>
                                            <th className='col-4'>No</th>
                                            <th className='col-4'>F</th>
                                            <th className='col-4'>S</th>
                                        </>
                                    }
                                </tr>
                            </thead>
                        </Table>
                        <div style={{ height: '190px', overflowY: 'auto', marginTop: "-17px" }}>
                            <Table bordered hover size="sm" className="" style={{ fontSize: '0.8rem', }}>
                                {overSaleOption == 2 ?
                                    <tbody>
                                        {oversales.map(purchase => (
                                            <tr>
                                                <td className='col-4'>{purchase.bundle}</td>
                                                <td className='col-4'>{purchase.first}</td>
                                                <td className='col-4'>{purchase.second}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    :
                                    <tbody>
                                        {oversales.map(purchase => (
                                            <tr>
                                                <td className='col-1' >
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={checkedOversales.find(p => p._id == purchase._id)}
                                                        onChange={e => handleCheckedOversales(purchase, e.target.checked)}
                                                        style={{ marginLeft: "8px" }}
                                                    />
                                                </td>
                                                <td className='col-3'>{purchase.bundle}</td>
                                                <td className='col-3'>{purchase.first}</td>
                                                <td className='col-3'>{purchase.second}</td>
                                                <td className='col-2'>
                                                    <div className=''>
                                                        <Button style={{ fontSize: "0.7rem" }} variant="primary btn btn-sm btn-danger" onClick={() => handleRemovingOversalePurchase(purchase._id)}>Remove</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                }
                            </Table>

                        </div>
                        <div className='mt-3'>
                            <Form>
                                <Row>
                                    <Col>
                                        <Form.Group >
                                            <Form.Control
                                                type='text'
                                                placeholder='No'
                                                value={oversaleForm.bundle}
                                                onChange={(e) => isValidBundle(e.target.value) && setOversaleForm({ ...oversaleForm, bundle: e.target.value })}
                                                style={{ fontSize: "0.8rem" }}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group >
                                            <Form.Control
                                                type='number'
                                                placeholder='F'
                                                value={oversaleForm.first}
                                                onChange={(e) => setOversaleForm({ ...oversaleForm, first: e.target.value })}
                                                style={{ fontSize: "0.8rem" }}

                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group >
                                            <Form.Control
                                                type='number'
                                                placeholder='S'
                                                value={oversaleForm.second}
                                                onChange={(e) => setOversaleForm({ ...oversaleForm, second: e.target.value })}
                                                style={{ fontSize: "0.8rem" }}

                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Button variant='primary btn ' onClick={handleAddNewOversale} disabled={!oversaleForm.first || !oversaleForm.second || !oversaleForm.bundle}>
                                            Add
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>

                        </div>
                    </Modal.Body>
                </Modal>


            </div>
            <CustomNotification notification={notification} setNotification={setNotification} />


            <div className='container'>


                <Modal show={showSheetModal} onHide={handleSheetModalClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Save Purchases</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form style={{ fontSize: '0.8rem' }}>
                            <Row>
                                <Col>
                                    <Form.Group >
                                        <Form.Control
                                            type='text'
                                            placeholder='Sheet Name'
                                            value={sheetName}
                                            onChange={(e) => setSheetName(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <div className='d-flex justify-content-between'>
                            <Button variant='primary btn' disabled={!sheetName} onClick={handleConfirmSavePurchases}>
                                Save
                            </Button>
                        </div>
                    </Modal.Footer>
                </Modal>

                <Modal show={showModal} onHide={handleModalClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Paste SMS</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form style={{ fontSize: '0.9rem' }}>
                            <div className=''>
                                <Row>
                                    <Form.Group >
                                        <Form.Control
                                            as='textarea'
                                            placeholder='SMS Message'
                                            value={message}
                                            onChange={(e) => { setMessage(e.target.value); parseInputMessage(e.target.value) }}
                                            rows={2}
                                            disabled={currentDraw == null}
                                            autocomplete="off"
                                            spellcheck="false"
                                        />
                                    </Form.Group>
                                </Row>
                            </div>
                            {
                                <div className='mt-1'>
                                    <Table striped hover size="sm" className="" style={{ fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr>
                                                <th>Num</th>
                                                <th>First</th>
                                                <th>Second</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {messagePurchases.map(purchase => (
                                                <tr >
                                                    <td>{purchase.bundle}</td>
                                                    <td>{purchase.first}</td>
                                                    <td>{purchase.second}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                    <div className='d-flex justify-content-end mt-2'>
                                        <Button variant=' btn-secondary btn  btn-sm' style={{ marginRight: "5px" }} onClick={() => { setShowModal(false); setMessage(""); setMessagePurchases([]) }} >
                                            Cancel
                                        </Button>

                                        <Button variant='primary btn btn-sm' onClick={handleMakeMessagePurchases} >
                                            Confirm
                                        </Button>
                                    </div>
                                </div>
                            }

                        </Form>
                    </Modal.Body>
                </Modal>


            </div>


        </div >
    );
}
