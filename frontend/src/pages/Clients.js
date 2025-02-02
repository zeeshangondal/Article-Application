import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Table } from 'react-bootstrap';
import APIs from '../APIs/users';
import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';
import { Link, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import { localStorageUtils } from '../APIs/localStorageUtils';
import { formatNumberWithTwoDecimals } from '../Utils/Utils';

const initialUserData = {
    name: '',
    username: '',
    password: '',
    address: '',
    contactNumber: '',
    active: false,
    role: ''
}

export default function Clients() {
    const [users, setUsers] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUserData, setNewUserData] = useState(initialUserData);
    const [searchInput, setSearchInput] = useState('');
    const [merchentDistributorMode, setMerchentDistributorMode] = useState(1);
    const [currentLoggedInUser, setCurrentLoggedInUser] = useState({ generalInfo: { name: '' }, username: '' })

    const getTheMainCreatorOfUser = (_id) => {
        try {
            if(users.length==0){
                return false
            }
            let allUsers = users; // Assuming 'users' is the array containing user objects
    
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
    const navigate = useNavigate();
    if (!localStorageUtils.hasToken()) {
        window.location="/login"
    }else{
        if(!(localStorageUtils.getLoggedInUser().generalInfo.active) || !(parentCreator.generalInfo.active)){
            localStorage.removeItem("jwt_token");
            localStorageUtils.removeLoggedInUser();
            window.location = "/login";
        }
    }
    useEffect(() => {
        if (!localStorageUtils.hasToken()) {
            // navigate(`/login`);
        } else {
            if (localStorageUtils.getLoggedInUser().role === "merchent") {
                window.location="/merchent"

            }
        }
    })
    useEffect(() => {
        // Fetch users when the component mounts
        fetchAllUsersOf(localStorageUtils.getLoggedInUser()._id)
        fetchLoggedInUser()
    }, []);

    const fetchAllUsers = async () => {
        try {
            const response = await APIs.getAllUsers();
            setUsers(response.users);
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };
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
    const fetchLoggedInUser = async () => {
        try {
            const response = await APIs.getAllUsers();
            let tempUser = response.users.find(user => user._id == localStorageUtils.getLoggedInUser()._id)
            setCurrentLoggedInUser(tempUser);
            localStorageUtils.setLoggedInUser(JSON.stringify(tempUser));
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };
    const handleCreateModalOpen = () => {
        setShowCreateModal(true);
    };

    const handleCreateModalClose = () => {
        setShowCreateModal(false);
    };

    const handleCreateUser = async () => {
        try {
            // Check if any required field is empty
            if (
                !newUserData.name ||
                !newUserData.username ||
                !newUserData.password ||
                !newUserData.address ||
                !newUserData.contactNumber
            ) {
                alert("Please fill in all the required fields");
                return;
            }
            let obj = {
                ...newUserData,
                creator: localStorageUtils.getLoggedInUser()._id,
                // rewardCommission: localStorageUtils.getLoggedInUser().rewardCommission
            }
            let role = ""
            let loggedInUser = localStorageUtils.getLoggedInUser()
            if (loggedInUser.role == "admin")
                role = "distributor"
            else if (loggedInUser.role == "distributor")
                if (merchentDistributorMode == 1)
                    role = "merchent"
                else if (merchentDistributorMode == 2)
                    role = "distributor"
            obj = {
                ...obj,
                role
            }
            // Call the API to create a new user
            let res = await APIs.createUser(obj);
            if (res) {
                setNewUserData(initialUserData);
                handleCreateModalClose();
                alert("New Client Successfully created");
                fetchAllUsersOf(localStorageUtils.getLoggedInUser()._id)
            }
            // Close the modal
        } catch (error) {
            console.error("Error creating user", error);
        }
    };

    // Filter users based on search input
    const handleRowClick = (_id) => {
        // Navigate to UserDetails component with the userId as a parameter
        navigate(`/users/${_id}`);
    };

    const getMyUsers = () => {
        let myUsers = users
        let loggedInUser = localStorageUtils.getLoggedInUser()
        if (loggedInUser.role == "distributor") {
            if (merchentDistributorMode == 1) {
                myUsers = users.filter(user => user.role == "merchent")
            } else if (merchentDistributorMode == 2) {
                myUsers = users.filter(user => user.role == "distributor")
            }
        }
        return myUsers
    }
    let myUsers = getMyUsers()


    const filteredUsers = myUsers.filter(user => {
        return (
            user.userId.toString().includes(searchInput) ||
            user.username.toLowerCase().includes(searchInput.toLowerCase())
        );
    });


    const getMerchentsBalance = () => {
        const val = users.reduce((accumulator, currentUser) => {
            return accumulator + (currentUser.role == "merchent" ? currentUser.balance : 0);
        }, 0);
        return val
    }
    const getDistributorsBalance = () => {
        const val = users.reduce((accumulator, currentUser) => {
            return accumulator + (currentUser.role == "distributor" ? currentUser.balance : 0);
        }, 0);
        return val
    }
    const getAvailableBalance = () => {
        let merchentBalance = getMerchentsBalance()
        let distributorBalance = getDistributorsBalance()
        return currentLoggedInUser.balance - (merchentBalance + distributorBalance)
    }
    return (
        <div className='m-3'>
            <SearchDivBackgroundDiv>
                {window.innerWidth <= 600 ?
                    <h6 className="text-center">{`${currentLoggedInUser.generalInfo.name} - ${currentLoggedInUser.username}`}</h6>
                    :
                    <h3 className="text-center">{`${currentLoggedInUser.generalInfo.name} - ${currentLoggedInUser.username}`}</h3>
                }
                <hr />
                {localStorageUtils.getLoggedInUser().role != "admin" &&
                    <div>
                        {window.innerWidth <= 600 ?
                            <div className='d-flex mb-2 justify-content-between' style={{fontSize:'0.6rem'}}>
                                <p>CASH: {formatNumberWithTwoDecimals(currentLoggedInUser.debit)}</p>
                                <p>CREDIT: {formatNumberWithTwoDecimals(currentLoggedInUser.credit)}</p>
                                <p style={{ color: (currentLoggedInUser.balance > 0 ? 'lightgreen' : 'red') }}>BALANCE: {formatNumberWithTwoDecimals(currentLoggedInUser.balance)}</p>
                                <p style={{ color: (currentLoggedInUser.balanceUpline > 0 ? 'lightgreen' : 'red') }}>UPLINE: {formatNumberWithTwoDecimals(currentLoggedInUser.balanceUpline)}</p>
                            </div>
                            :
                            <div className='d-flex mb-2 justify-content-between'>                                
                                <p>CASH: {formatNumberWithTwoDecimals(currentLoggedInUser.debit)}</p>
                                <p>CREDIT: {formatNumberWithTwoDecimals(currentLoggedInUser.credit)}</p>
                                <p style={{ color: (currentLoggedInUser.balance > 0 ? 'lightgreen' : 'red') }}>BALANCE: {formatNumberWithTwoDecimals(currentLoggedInUser.balance)}</p>
                                <p style={{ color: (currentLoggedInUser.balanceUpline > 0 ? 'lightgreen' : 'red') }}>UPLINE: {formatNumberWithTwoDecimals(currentLoggedInUser.balanceUpline)}</p>
                            </div>
                        }
                    </div>
                }
                <div className='d-flex justify-content-between'>
                    <Form.Control
                        type="text"
                        placeholder={"Search"}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={{ width: '70%', marginRight: '3px' }}
                    />
                </div>
            </SearchDivBackgroundDiv>
            {localStorageUtils.getLoggedInUser().role == "admin" &&
                <div className='d-flex justify-content-between mt-3'>
                    <div>
                        <h4>Clients</h4>
                    </div>
                    <div className='d-flex justify-content-end'>
                        <Button variant="primary btn btn-sm" onClick={handleCreateModalOpen} >
                            Create Client
                        </Button>
                    </div>

                </div>
            }
            {localStorageUtils.getLoggedInUser().role == "distributor" &&
                <div>
                    <div className='d-flex justify-content-end'>
                        <Button variant={`${merchentDistributorMode == 1 ? "" : "outline-"}primary btn btn-sm`} style={{ marginRight: '1vh' }} onClick={() => setMerchentDistributorMode(1)} className="mt-3">
                            Users
                        </Button>
                        <Button variant={`${merchentDistributorMode == 2 ? "" : "outline-"}primary btn btn-sm`} onClick={() => setMerchentDistributorMode(2)} className="mt-3">
                            Distributors
                        </Button>
                    </div>
                    <div className='mt-2'>
                        <div className='d-flex justify-content-between'>
                            <div>
                                <h4>{merchentDistributorMode == 1 ? "Users" : "Distributors"}</h4>
                            </div>
                            <div className='d-flex justify-content-end '>
                                {merchentDistributorMode == 1 ?
                                    <Button variant="primary btn btn-sm" onClick={handleCreateModalOpen}>
                                        New User
                                    </Button>
                                    :
                                    <Button variant="primary btn btn-sm" onClick={handleCreateModalOpen}>
                                        Create Distributor
                                    </Button>
                                }
                            </div>

                        </div>
                    </div>
                </div>
            }
            <Table striped hover size="sm" className="mt-1" style={{ fontSize: '0.8rem' }}>
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Username</th>
                        <th>Upline</th>
                        <th>Active</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(user => (
                        <tr key={user._id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(user._id)}>
                            <td>{user.userId}</td>
                            <td>{user.username}</td>
                            <td style={{ color: (user.balanceUpline > 0 ? 'green' : 'red') }}>{user.balanceUpline}</td>
                            <td>{user.generalInfo.active ? "Yes" : "No"}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showCreateModal} onHide={handleCreateModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {localStorageUtils.getLoggedInUser().role === "admin" ?
                            "Create Client"
                            :
                            localStorageUtils.getLoggedInUser().role === "distributor" ?
                                merchentDistributorMode == 1 ? "New User" : "Create Distributor"
                                :
                                ""//merchent code
                        }
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter name"
                                value={newUserData.name}
                                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className='mt-2' controlId="formUsername">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter username"
                                value={newUserData.username}
                                onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className='mt-2' controlId="formPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter password"
                                value={newUserData.password}
                                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className='mt-2' controlId="formAddress">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter address"
                                value={newUserData.address}
                                onChange={(e) => setNewUserData({ ...newUserData, address: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className='mt-2' controlId="formContactNumber">
                            <Form.Label>Contact Number</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter contact number"
                                value={newUserData.contactNumber}
                                onChange={(e) => setNewUserData({ ...newUserData, contactNumber: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className='mt-2' controlId="formActive">
                            <Form.Check
                                type="checkbox"
                                label="Active"
                                checked={newUserData.active}
                                onChange={(e) => setNewUserData({ ...newUserData, active: e.target.checked })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCreateModalClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleCreateUser}>
                        Create
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
