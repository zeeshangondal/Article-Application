
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import APIs from '../APIs/users';
import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';
import { Button } from 'react-bootstrap';

const UserDetails = () => {
    const { _id } = useParams();
    const [userDetails, setUserDetails] = useState(null);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await APIs.getUser(_id);
                setUserDetails(response.user);
            } catch (error) {
                console.error('Error fetching user details', error);
            }
        };

        fetchUserDetails();
    }, [_id]);

    const handleEditClick = () => {
        setEditMode(!editMode);
    };

    if (!userDetails) {
        return <div>Loading user details...</div>;
    }

    console.log(userDetails);

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
                <Button className='btn btn-sm primary'>Payment | Demand</Button>
            </div>

            {editMode && (
                <div className="container mt-1 row">
                    <div className="m-1 card col-md-3 mb-3">
                        <div className="card-body">
                            <h5 className="card-title">Commission</h5>
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="commission-field1" className="form-label">Field 1</label>
                                    <input type="text" className="form-control" id="commission-field1" />
                                </div>
                                <button type="submit" className="btn btn-primary">Submit</button>
                            </form>
                        </div>
                    </div>

                    <div className="m-1 card col-md-3 mb-3">
                        <div className="card-body">
                            <h5 className="card-title">Hadd</h5>
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="hadd-field1" className="form-label">Field 1</label>
                                    <input type="text" className="form-control" id="hadd-field1" />
                                </div>
                                <button type="submit" className="btn btn-primary">Submit</button>
                            </form>
                        </div>
                    </div>

                    <div className="m-1 card col-md-3 mb-3">
                        <div className="card-body">
                            <h5 className="card-title">General Info</h5>
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="general-info-field1" className="form-label">Field 1</label>
                                    <input type="text" className="form-control" id="general-info-field1" />
                                </div>
                                <button type="submit" className="btn btn-primary">Submit</button>
                            </form>
                        </div>
                    </div>

                    <div className="m-1 card col-md-3 mb-3">
                        <div className="card-body">
                            <h5 className="card-title">Reward Commission</h5>
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="reward-commission-field1" className="form-label">Field 1</label>
                                    <input type="text" className="form-control" id="reward-commission-field1" />
                                </div>
                                <button type="submit" className="btn btn-primary">Submit</button>
                            </form>
                        </div>
                    </div>

                    <div className="m-1 card col-md-3 mb-3">
                        <div className="card-body">
                            <h5 className="card-title">Purchase Limit</h5>
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="purchase-limit-field1" className="form-label">Field 1</label>
                                    <input type="text" className="form-control" id="purchase-limit-field1" />
                                </div>
                                <button type="submit" className="btn btn-primary">Submit</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {!editMode ?
                <div>
                    <h2>Details</h2>
                    <div className="row">
                        <div className="col-md-6">
                            <p><strong>User ID:</strong> {userDetails.userId}</p>
                            <p><strong>Name:</strong> {userDetails.name}</p>
                            <p><strong>Username:</strong> {userDetails.username}</p>
                            <p><strong>Password:</strong> {userDetails.password}</p>
                            <p><strong>Address:</strong> {userDetails.address}</p>
                            <p><strong>Active:</strong> {userDetails.active ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="col-md-6">
                            <p><strong>Email:</strong> {userDetails.email}</p>
                            <p><strong>Phone Number:</strong> {userDetails.contactNumber}</p>
                            <p><strong>Debit:</strong> {userDetails.debit}</p>
                            <p><strong>Credit:</strong> {userDetails.credit}</p>
                            <p><strong>Balance:</strong> {userDetails.balance}</p>
                        </div>
                    </div>
                </div>
                : ''}

        </div>
    );
};

export default UserDetails;
