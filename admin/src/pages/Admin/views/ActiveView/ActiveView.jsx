import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import ListLoading from '../../../../components/ListLoading';
import MessageCard from '../../../../components/MessageCard';
import '../../../../styles/global.css';
import { API, useAuth } from '../../../../api.js';
import { toggleMessage, deleteMessage, openEditForm } from '../../../../components/MessageCardFunctions.js';

export default function ActiveView() {
    const [editingMessage, setEditingMessage] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getAuthHeader } = useAuth();

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
        try {
            const res = await fetch(`${API}/messages?filter=active`, { 
                headers: getAuthHeader() 
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Błąd serwera');
            }

            const list = await res.json();
            setMessages(list);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    fetchMessages();
    }, []);

    return (
        <main className="view">
            <div className="view-header">
                <div>
                    <h2 className="view-title">Aktywne komunikaty</h2>
                    <p className="view-sub">Lista komunikatów aktualnie prezentowanych klientom</p>
                </div>

                <button className="new-msg-shortcut btn btn-primary" onClick={() => route('/informator/nowy-komunikat')}>
                    <i className="fa-solid fa-plus"></i>
                    <span>Nowy komunikat</span>
                </button>
            </div>

            <div className="message-list">
                {loading && <ListLoading label="Ładowanie komunikatów..." />}
                {!loading && error && <div className="error-msg">Błąd: {error}</div>}

                {!loading && !error && messages.length === 0 && (
                    <div className="empty-state">
                        <i className="fa-regular fa-message fa-3x"></i>
                        <p>Brak aktywnych komunikatów</p>
                    </div>
                )}

                {!loading && !error && messages.map(msg => (
                    <MessageCard key={msg.id} image_url={msg.image_url} headline={msg.headline} display_frequency={msg.display_frequency} display_time={msg.display_time} expires={msg.expires_at} is_active={msg.is_active} id={msg.id}  
                    onToggle={(id) =>
                        toggleMessage(id, getAuthHeader, setMessages)
                    }
                    onEdit={(id) =>
                        openEditForm(id, getAuthHeader)
                    }
                    onDelete={(id) =>
                        deleteMessage(id, getAuthHeader, setMessages)
                    }/>
                ))}
            </div>
        </main>
    );
}
