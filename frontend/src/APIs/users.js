import axios from 'axios';
import { localStorageUtils } from './localStorageUtils';

const API_URL = 'http://localhost:3005/user';
// const API_URL = 'https://pzprize.com/user';

// Create User Service
const createUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/`, userData);
        if (response.status == 200) {
            alert(response.data.message);
            return false
        }
        return true
    } catch (error) {
        alert("Error creating user");
        return false;
    }
};

const login = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/login`, data);
        // If login is successful and a JWT token is returned by the backend.
        if (response.status === 200 && response.data && response.data.token) {

            // Save token to local storage using utility function
            localStorageUtils.setToken(response.data.token);

            if (response.data.user) {
                localStorageUtils.setLoggedInUser(JSON.stringify(response.data.user));
            }

            // Set up Axios to use the token for subsequent API requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${localStorageUtils.getToken()}`;

            return true;
        } else if (response.status === 201) {
            // Account deactivated, return false and a message
            return { con: false, msg: "This account has been deactivated" };
        } else {
            return { con: false, msg: "Unexpected error occurred" };
        }
    } catch (error) {
        return { con: false, msg: "Invalid username or password" };
    }
};


// Get Single User Service
const getUser = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        console.log("User Created", response.data)
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}

// Get All Users Service
const getAllUsers = async () => {
    try {
        const response = await axios.get(`${API_URL}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}

// Update User Service
const updateUser = async (data) => {
    try {
        const response = await axios.patch(`${API_URL}/${data._id}`, data);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}


const deleteUser = async (id, token) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}

// Delete User Service
// const deleteUser = async (id, token) => {
//     try {
//         const response = await axios.delete(`${API_URL}/users/${id}`, {
//             headers: {
//                 'Authorization': `Bearer ${token}`
//             }
//         });
//         return response.data;
//     } catch (error) {
//         throw error.response.data;
//     }
// }

const users = { login, getUser, getAllUsers, updateUser, deleteUser, createUser }
export default users;
