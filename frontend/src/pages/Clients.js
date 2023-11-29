import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Table } from 'react-bootstrap';
import APIs from '../APIs/users';
import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';

const initialUserData = {
    name: '',
    username: '',
    password: '',
    address: '',
    contactNumber: '',
    active: false,
    role: 'distributor'
}

export default function Clients() {
    const [users, setUsers] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUserData, setNewUserData] = useState(initialUserData);
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        // Fetch users when the component mounts
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await APIs.getAllUsers();
            setUsers(response.users);
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

            // Call the API to create a new user
            let res = await APIs.createUser(newUserData);
            if (res) {
                setNewUserData(initialUserData);
                handleCreateModalClose();
                alert("New Client Successfully created");
                fetchUsers();
            }
            // Close the modal
        } catch (error) {
            console.error("Error creating user", error);
        }
    };

    // Filter users based on search input
    const filteredUsers = users.filter(user => {
        return (
            user.userId.toString().includes(searchInput) ||
            user.username.toLowerCase().includes(searchInput.toLowerCase())
        );
    });

    return (
        <div className='container mt-2'>
            <SearchDivBackgroundDiv>
                <h2 className="text-center">Clients</h2>
                <hr />
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
            <div className='d-flex justify-content-end'>
                <Button variant="primary btn btn-sm" onClick={handleCreateModalOpen} className="mt-3">
                    Create Client
                </Button>
            </div>
            <Table striped hover size="sm" className="mt-3" style={{ fontSize: '0.8rem' }}>
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Username</th>
                        <th>Password</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(user => (
                        <tr key={user._id}>
                            <td>{user.userId}</td>
                            <td>{user.username}</td>
                            <td>{user.password}</td>
                            <td>
                                <Button variant="primary btn btn-sm" >View</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showCreateModal} onHide={handleCreateModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Create Client</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Form for capturing user details */}
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
                        <Form.Group controlId="formUsername">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter username"
                                value={newUserData.username}
                                onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter password"
                                value={newUserData.password}
                                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formAddress">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter address"
                                value={newUserData.address}
                                onChange={(e) => setNewUserData({ ...newUserData, address: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formContactNumber">
                            <Form.Label>Contact Number</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter contact number"
                                value={newUserData.contactNumber}
                                onChange={(e) => setNewUserData({ ...newUserData, contactNumber: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formActive">
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
                        Create User
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
