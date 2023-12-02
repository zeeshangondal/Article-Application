import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import APIs from '../APIs/users';

const UserDetails = () => {
  const { _id } = useParams();
  const [userDetails, setUserDetails] = useState(null);

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

  if (!userDetails) {
    return <div>Loading user details...</div>;
  }

  return (
    <div>
      <h2>User Details</h2>
      <p>User ID: {userDetails.userId}</p>
      <p>Username: {userDetails.username}</p>
      <p>Password: {userDetails.password}</p>
      {/* Add more details as needed */}
    </div>
  );
};

export default UserDetails;
