import axios from 'axios';
import { localStorageUtils } from './localStorageUtils';

const API_URL = 'http://localhost:3005/draw';
// const API_URL = 'https://pzprize-022cf955959c.herokuapp.com/draw';

// Create Draw Service
const createDraw = async (drawData) => {
    try {
        const response = await axios.post(`${API_URL}/`, drawData);
        return true;
    } catch (error) {
        alert("Error creating draw");
        return false;
    }
};

// Get Single Draw Service
const getDraw = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        console.log("Draw Created", response.data);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}

// Get All Draws Service
const getAllDraws = async () => {
    try {
        const response = await axios.get(`${API_URL}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}

// Update Draw Service
const updateDraw = async (data) => {
    try {
        const response = await axios.patch(`${API_URL}/${data._id}`, data);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}

// Delete Draw Service
const deleteDraw = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}

const draws = { createDraw, getDraw, getAllDraws, updateDraw, deleteDraw }
export default draws;
