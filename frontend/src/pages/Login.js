import React, { useEffect, useState } from 'react';
import APIs from '../APIs/users';
import { useNavigate } from 'react-router-dom';
import { localStorageUtils } from '../APIs/localStorageUtils';

export default function Login() {
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorageUtils.hasToken()) {
            navigate('/');
        }
    });

    const initialFormData = {
        username: '',
        password: '',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleReset = () => {
        setFormData(initialFormData);
        setErrorMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loginSuccess = await APIs.login(formData);
        if (!loginSuccess) {
            setErrorMessage('Invalid username or password. Please try again.');
        } else {
            setErrorMessage('');
            window.location = '/';
        }
    };

    return (
        <div className="container-fluid d-flex justify-content-center">
            <div className="card col-10 col-sm-8 col-md-6 col-lg-4" style={{ borderRadius: '5%', marginTop: '10vh', marginBottom: '5vh' }}>
                <div className="card-body">
                    <h2 className="card-title text-center">Log In</h2>
                    <hr />
                    {errorMessage && <div className="text-center text-danger mb-3">{errorMessage}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group p-3">
                            <label>Username</label>
                            <input type="username" className="form-control mt-3" name="username" value={formData.username} onChange={handleChange} required />
                        </div>
                        <div className="form-group p-3">
                            <label>Password</label>
                            <input type="password" className="form-control mt-3" name="password" value={formData.password} onChange={handleChange} required />
                        </div>
                        <div className="d-flex justify-content-end" style={{ marginTop: '5vh' }}>
                            <button type="button" className="btn btn-secondary m-1" onClick={handleReset}>
                                Reset
                            </button>
                            <button type="submit" className="btn btn-primary m-1">
                                Log In
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
