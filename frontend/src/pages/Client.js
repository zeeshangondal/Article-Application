
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import APIs from '../APIs/users';
import SearchDivBackgroundDiv from '../components/SearchDivBackgroundDiv';
import { Button, Form } from 'react-bootstrap';

const UserDetails = () => {
    const { _id } = useParams();
    const [userDetails, setUserDetails] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editModeN, setEditModeN] = useState(0);
    const [formValues, setFormValues] = useState({
        commission: { commision: 0, share: 0, pcPercentage: 0 },
        hadd: { hindsyKiHad1: 0, hindsyKiHad2: 0, akraKiHad1: 0, akraKiHad2: 0, firstTendolaKiHad: 0, secondTendolaKiHad: 0, firstPangodaKiHad: 0, secondPangodaKiHad: 0 },
        generalInfo: { name: '', username: '', address: '', contactNumber: '', active: false },
        rewardCommission: { firstA: 0, firstB: 0, firstC: 0, firstD: 0 },
        purchaseLimit: {
            purchaseLimitA1: 0, purchaseLimitA2: 0,
            purchaseLimitB1: 0, purchaseLimitB2: 0,
            purchaseLimitC1: 0, purchaseLimitC2: 0,
            purchaseLimitD1: 0, purchaseLimitD2: 0
        }
    });

    const handleFormInputChange = (category, field, value) => {
        setFormValues(prevValues => ({
            ...prevValues,
            [category]: {
                ...prevValues[category],
                [field]: value
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission here, you can send the formValues to the server
        // and perform any necessary actions.
        console.log(formValues)
        console.log("Form Submitted:", formValues);
    };

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
            {editMode &&
                <div>
                    <a className='btn btn-sm primary' onClick={() => setEditModeN(1)} >Commission</a>
                    <a className='btn btn-sm primary' onClick={() => setEditModeN(2)}>Hadd</a>
                    <a className='btn btn-sm primary' onClick={() => setEditModeN(3)}>General Info</a>
                    <a className='btn btn-sm primary' onClick={() => setEditModeN(4)}>Reward Commision</a>
                    <a className='btn btn-sm primary' onClick={() => setEditModeN(5)}>Purchase Limit</a>
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
                                                    value={formValues.generalInfo.username}
                                                    onChange={(e) =>
                                                        handleFormInputChange('generalInfo', 'username', e.target.value)
                                                    }
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
                                            <Form.Group className="mb-3" controlId="general-info-field5">
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
