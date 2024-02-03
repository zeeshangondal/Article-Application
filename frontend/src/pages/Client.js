
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import APIs from '../APIs/users';
import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';
import { Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { formatDate, formatNumberWithTwoDecimals } from '../Utils/Utils';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { useNavigate } from 'react-router-dom';


let initialCreditTransaction = {
    description: '',
    txType: 1, // Default value, you can set it to the initial option value
    amount: 0,
}

let initialDebitTransaction = {
    description: '',
    txType: 1, // Default value, you can set it to the initial option value
    amount: 0,
    reduce: 1
}

const UserDetails = () => {
    const { _id } = useParams();
    const [userDetails, setUserDetails] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [paymentMode, setPaymentMode] = useState(false);
    const [paymentModeN, setPaymentModeN] = useState(0);
    const [editModeN, setEditModeN] = useState(1);
    const [showModel, setShowModel] = useState(0);
    const [formValues, setFormValues] = useState({});
    const [creditTransaction, setCreditTransaction] = useState({ ...initialCreditTransaction });
    const [debitTransaction, setDebitTransaction] = useState({ ...initialDebitTransaction });
    const [transactionStatEndDates, setTransactionStatEndDates] = useState({ startDate: '', endDate: '' })
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    const handleFormInputChange = (category, field, value) => {
        if (category == "hadd" && field == "haddEnabled" && value === true) {
            if (formValues.commission.shareEnabled) {
                alert("You can not enable Hadd when the Share is enabled. If you want to enable Hadd you need to disable Share")
                return
            }
        }
        if (category == "commission" && field == "shareEnabled" && value === true) {
            if (formValues.hadd.haddEnabled) {
                alert("You can not enable Share when the Hadd is enabled. If you want to enable Share you need to disable Hadd")
                return
            }
        }
        if (field == "share") {
            const loggedInUser = localStorageUtils.getLoggedInUser();
            if (loggedInUser.username != "admin" && value > loggedInUser.commission.share) {
                alert("Your assigned share is " + loggedInUser.commission.share + " You cannot give more share then that")
                return
            }
        }
        if (field == "pcPercentage") {
            const loggedInUser = localStorageUtils.getLoggedInUser();
            if (loggedInUser.username != "admin" && value > loggedInUser.commission.pcPercentage) {
                alert("Your assigned pc Percentage is " + loggedInUser.commission.pcPercentage + " You cannot give more then that")
                return
            }
        }
        if (field == "pcShare") {
            const loggedInUser = localStorageUtils.getLoggedInUser();
            if (loggedInUser.username != "admin" && value > loggedInUser.commission.pcShare) {
                alert("Your assigned pc share is " + loggedInUser.commission.pcShare + " You cannot give more then that")
                return
            }
        }
        setFormValues(prevValues => ({
            ...prevValues,
            [category]: {
                ...prevValues[category],
                [field]: value
            }
        }));
    };
    if (!localStorageUtils.hasToken()) {
        navigate(`/login`);
    }

    const fetchAllUsersOf = async (_id) => {
        try {
            const response = await APIs.getAllUsers();
            let tempUsers = response.users.filter(user => user.role != 'admin')
            tempUsers = tempUsers.filter(user => user.creator._id == _id)
            setUsers(tempUsers);
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await APIs.updateUser(formValues)
            await fetchUserDetails()
            alert("Updated Successfully")
        } catch (e) {
            alert("Due to Error could not update")
        }
    };
    useEffect(() => {
        fetchUserDetails();
    }, [_id]);

    const fetchUserDetails = async () => {
        try {
            const response = await APIs.getUser(_id);
            fetchAllUsersOf(_id)
            setUserDetails(response.user);
            setFormValues(response.user)
        } catch (error) {
            console.error('Error fetching user details', error);
        }
    };

    const handleEditClick = () => {
        setEditMode(!editMode);
        setPaymentMode(false)
        setEditModeN(1)
    };
    const handlePaymentClick = () => {
        setPaymentMode(!paymentMode);
        setEditMode(false)
    };
    if (!userDetails) {
        return <div>Loading user details...</div>;
    }

    const handleModalOpen = () => {
        setShowModel(true);
    };

    const handleModelClose = () => {
        setShowModel(false);
    };

    const handleCreditInputChange = (e) => {
        const { name, value } = e.target;
        setCreditTransaction((prevValues) => ({
            ...prevValues,
            [name]: value,
        }));
    };

    const handleDebitInputChange = (e) => {
        const { name, value } = e.target;
        setDebitTransaction((prevValues) => ({
            ...prevValues,
            [name]: value,
        }));
    };

    const handleSubUserRowClick = (_id) => {
        // Navigate to UserDetails component with the userId as a parameter
        navigate(`/users/${_id}`);
    };


    const getCreditForm = () => {
        return (
            <Form >
                <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder=""
                        name="description"
                        value={creditTransaction.description}
                        onChange={handleCreditInputChange}
                    />
                </Form.Group>

                <Form.Group>
                    <Form.Label>Select Tx Type</Form.Label>
                    <Form.Select
                        name="txType"
                        value={creditTransaction.txType}
                        onChange={handleCreditInputChange}
                    >
                        <option value={1}>Draw</option>
                        <option value={2}>Withdraw</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                        type="Number"
                        placeholder="0"
                        name="amount"
                        value={creditTransaction.amount}
                        onChange={handleCreditInputChange}
                    />
                </Form.Group>
            </Form>
        )
    }

    const getDebitForm = () => {
        return (
            <Form >
                <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder=""
                        name="description"
                        value={debitTransaction.description}
                        onChange={handleDebitInputChange}
                    />
                </Form.Group>

                <Form.Group>
                    <Form.Label>Select Tx Type</Form.Label>
                    <Form.Select
                        name="txType"
                        value={debitTransaction.txType}
                        onChange={handleDebitInputChange}
                    >
                        <option value={1}>Draw</option>
                        <option value={2}>Withdraw</option>
                    </Form.Select>
                </Form.Group>

                {debitTransaction.txType == 2 ?
                    <Form.Group>
                        <Form.Label>Select Reduce</Form.Label>
                        <Form.Select
                            name="reduce"
                            value={debitTransaction.reduce}
                            onChange={handleDebitInputChange}
                        >
                            <option value={1}>Reduce</option>
                            <option value={2}>No Reduce</option>
                        </Form.Select>
                    </Form.Group>
                    : ''}
                <Form.Group>
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                        type="Number"
                        placeholder="0"
                        name="amount"
                        value={debitTransaction.amount}
                        onChange={handleDebitInputChange}
                    />
                </Form.Group>
            </Form>
        )
    }

    const handleCreditFormSubmit = async () => {
        let obj = { ...formValues }
        let mainUser=localStorageUtils.getLoggedInUser()
        if (creditTransaction.txType == 1) {
            let transaction = {
                amount: creditTransaction.amount,
                description: creditTransaction.description,
                debit: obj.debit,
                credit: obj.credit + Number(creditTransaction.amount),
                date: (new Date()).toISOString().split('T')[0], 
                balanceUpline: obj.balanceUpline
            }
            obj = {
                ...obj,
                credit: obj.credit + Number(creditTransaction.amount),
                balance: obj.balance + Number(creditTransaction.amount),
                transactionHistory: [...obj.transactionHistory, transaction]
            }
            mainUser.balance-=Number(creditTransaction.amount)
        } else if (creditTransaction.txType == 2) {
            let transaction = {
                amount: creditTransaction.amount,
                description: creditTransaction.description,
                debit: obj.debit,
                credit: obj.credit - Number(creditTransaction.amount),
                date: (new Date()).toISOString().split('T')[0],
                balanceUpline: obj.balanceUpline
            }
            obj = {
                ...obj,
                credit: obj.credit - Number(creditTransaction.amount),
                balance: obj.balance - Number(creditTransaction.amount),
                transactionHistory: [...obj.transactionHistory, transaction]
            }
            mainUser.balance+=Number(creditTransaction.amount)
        }
        try {
            await APIs.updateUser(obj)
            await fetchUserDetails()
            if(mainUser.role!="admin"){
                await APIs.updateUser(mainUser)            
            }
            setCreditTransaction({ ...initialCreditTransaction })
            handleModelClose()
        } catch (e) {
            alert("Due to Error could not update")
        }
    }

    const handleDebitFormSubmit = async () => {
        let obj = { ...formValues }
        let mainUser=localStorageUtils.getLoggedInUser()
        let transaction = {
            amount: debitTransaction.amount,
            description: debitTransaction.description,
            credit: obj.credit,
            date: (new Date()).toISOString().split('T')[0],
        }
        if (debitTransaction.txType == 1) {
            transaction = {
                ...transaction,
                debit: obj.debit + Number(debitTransaction.amount),
                balanceUpline: obj.balanceUpline + Number(debitTransaction.amount)
            }
            obj = {
                ...obj,
                debit: obj.debit + Number(debitTransaction.amount),
                transactionHistory: [...obj.transactionHistory, transaction],
                balanceUpline: obj.balanceUpline + Number(debitTransaction.amount)
            }
        } else if (debitTransaction.txType == 2) {
            if (debitTransaction.reduce == 1) {
                transaction = {
                    ...transaction,
                    debit: obj.debit - Number(debitTransaction.amount),
                    balanceUpline: obj.balanceUpline - Number(debitTransaction.amount),
                }
                obj = {
                    ...obj,
                    debit: obj.debit - Number(debitTransaction.amount),
                    balanceUpline: obj.balanceUpline - Number(debitTransaction.amount),
                    balance: obj.balance - Number(debitTransaction.amount),
                    transactionHistory: [...obj.transactionHistory, transaction]
                }
                mainUser.balance+=Number(debitTransaction.amount)
            } else {
                transaction = {
                    ...transaction,
                    debit: obj.debit - Number(debitTransaction.amount),
                    balanceUpline: obj.balanceUpline - Number(debitTransaction.amount)
                }
                obj = {
                    ...obj,
                    debit: obj.debit - Number(debitTransaction.amount),
                    balanceUpline: obj.balanceUpline - Number(debitTransaction.amount),
                    transactionHistory: [...obj.transactionHistory, transaction]
                }

            }
        }
        try {
            await APIs.updateUser(obj)
            await fetchUserDetails()
            if(mainUser.role!="admin"){
                await APIs.updateUser(mainUser)            
            }
            setDebitTransaction({ ...initialDebitTransaction })
            handleModelClose()
        } catch (e) {
            alert("Due to Error could not update")
        }
    }

    function getTransactionsInDateRange() {
        if (transactionStatEndDates.startDate == "" || transactionStatEndDates.endDate == "") {
            return userDetails.transactionHistory
        }
        const start = new Date(transactionStatEndDates.startDate);
        const end = new Date(transactionStatEndDates.endDate);
        const transactionsInRange = userDetails.transactionHistory.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= start && transactionDate <= end;
        });

        return transactionsInRange;
    }

    return (
        <div className='m-3'>
            <SearchDivBackgroundDiv>
                <h3 className="text-center">Clients / @{userDetails.username}</h3>
                <hr />
            </SearchDivBackgroundDiv>
            <div className='mt-1 d-flex justify-content-end'>
                <Button className='btn btn-sm primary' style={{ marginRight: '1vh' }} onClick={handleEditClick}>
                    {editMode ? 'Cancel Edit' : 'Edit'}
                </Button>
                <Button className='btn btn-sm primary' onClick={handlePaymentClick}>
                    {paymentMode ? 'Cancel Payment' : 'Payment'}
                </Button>
            </div>
            {editMode &&
                <div style={{ marginLeft: (window.innerWidth <= 600 ? '' : '6vh') }}>
                    <a className='btn btn-sm primary' onClick={() => setEditModeN(1)} >Commission</a>
                    {userDetails.role == "distributor" && userDetails.creator.role == "admin" &&
                        <a className='btn btn-sm primary' onClick={() => setEditModeN(2)}>Hadd</a>
                    }
                    <a className='btn btn-sm primary' onClick={() => setEditModeN(3)}>General Info</a>
                    <a className='btn btn-sm primary' onClick={() => setEditModeN(4)}>Reward Commision</a>
                    {userDetails.role == "distributor" && userDetails.creator.role == "admin" &&
                        <a className='btn btn-sm primary' onClick={() => setEditModeN(5)}>Purchase Limit</a>
                    }
                </div>
            }
            {paymentMode &&
                <div className='container'>
                    <Button className='btn btn-sm btn-info  m-1' onClick={() => { setPaymentModeN(1); handleModalOpen() }} >Debit</Button>
                    <Button className='btn btn-sm btn-info m-1' onClick={() => { setPaymentModeN(2); handleModalOpen() }}>Credit</Button>

                    <Modal show={showModel} onHide={handleModelClose}>
                        <Modal.Header closeButton>
                            <Modal.Title>{paymentModeN == 1 ? "Debit" : "Credit"} Manager</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {paymentModeN == 2 ?
                                getCreditForm()
                                : getDebitForm()}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleModelClose}>
                                Close
                            </Button>
                            <Button variant="primary" onClick={paymentModeN == 2 ? handleCreditFormSubmit : handleDebitFormSubmit}>
                                Submit
                            </Button>
                        </Modal.Footer>
                    </Modal>

                </div>
            }
            {paymentMode &&
                <div className='container'>
                    <div>
                        <Table striped hover size="sm" className="mt-3" style={{ fontSize: '0.8rem' }}>
                            <thead>
                                <tr>
                                    <th>DEBIT</th>
                                    <th>CREDIT</th>
                                    <th>BALANCE</th>
                                    <th>BALANCE UPLINE</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{userDetails.debit}</td>
                                    <td>{userDetails.credit}</td>
                                    <td style={{ color: (userDetails.balance > 0 ? 'green' : 'red') }} >{formatNumberWithTwoDecimals(userDetails.balance)}</td>
                                    <td style={{ color: (userDetails.balanceUpline > 0 ? 'green' : 'red') }}>{formatNumberWithTwoDecimals(userDetails.balanceUpline)}</td>
                                 
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                    {userDetails.role != "merchent" &&
                        <div style={{ marginTop: '3vh' }}>
                            <div className='text-center'>
                                {window.innerWidth <= 600 ?
                                    <h6>Draw Limit</h6>
                                    :
                                    <h4 >Draw Limit</h4>
                                }
                            </div>
                            <Table striped hover size="sm" className="mt-3" style={{ fontSize: '0.8rem' }}>
                                <thead>
                                    <tr>
                                        <th>CATEGORY</th>
                                        <th>FIRST</th>
                                        <th>SECOND</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Hindsa</td>
                                        <td>{userDetails.purchaseLimit.purchaseLimitA1}</td>
                                        <td>{userDetails.purchaseLimit.purchaseLimitA2}</td>
                                    </tr>
                                    <tr>
                                        <td>Akra</td>
                                        <td>{userDetails.purchaseLimit.purchaseLimitB1}</td>
                                        <td>{userDetails.purchaseLimit.purchaseLimitB2}</td>
                                    </tr>
                                    <tr>
                                        <td>Tandola</td>
                                        <td>{userDetails.purchaseLimit.purchaseLimitC1}</td>
                                        <td>{userDetails.purchaseLimit.purchaseLimitC2}</td>
                                    </tr>
                                    <tr>
                                        <td>PC</td>
                                        <td>{userDetails.purchaseLimit.purchaseLimitD1}</td>
                                        <td>{userDetails.purchaseLimit.purchaseLimitD2}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </div>

                    }

                    <div style={{ marginTop: '4vh' }}>
                        <div className='text-center'>
                            {window.innerWidth <= 600 ?
                                <h5>TRANSACTION HISTORY</h5>
                                :
                                <h4>TRANSACTION HISTORY</h4>
                            }
                        </div>
                        <div>
                            <Form style={{ fontSize: '0.8rem' }}>
                                <Row>
                                    <Col>
                                        <Form.Group >
                                            <Form.Label>Start Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                placeholder="Enter Start date"
                                                value={transactionStatEndDates.startDate}
                                                onChange={(e) => setTransactionStatEndDates({ ...transactionStatEndDates, startDate: e.target.value })}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group >
                                            <Form.Label>End Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                placeholder="Enter End date"
                                                value={transactionStatEndDates.endDate}
                                                onChange={(e) => setTransactionStatEndDates({ ...transactionStatEndDates, endDate: e.target.value })}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Form>
                        </div>
                        <Table striped hover size="sm" className="mt-3" style={{ fontSize: '0.8rem' }}>
                            <thead>
                                <tr>
                                    {userDetails.role != "merchent" &&
                                        <th>AMOUNT</th>
                                    }
                                    <th>DEBIT</th>
                                    <th>CREDIT</th>
                                    <th>BALANCE UPLINE</th>
                                    <th>DATE</th>
                                    <th>DESCRIPTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getTransactionsInDateRange().map(t => (
                                    <tr>
                                        {userDetails.role != "merchent" &&
                                            <td>{formatNumberWithTwoDecimals(t.amount)}</td>
                                        }
                                        <td>{formatNumberWithTwoDecimals(t.debit)}</td>
                                        <td>{formatNumberWithTwoDecimals(t.credit)}</td>
                                        <td>{formatNumberWithTwoDecimals(t.balanceUpline)}</td>
                                        <td>{formatDate(t.date)}</td>
                                        <td>{t.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                </div>
            }

            {editMode && (
                <div className="container mt-1 row justify-content-center" style={{ fontSize: '0.8rem' }}>
                    {editModeN === 1 ? (
                        <div className="m-1 card col-md-11 mb-3">
                            <div className="card-body">
                                <h5 className="card-title">Commission</h5>
                                <Form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3">
                                                <Form.Label>Commission</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.commission.commision}
                                                    onChange={(e) =>
                                                        handleFormInputChange('commission', 'commision', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3">
                                                <Form.Label>Share</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.commission.share}
                                                    onChange={(e) =>
                                                        handleFormInputChange('commission', 'share', e.target.value)
                                                    }
                                                // disabled={!formValues.commission.shareEnabled}
                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3">
                                                <Form.Label>PC Percentage</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.commission.pcPercentage}
                                                    onChange={(e) =>
                                                        handleFormInputChange('commission', 'pcPercentage', e.target.value)
                                                    }
                                                // disabled={!formValues.commission.shareEnabled}
                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3">
                                                <Form.Label>PC Share</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.commission.pcShare}
                                                    onChange={(e) =>
                                                        handleFormInputChange('commission', 'pcShare', e.target.value)
                                                    }
                                                // disabled={!formValues.commission.shareEnabled}
                                                />
                                            </Form.Group>
                                        </div>

                                        {formValues.role != "merchent" &&
                                            <div className="col-md-6">
                                                <br />
                                                <Form.Check
                                                    type="checkbox"
                                                    label="Share Enabled"
                                                    checked={formValues.commission.shareEnabled}
                                                    onChange={(e) =>
                                                        handleFormInputChange('commission', 'shareEnabled', e.target.checked)
                                                    }
                                                />
                                                <br />
                                            </div>
                                        }
                                    </div>
                                    <Button variant="primary" type="submit" size="sm">
                                        Submit
                                    </Button>
                                </Form>
                            </div>
                        </div>
                    ) : ''}

                    {editModeN === 2 ? (
                        <div className="m-1 card col-md-11 mb-3">
                            <div className="card-body">
                                <h5 className="card-title">Hadd</h5>
                                <Form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="hadd-field1">
                                                <Form.Label>Hindsy Ki Had (First)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.hadd.hindsyKiHad1}
                                                    onChange={(e) =>
                                                        handleFormInputChange('hadd', 'hindsyKiHad1', e.target.value)
                                                    }
                                                // disabled={!formValues.hadd.haddEnabled}
                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="hadd-field2">
                                                <Form.Label>Hindsy Ki Had (Second)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.hadd.hindsyKiHad2}
                                                    onChange={(e) =>
                                                        handleFormInputChange('hadd', 'hindsyKiHad2', e.target.value)
                                                    }
                                                // disabled={!formValues.hadd.haddEnabled}

                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="hadd-field3">
                                                <Form.Label>Akra Ki Had (First)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.hadd.akraKiHad1}
                                                    onChange={(e) =>
                                                        handleFormInputChange('hadd', 'akraKiHad1', e.target.value)
                                                    }
                                                // disabled={!formValues.hadd.haddEnabled}

                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="hadd-field4">
                                                <Form.Label>Akra Ki Had (Second)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.hadd.akraKiHad2}
                                                    onChange={(e) =>
                                                        handleFormInputChange('hadd', 'akraKiHad2', e.target.value)
                                                    }
                                                // disabled={!formValues.hadd.haddEnabled}

                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="hadd-field5">
                                                <Form.Label>First Tendola Ki Had</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.hadd.firstTendolaKiHad}
                                                    onChange={(e) =>
                                                        handleFormInputChange('hadd', 'firstTendolaKiHad', e.target.value)
                                                    }
                                                // disabled={!formValues.hadd.haddEnabled}

                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="hadd-field6">
                                                <Form.Label>Second Tendola Ki Had</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.hadd.secondTendolaKiHad}
                                                    onChange={(e) =>
                                                        handleFormInputChange('hadd', 'secondTendolaKiHad', e.target.value)
                                                    }
                                                // disabled={!formValues.hadd.haddEnabled}

                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="hadd-field7">
                                                <Form.Label>First Pangoda Ki Had</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.hadd.firstPangodaKiHad}
                                                    onChange={(e) =>
                                                        handleFormInputChange('hadd', 'firstPangodaKiHad', e.target.value)
                                                    }
                                                // disabled={!formValues.hadd.haddEnabled}

                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="hadd-field8">
                                                <Form.Label>Second Pangoda Ki Had</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.hadd.secondPangodaKiHad}
                                                    onChange={(e) =>
                                                        handleFormInputChange('hadd', 'secondPangodaKiHad', e.target.value)
                                                    }
                                                // disabled={!formValues.hadd.haddEnabled}

                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <br />
                                            <Form.Check
                                                type="checkbox"
                                                label="Hadd Enabled"
                                                checked={formValues.hadd.haddEnabled}
                                                onChange={(e) =>
                                                    handleFormInputChange('hadd', 'haddEnabled', e.target.checked)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <br />

                                    <Button variant="primary" type="submit" size="sm">
                                        Submit
                                    </Button>
                                </Form>
                            </div>
                        </div>
                    ) : ''}


                    {editModeN === 3 ? (
                        <div className="m-1 card col-md-11 mb-3">
                            <div className="card-body">
                                <h5 className="card-title">General Info</h5>
                                <Form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="general-info-field1">
                                                <Form.Label>Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formValues.generalInfo.name}
                                                    onChange={(e) =>
                                                        handleFormInputChange('generalInfo', 'name', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="general-info-field2">
                                                <Form.Label>Username</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formValues.username}
                                                    // onChange={(e) => { setFormValues(pre => { return { ...pre, username: e.target.value } }) }}
                                                    disabled={true}
                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="general-info-field3">
                                                <Form.Label>Address</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formValues.generalInfo.address}
                                                    onChange={(e) =>
                                                        handleFormInputChange('generalInfo', 'address', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="general-info-field4">
                                                <Form.Label>Contact Number</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formValues.generalInfo.contactNumber}
                                                    onChange={(e) =>
                                                        handleFormInputChange(
                                                            'generalInfo',
                                                            'contactNumber',
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="general-info-field7">
                                                <Form.Label>Password</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formValues.password}
                                                    onChange={(e) => { setFormValues(pre => { return { ...pre, password: e.target.value } }) }}
                                                />
                                            </Form.Group>
                                        </div>
                                        {formValues.role!="admin"&&
                                            <>
                                                <div className="col-md-6">
                                                    <Form.Group className="mb-3" controlId="general-info-field5">
                                                        <br />
                                                        <Form.Check
                                                            type="checkbox"
                                                            label="Active"
                                                            checked={formValues.generalInfo.active}
                                                            onChange={(e) =>
                                                                handleFormInputChange(
                                                                    'generalInfo',
                                                                    'active',
                                                                    e.target.checked
                                                                )
                                                            }
                                                        />
                                                        {formValues.role != "merchent" &&
                                                            <Form.Check
                                                                type="checkbox"
                                                                label="Enable Limit Sale Report View"
                                                                checked={formValues.generalInfo.enableLimitSaleReportView}
                                                                onChange={(e) =>
                                                                    handleFormInputChange(
                                                                        'generalInfo',
                                                                        'enableLimitSaleReportView',
                                                                        e.target.checked
                                                                    )
                                                                }
                                                            />

                                                        }
                                                    </Form.Group>
                                                </div>

                                            </>
                                        }
                                    </div>
                                    <Button variant="primary" type="submit" size="sm">
                                        Submit
                                    </Button>
                                </Form>
                            </div>
                        </div>
                    ) : ''}

                    {editModeN === 4 ? (
                        <div className="m-1 card col-md-11 mb-3">
                            <div className="card-body">
                                <h5 className="card-title">Reward Commission</h5>
                                <Form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="reward-commission-field1">
                                                <Form.Label>First A</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.rewardCommission.firstA}
                                                    onChange={(e) =>
                                                        handleFormInputChange('rewardCommission', 'firstA', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="reward-commission-field2">
                                                <Form.Label>First B</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.rewardCommission.firstB}
                                                    onChange={(e) =>
                                                        handleFormInputChange('rewardCommission', 'firstB', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="reward-commission-field3">
                                                <Form.Label>First C</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.rewardCommission.firstC}
                                                    onChange={(e) =>
                                                        handleFormInputChange('rewardCommission', 'firstC', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="reward-commission-field4">
                                                <Form.Label>First D</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.rewardCommission.firstD}
                                                    onChange={(e) =>
                                                        handleFormInputChange('rewardCommission', 'firstD', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <Button variant="primary" type="submit" size="sm">
                                        Submit
                                    </Button>
                                </Form>
                            </div>
                        </div>
                    ) : ''}

                    {editModeN === 5 ? (
                        <div className="m-1 card col-md-11 mb-3">
                            <div className="card-body">
                                <h5 className="card-title">Purchase Limit</h5>
                                <Form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="purchase-limit-field1">
                                                <Form.Label>Purchase Limit A (First)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.purchaseLimit.purchaseLimitA1}
                                                    onChange={(e) =>
                                                        handleFormInputChange('purchaseLimit', 'purchaseLimitA1', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="purchase-limit-field2">
                                                <Form.Label>Purchase Limit A (Second)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.purchaseLimit.purchaseLimitA2}
                                                    onChange={(e) =>
                                                        handleFormInputChange('purchaseLimit', 'purchaseLimitA2', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="purchase-limit-field3">
                                                <Form.Label>Purchase Limit B (First)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.purchaseLimit.purchaseLimitB1}
                                                    onChange={(e) =>
                                                        handleFormInputChange('purchaseLimit', 'purchaseLimitB1', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="purchase-limit-field4">
                                                <Form.Label>Purchase Limit B (Second)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.purchaseLimit.purchaseLimitB2}
                                                    onChange={(e) =>
                                                        handleFormInputChange('purchaseLimit', 'purchaseLimitB2', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="purchase-limit-field5">
                                                <Form.Label>Purchase Limit C (First)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.purchaseLimit.purchaseLimitC1}
                                                    onChange={(e) =>
                                                        handleFormInputChange('purchaseLimit', 'purchaseLimitC1', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="purchase-limit-field6">
                                                <Form.Label>Purchase Limit C (Second)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.purchaseLimit.purchaseLimitC2}
                                                    onChange={(e) =>
                                                        handleFormInputChange('purchaseLimit', 'purchaseLimitC2', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="purchase-limit-field7">
                                                <Form.Label>Purchase Limit D (First)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.purchaseLimit.purchaseLimitD1}
                                                    onChange={(e) =>
                                                        handleFormInputChange('purchaseLimit', 'purchaseLimitD1', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Group className="mb-3" controlId="purchase-limit-field8">
                                                <Form.Label>Purchase Limit D (Second)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formValues.purchaseLimit.purchaseLimitD2}
                                                    onChange={(e) =>
                                                        handleFormInputChange('purchaseLimit', 'purchaseLimitD2', e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <Button variant="primary" type="submit" size="sm">
                                        Submit
                                    </Button>
                                </Form>
                            </div>
                        </div>
                    ) : ''}
                </div>
            )}




            {!editMode && !paymentMode ?
                <div className='container'>
                    <h2>Details</h2>
                    <div className="row">
                        <div className="col-md-6">
                            <p><strong>User ID:</strong> {userDetails.userId}</p>
                            <p><strong>Name:</strong> {userDetails.generalInfo.name}</p>
                            <p><strong>Username:</strong> {userDetails.username}</p>
                            <p><strong>Password:</strong> {userDetails.password}</p>
                            <p><strong>Address:</strong> {userDetails.generalInfo.address}</p>
                            <p><strong>Role:</strong> {userDetails.role.charAt(0).toUpperCase() + userDetails.role.slice(1)}</p>
                        </div>
                        <div className="col-md-6">
                            <p><strong>Phone Number:</strong> {userDetails.generalInfo.contactNumber}</p>
                            <p><strong>Debit:</strong> {userDetails.debit}</p>
                            <p><strong>Credit:</strong> {userDetails.credit}</p>
                            <p><strong>Balance:</strong> {userDetails.balance}</p>
                            <p><strong>Active:</strong> {userDetails.generalInfo.active ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    {(localStorageUtils.getLoggedInUser().role == 'admin' || localStorageUtils.getLoggedInUser().role == 'distributor') && (userDetails.role != "merchent") &&
                        <div className='mt-2'>
                            <h4>Sub Distributors and Merchents </h4>
                            <Table striped hover size="sm" className="mt-1" style={{ fontSize: '0.8rem' }}>
                                <thead>
                                    <tr>
                                        <th>User ID</th>
                                        <th>Username</th>
                                        <th>Password</th>
                                        <th>Role</th>
                                        <th>Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user._id} style={{ cursor: 'pointer' }} onClick={() => handleSubUserRowClick(user._id)} >
                                            <td>{user.userId}</td>
                                            <td>{user.username}</td>
                                            <td>{user.password}</td>
                                            <td>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                                            <td>{user.generalInfo.active ? "Yes" : "No"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                        </div>
                    }

                </div>
                : ''}

        </div>
    );
};

export default UserDetails;
