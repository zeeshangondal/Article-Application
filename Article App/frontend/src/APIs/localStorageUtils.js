// localStorageUtils.js

export const localStorageUtils = {
    setToken: (token) => {
        localStorage.setItem('jwt_token', token);
    },

    getToken: () => {
        return localStorage.getItem('jwt_token');
    },

    removeToken: () => {
        localStorage.removeItem('jwt_token');
    },

    hasToken: () => {
        return !!localStorage.getItem('jwt_token');
    },

    setLoggedInUser : (user) => {
        localStorage.setItem('loggedInUser', user);
    },
    
    getLoggedInUser : () => {
        return JSON.parse(localStorage.getItem('loggedInUser'));
    },
    
    removeLoggedInUser : () => {
        localStorage.removeItem('loggedInUser');
    }
}


