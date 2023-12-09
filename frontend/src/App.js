import './App.css';
import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import Login from './pages/Login';
import Navbar from './components/Navbar';
import { localStorageUtils } from './APIs/localStorageUtils';
import Clients from './pages/Clients';
import Client from './pages/Client';
import DrawTime from './pages/DrawTime';


function App() {
    const [refresh,setRefresh]= useState(false)
    const handleRefresh=()=>{
        setRefresh(true)
    }
    return (
        <div>
            <Router>
                {localStorageUtils.hasToken() && <Navbar />}
                <Routes>
                    <Route exact path="/login" element={<Login refresh={handleRefresh} />} />
                    <Route exact path="/" element={<Clients refresh={handleRefresh}/>} />
                    <Route exact path="/draw" element={<DrawTime refresh={handleRefresh}/>} />
                    <Route path="/users/:_id" element={<Client refresh={handleRefresh}/>} />
                </Routes>
            </Router>
        </div>
    )
}

export default App;
