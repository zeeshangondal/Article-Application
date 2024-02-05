import React, { useState, useEffect, useRef } from 'react';
import APIs from '../APIs/users';
import articlesAPI from '../APIs/articles';

import { Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { localStorageUtils } from '../APIs/localStorageUtils';
import DrawAPIs from '../APIs/draws';
import { formatDate, formatTime } from '../Utils/Utils';
import CustomNotification from '../components/CustomNotification';
import loginAudio from "../components/Audiofiles/login.mp3"
import drawAudio from "../components/Audiofiles/drawSelected.mp3"
import oversaleAudio from "../components/Audiofiles/oversale.mp3"
import errorAudio from "../components/Audiofiles/Error.mp3"
import axios from 'axios';

export default function Merchent() {
    const [currentLoggedInUser, setCurrentLoggedInUser] = useState({ generalInfo: { name: '' }, username: '' });
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [showSheetModal, setShowSheetModal] = useState(false);
    const [showOversaleEditModal, setShowOversaleEditModal] = useState(false);
    const [auto, setAuto] = useState(false);
    const [checkedSavedPurchases, setCheckedSavedPurchases] = useState([])
    const [checkedOversales, setCheckedOversales] = useState([])
    const [deleteAllCheckedOversalesInput, setDeleteAllCheckedOversalesInput] = useState(false)
    const [isPurchaseMade, setIsPurchaseMade] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState("")
    const [sheetName, setSheetName] = useState('');
    const [message, setMessage] = useState('');
    const [messagePurchases, setMessagePurchases] = useState([]);
    const [oversales, setOversales] = useState([]);
    const [showOversaleModal, setShowOversaleModal] = useState(false);
    const [showGeneralsaleModal, setShowGeneralsaleModal] = useState(false);
    const [generalSaleSearch, setGeneralSaleSearch] = useState("")
    const [overSaleOption, setOverSaleOption] = useState(3)
    const [generalSaleOption, setGeneralSaleOption] = useState(3)

    const [deleteAllSelected, setDeleteAllSelected] = useState(false)
    const [currentFocused, setCurrentFocused] = useState(1)
    const [draws, setDraws] = useState([]);
    const [currentDraw, setCurrentDraw] = useState(null)
    const [savedPurchases, setSavedPurchases] = useState([]);
    const [availableArticles, setAvailableArticles] = useState(null)
    const [articleDataFetched, setArticleDataFetched] = useState(false)

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
    const loginAudioRef = useRef(null);
    const drawAudioRef = useRef(null);
    const oversaleAudioRef = useRef(null);
    const errorAudioRef = useRef(null);

    if (!localStorageUtils.hasToken()) {
        window.location = "/login"
    }


    useEffect(() => {
        try {
            loginAudioRef?.current?.play();
        } catch (e) { }


        if (window.innerWidth < 700) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflowX = 'hidden';
        }
        fetchLoggedInUser();
        fetchDraws();
        // setInterval(calculateRemainingTime,500)
        return () => {
            document.body.style.overflow = 'auto';
            // localStorage.removeItem("jwt_token");
            // localStorageUtils.removeLoggedInUser();
            if (intervalId)
                clearInterval(intervalId);
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

    const getSavedPurchasesOfCurrentDraw = (selectedDraw, loggedInUser = null) => {
        let currentLoggedInUser1 = loggedInUser ? loggedInUser : currentLoggedInUser
        let purchasedFromDrawData = currentLoggedInUser1.purchasedFromDrawData
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
        try {
            console.log("Updating current user!!!!!!!!!!")
            const res = await APIs.updateUser(currentLoggedInUser)
            setCurrentLoggedInUser({ ...res.user })
            if (form.selectedDraw) {
                getSavedPurchasesOfCurrentDraw(form.selectedDraw, res.user)
            }
        } catch (e) { }

    }
    function isCurrentFocusedNotEmpty() {
        let first = form.first + ""
        let second = form.second + ""
        if (currentFocused == 1) {
            return form.bundle && 1
        }
        if (currentFocused == 2) {
            return first && 1
        }
        if (currentFocused == 3) {
            return second && 1
        }
    }
    const handlePurchaseOne = async (bundle, first, second) => {
        {
            // if (isPurchaseMade || !articleDataFetched) {
            //     return
            // }

            if (!isCurrentFocusedNotEmpty()) {
                return
            }
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

        }
        let firstStr = first + ""
        let secondStr = second + ""
        if (!firstStr || !secondStr || !bundle) {
            return
        }

        if (first <= 0 && second <= 0) {
            return
        }

        let purchase = { bundle, first, second }
        setAvailableArticles(null)
        setForm({ ...form, bundle: '' })
        setIsPurchaseMade(true)
        const makeOnePurchase = async () => {
            let purchases = [{ ...getDataForBundle(purchase.bundle, currentDraw), ...purchase }]
            let temp = {
                draw_id: currentDraw._id,
                user_id: currentLoggedInUser._id,
                purchases: purchases,
                message: null,
            }
            let response = await articlesAPI.makeBulkPurchase(temp)
            if (response.user) {
                if (response.inSufCount == 1) {
                    alertMessage("Balance Insufficent for " + response.inSufCount + " purchases")
                    errorAudioRef?.current?.play()
                } else {
                    successMessage("Purchase Saved")
                }
                if (response.oversaleCount > 0) {
                    oversaleAudioRef?.current?.play()
                }

                setCurrentLoggedInUser({ ...response.user })
                if (form.selectedDraw) {
                    getSavedPurchasesOfCurrentDraw(form.selectedDraw, response.user)
                }
            }
        }
        makeOnePurchase()


        setIsPurchaseMade(false)
    };

    // const handlePurchaseOne = async (bundle, first, second, showGreen = true) => {
    //     {

    //         if (!isCurrentFocusedNotEmpty()) {
    //             return
    //         }
    //         if (!auto) {
    //             if (currentFocused < 3) {
    //                 setCurrentFocused(currentFocused + 1)
    //                 return
    //             }
    //             if (currentFocused == 3) {
    //                 setCurrentFocused((1))
    //             }
    //         } else {
    //             if (currentFocused != 1) {
    //                 if (currentFocused == 3) {
    //                     setCurrentFocused(1)
    //                     return
    //                 }
    //                 setCurrentFocused(currentFocused + 1)
    //                 return
    //             }
    //         }

    //     }
    //     let firstStr = first + ""
    //     let secondStr = second + ""
    //     if (!firstStr || !secondStr || !bundle) {
    //         return
    //     }

    //     if (first <= 0 && second <= 0) {
    //         return
    //     }
    //     setForm({...form,bundle:""})
    //     setAvailableArticles(null)
    //     setIsPurchaseMade(true)
    //     let purchasedFromDrawData = currentLoggedInUser.purchasedFromDrawData
    //     let purchasedDrawData = purchasedFromDrawData.find(data => data.drawId === form.selectedDraw)
    //     let overSaleFirst = 0
    //     let overSaleSecond = 0
    //     const data1 = getDataForBundle(bundle, currentDraw);
    //     const response = await articlesAPI.getFirstAndSecond(data1);
    //     let availableFirstPrice = response.data.firstPrice
    //     let availableSecondPrice = response.data.secondPrice

    //     if (first > availableFirstPrice) {
    //         overSaleFirst = first - availableFirstPrice
    //         first = availableFirstPrice
    //     }
    //     if (second > availableSecondPrice) {
    //         overSaleSecond = second - availableSecondPrice
    //         second = availableSecondPrice
    //     }

    //     if ((Number(first) + Number(second)) > currentLoggedInUser.balance) {
    //         // errorAudioRef?.current?.play()
    //         alertMessage("You dont have enough balance for this purchase.")
    //         return
    //     }

    //     if (purchasedDrawData) {
    //         purchasedDrawData.savedPurchases.push({
    //             bundle, first, second
    //         })
    //         if (overSaleFirst > 0 || overSaleSecond > 0) {
    //             purchasedDrawData.savedOversales.push({
    //                 bundle, first: overSaleFirst, second: overSaleSecond
    //             })
    //             oversaleAudioRef?.current?.play()
    //         }
    //     } else {
    //         purchasedDrawData = {
    //             drawId: form.selectedDraw,
    //             savedPurchases: [{
    //                 bundle, first, second
    //             }]
    //         }
    //         if (overSaleFirst > 0 || overSaleSecond > 0) {
    //             purchasedDrawData = {
    //                 ...purchasedDrawData,
    //                 savedOversales: [{
    //                     bundle, first: overSaleFirst, second: overSaleSecond
    //                 }]
    //             }
    //             oversaleAudioRef?.current?.play()
    //         }
    //         purchasedFromDrawData.push(purchasedDrawData)

    //     }
    //     // firstDigitId, secondDigitId, bundle , purchaseFirst ,purchaseSecond, type
    //     let data = getDataForBundle(bundle, currentDraw)
    //     data = {
    //         ...data,
    //         purchaseFirst: first,
    //         purchaseSecond: second,
    //         type: "-",
    //         askingUser: localStorageUtils.getLoggedInUser()._id
    //     }
    //     if (showGreen) {
    //         successMessage("Purcahse added successfuly")
    //     }
    //     if (first > 0 || second > 0) {
    //         setSavedPurchases([...savedPurchases, { _id: "", bundle, first, second }])
    //     }
    //     if (overSaleFirst > 0 || overSaleSecond > 0) {
    //         setOversales([...oversales, { _id: "", bundle, first: overSaleFirst, second: overSaleSecond }])
    //     }
    //     await articlesAPI.updateDigit(data)
    //     setForm({ ...form, bundle: '' })
    //     currentLoggedInUser.balance = currentLoggedInUser.balance - (Number(first) + Number(second))
    //     setCurrentLoggedInUser(currentLoggedInUser)
    //     const res = await APIs.updateUser(currentLoggedInUser)
    //     setCurrentLoggedInUser({ ...res.user })
    //     if (form.selectedDraw) {
    //         getSavedPurchasesOfCurrentDraw(form.selectedDraw, res.user)
    //     }
    //     setIsPurchaseMade(false)
    //     // handleBundleChange(bundle)
    //     // setShowModal(false);
    // };

    function successMessage(msg) {
        setNotification({ ...notification, color: "", show: true, message: msg })
    }
    function alertMessage(msg) {
        errorAudioRef?.current?.play()
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
            setArticleDataFetched(false)
            setForm({ ...form, bundle: bundle });

            if (bundle.length > 0) {
                const data = getDataForBundle(bundle, currentDraw);
                const response = await articlesAPI.getFirstAndSecond(data);
                setAvailableArticles({ ...response.data });
                setArticleDataFetched(true)
                return ({ ...response.data });
            }
            setAvailableArticles(null);
        }
    };

    const [intervalId, setIntervalId] = useState(null)
    const handleChangeDraw = async (event) => {
        let value = event.target.value

        if (value == form.selectedDraw) {
            return
        }
        if (intervalId) {
            clearInterval(intervalId);
        }
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
        drawAudioRef?.current?.play()
        const newIntervalId = setInterval(() => calculateRemainingTime(fetchedDraws.find(draw => draw._id == value)), 1000)
        setIntervalId(newIntervalId);
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
        if (message.length === 0) {
            setMessagePurchases([]);
            return;
        }
        try {
            let purchases = []
            function setFirstsAndSeconds(first,second) {
                purchases = purchases.map(purchase => {
                    let data = { ...purchase }
                    if (!data.first) {
                        data.first = first
                    }
                    if (!data.second) {
                        data.second= second
                    }
                    return data
                })
            }
            function setFirsts(first) {
                purchases = purchases.map(purchase => {
                    let data = { ...purchase }
                    if (!data.first) {
                        data.first = first
                    }
                    return data
                })
            }
            function setSeonds(second) {
                purchases = purchases.map(purchase => {
                    let data = { ...purchase }
                    if (!data.second) {
                        data.second = second
                    }
                    return data
                })
            }
            let tempMessage = message.replace(/\s/g, '').replace(/,/g, '.'); // Replacing commas with dots
            tempMessage = tempMessage.replace(/[a-zA-Z]/g, match => match.toLowerCase());
            let chunks = tempMessage.split(".")
            chunks.forEach(chunk => {
                if (chunk[0] == "f") {
                    let numbers = chunk.match(/\d+/g);
                    let firstNumber = parseInt(numbers[0]);
                    let secondNumber = parseInt(numbers[1]);
                    setFirstsAndSeconds(firstNumber,secondNumber)
                } else {
                    purchases.push({ bundle: chunk, first: null, second: null })
                }
            })
            setMessagePurchases([...purchases]);
        } catch (e) {
            // Handle the error
        }
    }
    const handleMakeMessagePurchases = async () => {
        setIsLoading(true)
        let purchases = messagePurchases.map(purchase => {
            return ({ ...getDataForBundle(purchase.bundle, currentDraw), ...purchase })
        })
        let tempMessage = message.replace(/\s/g, '').replace(/,/g, '.');
        tempMessage = tempMessage.replace(/[a-zA-Z]/g, match => match.toLowerCase());
        let temp = {
            draw_id: currentDraw._id,
            user_id: currentLoggedInUser._id,
            purchases: purchases,
            message: tempMessage,
        }
        let response = await articlesAPI.makeBulkPurchase(temp)
        if (response.user) {
            if (response.inSufCount > 0) {
                alertMessage("Balance Insufficent for " + response.inSufCount + " purchases")
                errorAudioRef?.current?.play()
            } else {
                successMessage("Purchase Saved")
            }
            if (response.oversaleCount > 0) {
                // alert("Oversale count: "+response.oversaleCount)
                oversaleAudioRef?.current?.play()
            }

            setCurrentLoggedInUser({ ...response.user })
            if (form.selectedDraw) {
                getSavedPurchasesOfCurrentDraw(form.selectedDraw, response.user)
            }
            setMessagePurchases([])
            setMessage("")
        }
        setIsLoading(false)
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
            // await handleBundleChange(target.bundle)
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
            await sleep(2000);
            oversaleAudioRef?.current?.play()
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
        oversaleAudioRef?.current?.play()
        // setOversales([...purchasedDrawData.savedOversales])
    };

    function successMessage(msg) {
        setNotification({ ...notification, color: "", show: true, message: msg })
    }
    function alertMessage(msg) {
        errorAudioRef?.current?.play()
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
    const handleMultipleSavedPurchaseDelete = async () => {
        try {
            if (!window.confirm("You are deleting " + checkedSavedPurchases.length + " entries. Do you confirm ?")) {
                return
            }
            setIsDeleting(true)
            let purchases = checkedSavedPurchases.map(purchase => {
                return ({ ...getDataForBundle(purchase.bundle, currentDraw), ...purchase })
            })
            let temp = {
                draw_id: currentDraw._id,
                user_id: currentLoggedInUser._id,
                purchases: purchases
            }
            let response = await articlesAPI.removeBulkPurchase(temp)
            if (response.user) {
                successMessage("Purchases Removed")
                setCurrentLoggedInUser({ ...response.user })
                if (form.selectedDraw) {
                    getSavedPurchasesOfCurrentDraw(form.selectedDraw, response.user)
                }
            }
            // for (let purchase of checkedSavedPurchases) {
            //     await handleRemovingSavedPurchase(purchase._id)
            // }
            setCheckedSavedPurchases([])
            setIsDeleting(false)
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
        let oldRecs = currentLoggedInUser.savedPurchasesFromDrawsData.filter(data => data.drawId == currentDraw._id)
        if (oldRecs) {
            oldRecs.forEach(rec => {
                savedOversales = [...savedOversales, ...rec.savedOversales]
            })
        }
        savedOversales = [...savedOversales, ...(currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId == currentDraw._id).savedOversales)]
        savedOversales = savedOversales.filter(purchase => purchase.first != 0 || purchase.second != 0)
        setOversales(savedOversales)
    }
    const handleInvoiceGeneralSales = () => {
        let savedPurchases = []
        let oldRecs = currentLoggedInUser.savedPurchasesFromDrawsData.filter(data => data.drawId == currentDraw._id)
        if (oldRecs) {
            oldRecs.forEach(rec => {
                savedPurchases = [...savedPurchases, ...rec.savedPurchases]
            })
        }
        savedPurchases = [...savedPurchases, ...(currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId == currentDraw._id).savedPurchases)]

        savedPurchases = savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0)
        setSavedPurchases(savedPurchases)

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
        result = result.filter(purchase => purchase.first != 0 || purchase.second != 0)

        result = result.sort((a, b) => {
            return Number('1' + a.bundle) - Number('1' + b.bundle);
        });
        setOversales(result)
    }
    const handleTotalGeneralsales = () => {
        let savedPurchases = []
        savedPurchases = [...(currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId == currentDraw._id).savedPurchases)]
        let oldRecs = currentLoggedInUser.savedPurchasesFromDrawsData.filter(data => data.drawId == currentDraw._id)
        if (oldRecs) {
            oldRecs.forEach(rec => {
                savedPurchases = [...savedPurchases, ...rec.savedPurchases]
            })
        }
        const bundleMap = new Map();
        savedPurchases.forEach(item => {
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
        result = result.filter(purchase => purchase.first != 0 || purchase.second != 0)

        result = result.sort((a, b) => {
            return Number('1' + a.bundle) - Number('1' + b.bundle);
        });

        setSavedPurchases(result)
    }

    const handleCurrentOversale = () => {
        let temp1 = currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId == currentDraw._id)
        if (temp1) {
            if (temp1.savedOversales) {
                setOversales([...temp1.savedOversales.filter(purchase => purchase.first != 0 || purchase.second != 0)])
            }
        }
    }
    const handleCurrentGeneralsale = () => {
        let temp1 = currentLoggedInUser.purchasedFromDrawData.find(data => data.drawId == currentDraw._id)
        if (temp1) {
            if (temp1.savedPurchases) {
                setSavedPurchases([...temp1.savedPurchases.filter(purchase => purchase.first != 0 || purchase.second != 0)])
            }
        }
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
    function getRowColor(bundle) {
        if (bundle.length == 1) {
            return "orange"
        }
        if (bundle.length == 2) {
            return "#8699A2"
        }
        if (bundle.length == 3) {
            return "yellow"
        }
        if (bundle.length == 4) {
            return "cyan"
        }
    }
    const handleKeyDown = (event, nextInputRef) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevents the default behavior of the Enter key (e.g., form submission)
            if (!auto) {
                nextInputRef.current.focus();
                if (currentFocused < 3) {
                    setCurrentFocused(currentFocused + 1)
                } else {
                    setCurrentFocused(1)
                    handlePurchaseOne(form.bundle, form.first, form.second)
                }
            } else {
                if (currentFocused != 1) {
                    if (currentFocused < 3) {
                        setCurrentFocused(currentFocused + 1)
                        nextInputRef.current.focus();
                    } else {
                        setCurrentFocused(1)
                        bundleRef.current.focus();
                    }
                } else {
                    handlePurchaseOne(form.bundle, form.first, form.second)
                    // setForm({...form, bundle:""})
                }
            }
        }
    };
    function getTotalMessageCount() {
        let res = currentLoggedInUser?.messagesData?.find(data => data.drawId == currentDraw?._id)?.messages?.length
        if (!res) {
            return 0
        }
        return res
    }
    function getMessageRepeatCount() {
        let messages = currentLoggedInUser?.messagesData?.find(data => data.drawId == currentDraw?._id)?.messages
        if (messages) {
            let tempMessage = message.replace(/\s/g, '').replace(/,/g, '.');
            tempMessage = tempMessage.replace(/[a-zA-Z]/g, match => match.toLowerCase());
            let sameMessages = messages.filter(msg => msg == tempMessage)
            if (sameMessages) {
                return sameMessages.length
            } else {
                return 0
            }
        } else {
            return 0
        }

    }
    const getFilteredGeneralSales = () => {
        if (!generalSaleSearch) {
            return savedPurchases;
        }

        const exactMatches = savedPurchases.filter(purchase => purchase.bundle === generalSaleSearch);
        const startsWithMatches = savedPurchases.filter(purchase => purchase.bundle.startsWith(generalSaleSearch));

        // Filter out items from startsWithMatches that are already in exactMatches
        const filteredStartsWithMatches = startsWithMatches.filter(purchase =>
            !exactMatches.some(exactPurchase => exactPurchase === purchase)
        );

        return [...exactMatches, ...filteredStartsWithMatches];
    };

    return (
        <div className='app-container'>
            <audio controls ref={loginAudioRef} style={{ display: 'none' }}>
                <source src={loginAudio} type="audio/mp3" />
            </audio>
            <audio controls ref={drawAudioRef} style={{ display: 'none' }}>
                <source src={drawAudio} type="audio/mp3" />
            </audio>
            <audio controls ref={oversaleAudioRef} style={{ display: 'none' }}>
                <source src={oversaleAudio} type="audio/mp3" />
            </audio>
            <audio controls ref={errorAudioRef} style={{ display: 'none' }}>
                <source src={errorAudio} type="audio/mp3" />
            </audio>

            {window.innerWidth <= 700 ?
                <div>
                    <div className='d-flex justify-content-around ' style={{ backgroundColor: "#6200ea", }}>
                        <h6 style={{ color: "white", fontSize: "0.8rem", }}>{currentLoggedInUser.username}</h6>
                        <h6 style={{ color: "white", fontSize: "0.8rem", }}>{currentLoggedInUser && currentLoggedInUser?.balance?.toFixed(1)}</h6>
                        {/* <h6 style={{color:"white"}}>Avaliable Balance: {currentLoggedInUser.availableBalance}</h6> */}
                    </div>
                    <div className='d-flex justify-content-around ' style={{ backgroundColor: "purple", marginTop: "1px" }}>
                        <h6 style={{ color: "white", fontSize: "0.8rem", marginLeft: "5px", paddingTop: "6px" }}>{currentDraw ? currentDraw.title : "Draw"}</h6>
                        <h6 style={{ color: "white", fontSize: "0.8rem", paddingTop: "6px" }}>{timeRemaining}</h6>
                        {/* <h6 style={{color:"white"}}>Avaliable Balance: {currentLoggedInUser.availableBalance}</h6> */}
                    </div>
                    <div className='container-fluid d-flex justify-content-around' style={{ backgroundColor: "purple" }}>
                        <div>
                            <div className='d-flex justify-content-end' >
                                <Button variant='primary btn btn-sm'
                                    disabled={!currentDraw}
                                    style={{ fontSize: "0.7rem", marginRight: "10px" }}
                                    onClick={() => { setShowGeneralsaleModal(true); handleCurrentGeneralsale(); setGeneralSaleOption(3) }}>
                                    GeneralSale
                                </Button>

                                <Button variant="btn btn-sm btn-danger"
                                    style={{ fontSize: "0.7rem" }}
                                    onClick={handleMultipleSavedPurchaseDelete}
                                    disabled={checkedSavedPurchases.length <= 0 || isDeleting}>
                                    {isDeleting ? "Deleting" : "Delete"}
                                </Button>
                            </div>
                        </div>
                        <div>
                            <select onChange={handleChangeDraw} style={{ textAlign: "center", fontSize: "0.8rem", color: "white", backgroundColor: "purple", height: "4vh" }}>
                                <option value="" disabled={!currentLoggedInUser}>Select Draw</option>

                                {draws.map((draw) => (
                                    <option key={draw._id} value={draw._id}>
                                        {formatDate(draw.drawDate) + " , " + formatTime(draw.drawTime)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className='row' >
                        <div className='col-7'>
                            <div className='row'>
                                <div className='col-12'>
                                    <Table bordered hover size="sm" className="" style={{ fontSize: '0.6rem', marginLeft: "10px" }}>
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
                                                        style={{ marginLeft: "8px", backgroundColor: getRowColor(purchase.bundle) }}
                                                    />
                                                </td>

                                                <td className='col-2' style={{ fontWeight: "bold", backgroundColor: getRowColor(purchase.bundle) }}>{purchase.bundle}</td>
                                                <td className='col-2' style={{ fontWeight: "bold", backgroundColor: getRowColor(purchase.bundle) }}>{purchase.first}</td>
                                                <td className='col-2' style={{ fontWeight: "bold", backgroundColor: getRowColor(purchase.bundle) }}>{purchase.second}</td>
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
                        <div className='col-5 mt-2 ' style={{ marginLeft: "-11px", backgroundColor: "purple" }}>
                            <div className=''>
                                <div className='d-flex justify-content-between  mt-1 '>
                                    <Button variant='btn btn-primary  btn-sm'
                                        disabled={!currentDraw}
                                        style={{ fontSize: "0.7rem", marginTop: "0px", border: "none" }} onClick={() => { setShowOversaleModal(true); handleCurrentOversale(); setOverSaleOption(3) }}>
                                        Oversales
                                    </Button>
                                    <Button variant='primary btn btn-sm' style={{ border: "none" }} onClick={() => setShowSheetModal(true)} disabled={savedPurchases.length <= 0} style={{ fontSize: "0.7rem", marginRight: "8px" }}>
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
                                                    <td style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.bundle}</td>
                                                    <td style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.first}</td>
                                                    <td style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.second}</td>
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
                    <div className='d-flex justify-content-start' style={{ marginTop: "-15px" }}>
                        <div className='col-2' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                        <div className='col-2' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: "12px" }}>
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
                        <div className='col-2' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: "19px" }}>
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
                            <h6 className='text-center' style={{ fontWeight: 'normal', fontSize: "0.8rem", marginTop: "4px" }}>
                                .
                            </h6>


                            <Button variant='primary btn btn-sm'
                                style={{ width: "40px", fontSize: "0.7rem", marginTop: "2px" }}
                                onClick={() => handlePurchaseOne(form.bundle, form.first, form.second)} >
                                Add
                            </Button>
                        </div>

                        <div className='col-2' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h6 className='text-center' style={{ fontWeight: 'normal', fontSize: "0.8rem", marginTop: "4px" }}>
                                .
                            </h6>

                            <Button variant='primary btn btn-sm'
                                style={{ fontSize: "0.8rem", marginTop: "0px" }}
                                onClick={() => setShowModal(true)}>
                                SMS
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
                                            style={{ fontSize: "0.8rem", marginTop: "0px", marginRight: "3px" }}
                                            onClick={() => { handleCheckedOverSaleDeletes(); }}
                                        >
                                            Delete
                                        </Button>
                                        <Button variant='btn btn-primary  btn-sm'
                                            style={{ fontSize: "0.8rem", marginTop: "0px", marginRight: "3px" }} onClick={() => { handleInvoiceOversales(); setOverSaleOption(1) }}>
                                            Invoice
                                        </Button>
                                        <Button variant='btn btn-primary  btn-sm'
                                            style={{ fontSize: "0.8rem", marginTop: "0px", marginRight: "3px" }} onClick={() => { handleTotalOversales(); setOverSaleOption(2); setCheckedOversales([]) }}>
                                            All Total
                                        </Button>
                                        <Button variant='btn btn-primary  btn-sm'
                                            style={{ fontSize: "0.8rem", marginTop: "0px" }} onClick={() => { handleCurrentOversale(); setOverSaleOption(3) }}>
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
                                                                style={{ padding: "2px", backgroundColor: getRowColor(purchase.bundle) }}
                                                            />
                                                        </td>
                                                        <td className='col-3' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.bundle}</td>
                                                        <td className='col-3' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.first}</td>
                                                        <td className='col-3' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.second}</td>
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
                                <div className='d-flex justify-content-between'>
                                    <h6>Total: {getTotalMessageCount()}</h6>
                                    <h6>Reapted: {getMessageRepeatCount()}</h6>
                                </div>
                                {isLoading &&
                                    <div>
                                        <h6>Making Purchases</h6>
                                    </div>
                                }
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

                                                <Button variant='primary btn btn-sm'
                                                    onClick={handleMakeMessagePurchases}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? "Loading" : "Confirm"}
                                                </Button>
                                            </div>
                                        </div>
                                    }

                                </Form>
                            </Modal.Body>
                        </Modal>


                    </div>
                </div>
                :
                <div>
                    <div className='d-flex justify-content-around ' style={{ backgroundColor: "#6200ea", }}>
                        <h6 style={{ color: "white", fontSize: "1rem", }}>{currentLoggedInUser.username}</h6>
                        <div className='d-flex justify-content-around'>
                            <h6 style={{ color: "white", fontSize: "1rem", marginRight: "5vh" }}>Credit: {currentLoggedInUser && currentLoggedInUser?.credit?.toFixed(1)}</h6>
                            <h6 style={{ color: "white", fontSize: "1rem", }}>Balance: {currentLoggedInUser && currentLoggedInUser?.balance?.toFixed(1)}</h6>
                        </div>
                    </div>
                    <div className='d-flex justify-content-around' style={{ backgroundColor: "purple", marginTop: "1px" }}>
                        <h6 style={{ color: "white", fontSize: "1rem", marginLeft: "5px" }}>{currentDraw ? currentDraw.title : "Draw"}</h6>
                        <h6 style={{ color: "white", fontSize: "1rem", }}>{timeRemaining}</h6>
                    </div>
                    <div className='d-flex justify-content-around' style={{ backgroundColor: "purple" }}>
                        <select onChange={handleChangeDraw} style={{ textAlign: "center", fontSize: "1rem", width: "100vw", color: "white", backgroundColor: "purple", height: "4vh" }}>
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
                                    <Table bordered hover size="sm" className="" style={{ fontSize: '1rem', marginLeft: "10px" }}>
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
                                        <Button variant='primary btn btn-sm'
                                            style={{ fontSize: "1rem", marginRight: "10px" }}
                                            disabled={!currentDraw}

                                            onClick={() => { setShowGeneralsaleModal(true); handleCurrentGeneralsale(); setGeneralSaleOption(3) }}>
                                            GeneralSale
                                        </Button>

                                        <Button variant='primary btn btn-sm'
                                            style={{ fontSize: "1rem", marginRight: "10px" }}
                                            onClick={() => setShowModal(true)}>
                                            SMS
                                        </Button>

                                        <Button
                                            variant="btn btn-sm btn-danger"
                                            style={{ fontSize: "1rem", marginRight: "5px" }}
                                            onClick={handleMultipleSavedPurchaseDelete}
                                            disabled={checkedSavedPurchases.length <= 0 || isDeleting}>
                                            {isDeleting ? "Deleting" : "Delete"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: "-15px" }}>
                                <Table bordered hover size="sm" className="" style={{ fontSize: '1rem', }}>
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
                                                    className='text-center'
                                                />
                                            </th>
                                            <th className='col-2'>No</th>
                                            <th className='col-2'>F</th>
                                            <th className='col-2'>S</th>
                                        </tr>
                                    </thead>
                                </Table>
                            </div>
                            <div style={{ height: '310px', overflowY: 'auto', marginTop: "-15px" }}>
                                <Table bordered hover size="sm" className="" style={{ fontSize: '1rem', }}>
                                    <tbody>
                                        {savedPurchases.map(purchase => (
                                            <tr key={purchase._id} >
                                                <td className='col-1' >
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={checkedSavedPurchases.find(p => p._id == purchase._id)}
                                                        onChange={e => handleCheckedPurchases(purchase, e.target.checked)}
                                                        style={{ backgroundColor: getRowColor(purchase.bundle) }}
                                                        className='text-center'
                                                    />
                                                </td>

                                                <td className='col-2' style={{ fontWeight: "bold", backgroundColor: getRowColor(purchase.bundle) }}>{purchase.bundle}</td>
                                                <td className='col-2' style={{ fontWeight: "bold", backgroundColor: getRowColor(purchase.bundle) }}>{purchase.first}</td>
                                                <td className='col-2' style={{ fontWeight: "bold", backgroundColor: getRowColor(purchase.bundle) }}>{purchase.second}</td>
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
                        <div className='col-5 mt-1 ' style={{ marginLeft: "-11px", backgroundColor: "purple" }}>
                            <div className=''>
                                <div className='d-flex justify-content-between mt-1 '>
                                    <Button variant='btn btn-primary  btn-sm'
                                        disabled={!currentDraw}

                                        style={{ fontSize: "1rem", marginTop: "0px" }} onClick={() => { setShowOversaleModal(true); handleCurrentOversale(); setOverSaleOption(3) }}>
                                        Oversales
                                    </Button>
                                    <Button variant='primary btn btn-sm ' onClick={() => setShowSheetModal(true)} disabled={savedPurchases.length <= 0} style={{ fontSize: "1rem", marginRight: "8px" }}>
                                        Save
                                    </Button>

                                </div>
                                <div >
                                    <Table boarded hover size="sm" className="mt-2" style={{ fontSize: '1rem', marginTop: "-5px", }}>
                                        <thead>
                                            <tr>
                                                <th className='col-2'>No</th>
                                                <th className='col-2'>F</th>
                                                <th className='col-2'>S</th>
                                            </tr>
                                        </thead>
                                    </Table>
                                </div>

                                <div style={{ height: '310px', overflowY: 'auto', marginTop: "-7px" }}>
                                    <Table boarded hover size="sm" className="" style={{ fontSize: '1rem', marginTop: "-5px", fontWeight: "bold" }}>
                                        <tbody>
                                            {oversales.map(purchase => (
                                                <tr  >
                                                    <td className='col-2' style={{ backgroundColor: getRowColor(purchase.bundle), marginLeft: "10px" }}>{purchase.bundle}</td>
                                                    <td className='col-2' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.first}</td>
                                                    <td className='col-2' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.second}</td>
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
                    <div className='d-flex justify-content-start' style={{ marginTop: "-12px", marginLeft: "-20px" }}>
                        <div className='col-2' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className='d-flex justify-content-between' style={{ fontWeight: 'normal', fontSize: '1rem', marginTop: "2px" }}>
                                {/* <Form.Label style={{ marginLeft: '0px', }}>Auto</Form.Label> */}
                                <label htmlFor="autoCheckbox" style={{ marginLeft: '0px', }} className="">
                                    Auto
                                </label>
                                <Form.Check
                                    id="autoCheckbox"
                                    type="checkbox"
                                    style={{ marginLeft: "1px" }}
                                    checked={auto}
                                    onClick={(e) => setAuto(e.target.checked)}
                                />
                            </div>
                            <input className={"" + currentFocused == 1 ? "temp-border" : ""}
                                type='text'
                                ref={bundleRef}
                                placeholder='Num'
                                value={form.bundle}
                                onChange={(e) => handleBundleChange(e.target.value)}
                                onClick={() => { bundleRef.current.focus(); setCurrentFocused(1) }}
                                disabled={currentDraw == null}
                                style={{ width: "90px", fontSize: "1rem", marginLeft: "4px", fontWeight: "bold", marginTop: "7px" }}
                                onKeyDown={(event) => form.bundle && handleKeyDown(event, firstRef)}
                            />
                        </div>
                        <div className='col-2' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: "-110px" }}>
                            <h6 className='text-center' style={{ fontWeight: 'normal', fontSize: '1rem', marginTop: "4px" }}>
                                {availableArticles ? availableArticles.firstPrice : '.'}
                            </h6>
                            <input className={"" + currentFocused == 2 ? "temp-border" : ""}
                                type='number'
                                ref={firstRef}
                                placeholder='F'
                                value={form.first}
                                onChange={(e) => setForm({ ...form, first: e.target.value })}
                                onClick={() => { firstRef.current.focus(); setCurrentFocused(2) }}
                                disabled={currentDraw == null}
                                style={{ width: '90px', fontSize: '1rem', fontWeight: 'bold', marginTop: "3px" }}
                                onKeyDown={(event) => form.first && handleKeyDown(event, secondRef)}
                            />
                        </div>
                        <div className='col-2' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: "-110px" }}>
                            <h6 className='text-center' style={{ fontWeight: 'normal', fontSize: "1rem", marginTop: "4px" }}>
                                {availableArticles ? availableArticles.secondPrice : "."}
                            </h6>
                            <input className={"" + currentFocused == 3 ? "temp-border" : ""}
                                ref={secondRef}
                                type='number'
                                placeholder='S'
                                value={form.second}
                                onChange={(e) => setForm({ ...form, second: e.target.value })}
                                onClick={() => { secondRef.current.focus(); setCurrentFocused(3) }}
                                disabled={currentDraw == null}
                                style={{ width: "90px", fontSize: "1rem", fontWeight: "bold", marginTop: "3px" }}
                                onKeyDown={(event) => form.second && handleKeyDown(event, bundleRef)}
                            />
                        </div>
                        <div className='col-2' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: "-110px" }}>
                            <h6 className='text-center' style={{ fontWeight: 'normal', fontSize: "0.8rem", marginTop: "4px" }}>
                                .
                            </h6>

                            <Button variant='primary btn btn-sm'
                                style={{ fontSize: "1rem", marginTop: "2px" }}
                                onClick={() => handlePurchaseOne(form.bundle, form.first, form.second)} >
                                Add
                            </Button>
                        </div>

                        {/* <div className='col-2' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h6 className='text-center' style={{ fontWeight: 'normal', fontSize: "1rem", marginTop: "4px" }}>
                                .
                            </h6>

                            <Button variant='primary btn btn-sm'
                                style={{ fontSize: "1rem", marginTop: "-5px" }}
                                onClick={() => setShowModal(true)}>
                                SMS
                            </Button>
                        </div> */}

                    </div>

                    <div>

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
                                <div className='d-flex justify-content-between'>
                                    <h6>Total: {getTotalMessageCount()}</h6>
                                    <h6>Reapted: {getMessageRepeatCount()}</h6>
                                </div>
                                {isLoading &&
                                    <div>
                                        <h6>Loading</h6>
                                    </div>
                                }
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

                                                <Button variant='primary btn btn-sm' onClick={handleMakeMessagePurchases}
                                                    disabled={isLoading}>
                                                    {isLoading ? "Loading" : "Confirm"}
                                                </Button>
                                            </div>
                                        </div>
                                    }

                                </Form>
                            </Modal.Body>
                        </Modal>
                    </div>
                </div>
            }

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
                                    style={{ fontSize: "0.8rem", marginTop: "0px", marginRight: "3px" }}
                                    onClick={() => { handleCheckedOverSaleDeletes(); }}
                                >
                                    Delete
                                </Button>
                                <Button variant='btn btn-primary  btn-sm'
                                    style={{ fontSize: "0.8rem", marginTop: "0px", marginRight: "3px" }} onClick={() => { handleInvoiceOversales(); setOverSaleOption(1) }}>
                                    Invoice
                                </Button>
                                <Button variant='btn btn-primary  btn-sm'
                                    style={{ fontSize: "0.8rem", marginTop: "0px", marginRight: "3px" }} onClick={() => { handleTotalOversales(); setOverSaleOption(2); setCheckedOversales([]) }}>
                                    All Total
                                </Button>
                                <Button variant='btn btn-primary  btn-sm'
                                    style={{ fontSize: "0.8rem", marginTop: "0px" }} onClick={() => { handleCurrentOversale(); setOverSaleOption(3) }}>
                                    Current
                                </Button>

                            </div>
                        </div>
                        <Table bordered hover size="" className="" style={{ fontSize: '1rem', marginTop: "3px" }}>
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
                        <div style={{ height: '320px', overflowY: 'auto', marginTop: "-17px" }}>
                            <Table bordered hover size="" className="" style={{ fontSize: '1rem', }}>
                                {overSaleOption == 2 ?
                                    <tbody>
                                        {oversales.map(purchase => (
                                            <tr>
                                                <td className='col-4' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.bundle}</td>
                                                <td className='col-4' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.first}</td>
                                                <td className='col-4' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.second}</td>
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
                                                        style={{ padding: "2px", backgroundColor: getRowColor(purchase.bundle) }}
                                                    />
                                                </td>
                                                <td className='col-3' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.bundle}</td>
                                                <td className='col-3' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.first}</td>
                                                <td className='col-3' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.second}</td>
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

                {/* General Sales */}

                <Modal show={showGeneralsaleModal}
                    onHide={() => {
                        setCheckedSavedPurchases([]); handleCurrentGeneralsale();
                        setShowGeneralsaleModal(false)
                    }
                    }
                >
                    <Modal.Header closeButton>
                        <Modal.Title>General Sale</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>

                        <div className='d-flex justify-content-between'>
                            <div>
                                <h6>
                                    {generalSaleOption == 1 && "Invoice"}
                                    {generalSaleOption == 2 && "All Total"}
                                    {generalSaleOption == 3 && "Current"}
                                </h6>
                            </div>
                            <div className='d-flex justify-content-end' >
                                <Button variant='btn btn-danger  btn-sm'
                                    style={{ fontSize: "0.8rem", marginTop: "0px", marginRight: "3px" }}
                                    onClick={handleMultipleSavedPurchaseDelete}
                                    disabled={checkedSavedPurchases.length <= 0 || isDeleting}
                                >
                                    {isDeleting ? "Deleting" : "Delete"}
                                </Button>
                                <Button variant='btn btn-primary  btn-sm'
                                    style={{ fontSize: "0.8rem", marginTop: "00px", marginRight: "3px" }}
                                    onClick={() => { handleInvoiceGeneralSales(); setGeneralSaleOption(1) }}
                                >
                                    Invoice
                                </Button>
                                <Button variant='btn btn-primary  btn-sm'
                                    style={{ fontSize: "0.8rem", marginTop: "0px", marginRight: "3px" }}
                                    onClick={() => { handleTotalGeneralsales(); setGeneralSaleOption(2); setCheckedSavedPurchases([]) }}
                                >
                                    All Total
                                </Button>
                                <Button variant='btn btn-primary  btn-sm'
                                    style={{ fontSize: "0.8rem", marginTop: "0px" }}
                                    onClick={() => { handleCurrentGeneralsale(); setGeneralSaleOption(3) }}
                                >
                                    Current
                                </Button>
                            </div>
                        </div>
                        <div className='mt-1'>
                            <Form.Control
                                type="text"
                                placeholder='Search Bundle'
                                value={generalSaleSearch}
                                onChange={(e) =>
                                    setGeneralSaleSearch(e.target.value)
                                }
                            />
                        </div>
                        <Table bordered hover size="" className="" style={{ fontSize: '1rem', marginTop: "3px" }}>
                            <thead>
                                <tr>
                                    {(generalSaleOption == 3) &&
                                        <>
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

                                                    className='text-center'

                                                    style={{ marginLeft: "8px" }}
                                                />
                                            </th>
                                            <th className='col-3'>No</th>
                                            <th className='col-3'>F</th>
                                            <th className='col-3'>S</th>

                                        </>
                                    }
                                    {(generalSaleOption == 1 || generalSaleOption == 2) &&
                                        <>
                                            <th className='col-4'>No</th>
                                            <th className='col-4'>F</th>
                                            <th className='col-4'>S</th>
                                        </>
                                    }
                                </tr>
                            </thead>
                        </Table>
                        <div style={{ height: '320px', overflowY: 'auto', marginTop: "-17px" }}>
                            <Table bordered hover size="" className="" style={{ fontSize: '1rem', }}>
                                {generalSaleOption == 1 || generalSaleOption == 2 ?
                                    <tbody>
                                        {getFilteredGeneralSales().map(purchase => (
                                            <tr>
                                                <td className='col-4' style={{ backgroundColor: getRowColor(purchase.bundle) }} >{purchase.bundle}</td>
                                                <td className='col-4' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.first}</td>
                                                <td className='col-4' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.second}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    :
                                    <tbody>
                                        {getFilteredGeneralSales().map(purchase => (
                                            <tr>
                                                <td className='col-1' >

                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={checkedSavedPurchases.find(p => p._id == purchase._id)}
                                                        onChange={e => handleCheckedPurchases(purchase, e.target.checked)}
                                                        style={{ backgroundColor: getRowColor(purchase.bundle) }}
                                                        className='text-center'
                                                        style={{ padding: "2px", backgroundColor: getRowColor(purchase.bundle) }}
                                                    />
                                                </td>
                                                <td className='col-3' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.bundle}</td>
                                                <td className='col-3' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.first}</td>
                                                <td className='col-3' style={{ backgroundColor: getRowColor(purchase.bundle) }}>{purchase.second}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                }
                            </Table>

                        </div>
                    </Modal.Body>
                </Modal>


            </div>
        </div >
    );
}

