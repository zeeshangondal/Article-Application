import './App.css';
import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import Login from './pages/Login';
import Navbar from './components/Navbar';
import { localStorageUtils } from './APIs/localStorageUtils';
import Clients from './pages/Clients';
import DrawTime from './pages/DrawTime';


function App() {



    return (
        <div>
            <Router>
                {localStorageUtils.hasToken() && <Navbar />}
                <Routes>
                    <Route exact path="/login" element={<Login />} />
                    <Route exact path="/" element={<Clients />} />
                    <Route exact path="/draw" element={<DrawTime />} />
                    
                </Routes>
            </Router>
        </div>
    )
}

export default App;
