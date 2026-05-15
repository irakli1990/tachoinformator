import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { API, useAuth } from '../../../../api.js';
import '../../../../styles/global.css';

export default function MessageFormView() {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id'); 

    const isEditMode = !!id;
    const { getAuthHeader } = useAuth();

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: null, msg: '' });
    
    const [formData, setFormData] = useState({
        headline: '',
        description: '',
        display_duration_days: '7',
        display_frequency: '1x_daily',
        display_interval: '01:00',
        display_time: '10:00',
        show_push: true,
        is_active: true
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [hasImage, setHasImage] = useState(false);
    const [removeImage, setRemoveImage] = useState(false);
    const [showInterval, setShowInterval] = useState(false);

    useEffect(() => {
        if (!isEditMode) return;

        const fetchMessageData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API}/messages/${id}`, { 
                    headers: getAuthHeader() 
                });
                
                if (!res.ok) throw new Error('Nie udało się pobrać danych komunikatu.');
                
                const data = await res.json();

                setFormData({
                    headline: data.headline || '',
                    description: data.description || '',
                    display_duration_days: data.display_duration_days || '7',
                    display_frequency: data.display_frequency || '1x_daily',
                    display_interval: data.display_interval || '01:00',
                    display_time: data.display_time || '10:00',
                    show_push: data.show_push ?? true,
                    is_active: data.is_active ?? true
                });

                if (data.image_url) {
                    setHasImage(true);
                    
                    const serverBase = API.replace('/api', ''); 
                    setPreviewUrl(`${serverBase}${data.image_url}`);
                }

                if (data.image_url) {
                    setHasImage(true);
                    setRemoveImage(false);
                    const serverBase = API.replace('/api', '');
                    setPreviewUrl(`${serverBase}${data.image_url}`);
                }
                
                setShowInterval(data.display_frequency !== '1x_daily');
            } catch (err) {
                setStatus({ type: 'error', msg: err.message });
            } finally {
                setLoading(false);
            }
        };

        fetchMessageData();
    }, [id, isEditMode]);

    useEffect(() => {
        if (!selectedFile) return;

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({ ...prev, [name]: finalValue }));
        
        if (name === 'display_frequency') {
            setShowInterval(value !== '1x_daily');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: null, msg: '' });

        if (!formData.headline.trim()) return setStatus({ type: 'error', msg: 'Hasło główne jest wymagane.' });
        if (!formData.description.trim()) return setStatus({ type: 'error', msg: 'Opis jest wymagany.' });

        setLoading(true);

        try {
            const url = isEditMode ? `${API}/messages/${id}` : `${API}/messages`;
            const method = isEditMode ? 'PUT' : 'POST';

            const submissionData = new FormData();
            
            Object.keys(formData).forEach(key => {
                submissionData.append(key, formData[key]);
            });

            if (selectedFile) {
                submissionData.append('image', selectedFile);
            }

            if (removeImage && isEditMode) {
                submissionData.append('remove_image', 'true');
            }

            const res = await fetch(url, { 
                method, 
                headers: getAuthHeader(), 
                body: submissionData 
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Błąd serwera');

            setStatus({ 
                type: 'success', 
                msg: isEditMode ? 'Zaktualizowano pomyślnie!' : 'Opublikowano pomyślnie!' 
            });

            setTimeout(() => route('/informator/aktywne'), 1200);
        } catch (err) {
            setStatus({ type: 'error', msg: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="view">
            <div className="view-header">
                <div>
                    <h2 className="view-title">
                        {isEditMode ? 'Edytuj komunikat' : 'Nowy komunikat'}
                    </h2>
                    <p className="view-sub">
                        {isEditMode ? 'Zmień parametry istniejącego komunikatu' : 'Wypełnij poniższy formularz i opublikuj komunikat'}
                    </p>
                </div>
                <button className="btn btn-ghost" onClick={() => route('/informator/aktywne')}>Anuluj</button>
            </div>

            <form className="message-form" onSubmit={handleSubmit}>
                <div className="main-form">
                    <div className="form-grid">
                        <div className="form-card">
                            <h3 className="form-card-title">Treść komunikatu</h3>

                            <div className="field-group">
                                <label className="field-label">Hasło główne <span className="required">*</span></label>
                                <input 
                                    type="text" 
                                    name="headline" 
                                    className="field-input" 
                                    value={formData.headline} 
                                    onInput={handleInputChange} 
                                    maxLength="120" 
                                />
                            </div>

                            <div className="field-group">
                                <label className="field-label">Opis <span className="required">*</span></label>
                                <textarea 
                                    name="description" 
                                    className="field-textarea" 
                                    rows="6" 
                                    value={formData.description} 
                                    onInput={handleInputChange}
                                ></textarea>
                            </div>

                            <div className="field-group">
                                <label className="field-label">Grafika (miniaturka)</label>
                                <div style="margin-bottom:10px;">
                                    <label>
                                        <input 
                                        type="checkbox" 
                                        checked={hasImage} 
                                        onChange={(e) => {
                                            const checked = e.target.checked;

                                            setHasImage(checked);

                                            if (!checked) {
                                                setSelectedFile(null);
                                                setPreviewUrl(null);
                                                setRemoveImage(true);
                                            } else {
                                                setRemoveImage(false);
                                            }
                                        }}
                                    /> Dodaj zdjęcie
                                    </label>
                                </div>

                                {hasImage && (
                                    <div className="field-group">
                                        <label
                                            className="upload-zone"
                                            style={{
                                                backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                                                backgroundSize: 'cover', 
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat',
                                                border: previewUrl ? 'none' : '2px dashed #ccc'
                                            }}>
                                            <input
                                                type="file"
                                                style={{ display: 'none' }}
                                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                                accept="image/*"/>
                                            {!previewUrl && (
                                                <div className="upload-placeholder">
                                                    <i className="fa-regular fa-image fa-2x"></i>
                                                    <span>Wybierz zdjęcie</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="form-grid-right">
                        <div className="form-card">
                            <h3 className="form-card-title">Ustawienia wyświetlania</h3>

                            <div className="field-group">
                                <label className="field-label">Czas wyświetlania</label>
                                <select 
                                    name="display_duration_days" 
                                    className="field-select" 
                                    value={formData.display_duration_days} 
                                    onChange={handleInputChange}
                                >
                                    <option value="1">1 dzień</option>
                                    <option value="7">1 tydzień</option>
                                    <option value="30">1 miesiąc</option>
                                </select>
                            </div>

                            <div className="field-group">
                                <label className="field-label">Częstotliwość powiadomień</label>
                                <select 
                                    name="display_frequency" 
                                    className="field-select" 
                                    value={formData.display_frequency} 
                                    onChange={handleInputChange}
                                >
                                    <option value="1x_daily">1 raz dziennie</option>
                                    <option value="2x_daily">2 razy dziennie</option>
                                    <option value="3x_daily">3 razy dziennie</option>
                                </select>
                            </div>

                            {showInterval && (
                                <div className="field-group">
                                    <label className="field-label">Częstotliwość (HH:mm)</label>
                                    <input 
                                        type="time" 
                                        name="display_interval" 
                                        className="field-input" 
                                        value={formData.display_interval} 
                                        onInput={handleInputChange} 
                                    />
                                </div>
                            )}

                            <div className="field-group">
                                <label className="field-label">Godzina startu</label>
                                <input 
                                    type="time" 
                                    name="display_time" 
                                    className="field-input" 
                                    value={formData.display_time} 
                                    onInput={handleInputChange} 
                                />
                            </div>

                            <div className="toggles-section">
                                <div className="toggle-row">
                                    <span className="toggle-label">Push notification</span>
                                    <label className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            name="show_push" 
                                            checked={formData.show_push} 
                                            onChange={handleInputChange} 
                                        />
                                        <span className="toggle-track"></span>
                                    </label>
                                </div>
                                <div className="toggle-row">
                                    <span className="toggle-label">Aktywny</span>
                                    <label className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            name="is_active" 
                                            checked={formData.is_active} 
                                            onChange={handleInputChange} 
                                        />
                                        <span className="toggle-track"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            {status.msg && (
                                <div className={`message ${status.type}-msg`}>
                                    {status.msg}
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                <span>
                                    {loading ? 'Przetwarzanie...' : (isEditMode ? 'Zapisz zmiany' : 'Opublikuj komunikat')}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </main>
    );
}