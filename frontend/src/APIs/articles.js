import axios from 'axios';

const API_URL = 'http://localhost:3005/article';

// Create Digit Service
const createDigit = async (digitData) => {
    try {
        const response = await axios.post(`${API_URL}/`, digitData);
        if (response.status === 201) {
            alert(response.data.message);
            return false;
        }
        return true;
    } catch (error) {
        alert("Error creating digit");
        return false;
    }
};

// Get Single Digit Service
const getDigit = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

const getFirstAndSecond = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/filtered`,data);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Get All Digits Service
const getAllDigits = async () => {
    try {
        const response = await axios.get(`${API_URL}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Update Digit Service
const updateDigit = async (data) => {
    try {
        const response = await axios.patch(`${API_URL}/${data._id}`, data);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Delete Digit Service
const deleteDigit = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

const articles = { createDigit, getDigit, getAllDigits, updateDigit, deleteDigit ,getFirstAndSecond};
export default  articles;