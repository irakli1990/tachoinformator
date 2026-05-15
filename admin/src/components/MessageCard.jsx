import { useState } from 'preact/hooks';
import "./MessageCard.css";

const freqMap = {
  '1x_daily': '1× dziennie',
  '2x_daily': '2× dziennie',
  '3x_daily': '3× dziennie'
};

export default function MessageCard({ image_url, headline, display_frequency, display_time, expires, is_active, id, onToggle, onEdit, onDelete }) {
    const expired = expires ? Date.parse(expires) < Date.now() : false;
    return (
        <div className="msg-card" data-id={id}>
            <div className="msg-thumb">
                {!image_url ? <div className="msg-thumb-placeholder">
                    <i className="fa-solid fa-file-circle-xmark"></i>
                </div> : <img src={`http://localhost:3000${image_url}`} alt="messageImage" />}
            </div>
            <div className="msg-body">
                <div className="msg-headline">
                    {headline}
                </div>
                <div className="msg-meta">
                    <span className={`msg-badge ${!expired ? is_active ? 'badge-active' : 'badge-inactive' : "badge-expired"}`}>{!expired ? is_active ? 'Aktywny' : 'Wyłączony' : "Wygasły"}</span>
                    <span className="msg-info">
                        {freqMap[display_frequency] || display_frequency} · {display_time}
                    </span>
                    <span className="msg-info">{!expired ? `Wygasa: ${expires}` : `Wygasł: ${expires}`}</span>
                </div>
            </div>
            <div className="msg-actions">
                <label className={`toggle-status ${expired ? "expired-toggle" : ""}`} title={`${is_active ? 'Wyłącz' : 'Włącz'} komunikat`}>
                    <input disabled={expired} type="checkbox" checked={is_active && !expired} onChange={() => onToggle(id)} data-action="toggle" data-id={id} />
                    <span className="toggle-status-track"></span>
                </label>

                <button className="action-btn action-edit" title="Edytuj" onClick={() => onEdit(id)}>
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>

                <button className="action-btn action-delete" title="Usuń" onClick={() => onDelete(id)}>
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    );
}
