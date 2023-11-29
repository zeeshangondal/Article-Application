import './App.css';
import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import Login from './pages/Login';
import Navbar from './components/Navbar';
import { localStorageUtils } from './APIs/localStorageUtils';


function App() {


    return (
        <div>
            <Router>
                {localStorageUtils.hasToken() && <Navbar />}
                <Routes>
                    <Route exact path="/login" element={<Login />} />
                </Routes>
            </Router>
        </div>
    )
}

export default App;
