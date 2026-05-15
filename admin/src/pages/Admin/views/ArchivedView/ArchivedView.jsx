import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import '../../../../styles/global.css';
import ListLoading from '../../../../components/ListLoading.jsx';
import MessageCard from '../../../../components/MessageCard.jsx';
import { API, useAuth } from '../../../../api.js';
import { toggleMessage, deleteMessage, openEditForm } from '../../../../components/MessageCardFunctions.js';


export default function ArchivedView() {
    const [editingMessage, setEditingMessage] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getAuthHeader } = useAuth();

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
        try {
            const res = await fetch(`${API}/messages?filter=archived`, { 
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
        <main class="view">
            <div class="view-header">
                <div>
                    <h2 class="view-title">Archiwum</h2>
                    <p class="view-sub">Wyłączone i wygasłe komunikaty</p>
                </div>
            </div>

            <div className="message-list">
                {loading && <ListLoading label="Ładowanie komunikatów..." />}
                {!loading && error && <div className="error-msg">Błąd: {error}</div>}

                {!loading && !error && messages.length === 0 && (
                    <div className="empty-state">
                        <i class="fa-regular fa-message fa-3x"></i>
                        <p>Brak zarchiwizowanych komunikatów</p>
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