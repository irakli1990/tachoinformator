import { useState, useContext } from 'preact/hooks';
import { route } from 'preact-router';
import { API } from '../../api.js';
import { UserContext } from "../../context/UserContext.jsx";

import logoNormal from '../../assets/logo-normal.png';

import '../../styles/global.css';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { setCurrentUser } = useContext(UserContext);

    async function submitLoginForm(e) {
            e.preventDefault();

            setLoading(true);
            setError('');

            try {
                const result = await fetch(`${API}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await result.json();

                if (result.ok) {
                    setCurrentUser(data.user);
                } else {
                    setError(data.error);
                }
            } 
            catch {
                setError('Błąd połączenia z serwerem');
            } 
            finally {
                setLoading(false);
            }
        }

    return (
        <div className="login-screen screen">
            <div className="login-wrapper">
                <div className="login-card">
                    <div className="login-logo">
                        <img className="logo" src={logoNormal} alt="logo" />
                    </div>

                    <h1 className="login-title">Panel Administracyjny</h1>
                    <p className="login-sub">Zaloguj się używając firmowego adresu @infolab.pl</p>

                    <form className="login-form" noValidate onSubmit={submitLoginForm}>
                        <div className="field-group">
                            <label htmlFor="email-input" className="field-label">Adres e-mail</label>
                            <input type="email" id="email-input" className="field-input" placeholder="imie.nazwisko@company.com" autoComplete="email" required value={email} onChange={(e) => {setEmail(e.target.value)}} />
                        </div>

                        {error && (<div className="error-msg">{error}</div>)}

                        <button type="submit" id="login-btn" className="btn btn-primary btn-full">
                            <span className="btn-text">{}Zaloguj się</span>
                            {loading && <span className="btn-spinner"></span>}
                        </button>
                    </form>

                    <p className="login-note">Dostęp dla pracowników Infolab — adres@infolab.pl</p>
                </div>
            </div>
        </div>
    );
}