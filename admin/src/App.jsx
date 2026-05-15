import { useState, useEffect } from 'preact/hooks';
import { UserContext } from "./context/UserContext.jsx";

import Login from './pages/Login/Login.jsx';
import Admin from './pages/Admin/Admin.jsx';

function restoreUser() {
    try { return JSON.parse(localStorage.getItem('user')); } 
    catch { return null; } 
}

export default function App() {
    const [currentUser, setCurrentUser] = useState(restoreUser());
    const [selectedFile, setSelectedFile] = useState(null);

    const clearUploadPreview = () => setSelectedFile(null);
    
    useEffect(() => {
        if (currentUser) localStorage.setItem('user', JSON.stringify(currentUser));
        else localStorage.removeItem('user');
    }, [currentUser]);

    return (
        <UserContext.Provider value={{ currentUser, setCurrentUser }}>
            { !currentUser ? <Login /> : <Admin /> }
        </UserContext.Provider>
    );
}