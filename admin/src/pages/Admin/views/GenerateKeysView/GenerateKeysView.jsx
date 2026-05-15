import '../../../../styles/global.css';
import './GenerateKeysView.css';
import ListLoading from '../../../../components/ListLoading';
import { API, useAuth } from '../../../../api.js';
import { useState } from 'preact/hooks';
import { useEffect } from 'preact/hooks';
import KeyViewLimit from './KeyViewLimit';

export default function GenerateKeysView() {
    const { getAuthHeader } = useAuth();
    const [selected, setSelected] = useState("1");
    const [loading, setLoading] = useState(false);
    const [keys, setKeys] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10); 
    const [error, setError] = useState(null);
    const [tabsInfo, setTabsInfo] = useState({
        keysAmount: 0,
        maxForTab: 0,
        tabStart: 0,
        numberOfTabs: 0
    });

    useEffect(() => {
        loadKeys();
    }, [page, limit]);

    async function loadKeys() {
        await setupKeysPages();
        
        try {
            const res = await fetch(`${API}/keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ page: page, limit: limit })
            });
            
            const data = await res.json();
            setKeys(data);

            if (!res.ok) throw new Error(keys.error || 'Błąd serwera');

            if (keys.length === 0) return;

        } catch (err) {
            setError(err.message);
        }
        }

        async function submitGenerateKeyForm(e) {
            e.preventDefault();

            const count = selected;

            try {
                const res = await fetch(`${API}/keys/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({
                    count: Number(count)
                })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Error generating keys');

                try {
                const numberRes = await fetch(`${API}/keys/overflow`, { 
                    headers: getAuthHeader() 
                });
                if (!numberRes.ok) throw new Error('Nie można sprawdzić liczby kluczy');

                const data = await numberRes.json();
                const numberOfKeys = data.count;
                console.log("Liczba kluczy: ", numberOfKeys);
                if (numberOfKeys >= 1000) {
                    try {
                        const deleteCount = numberOfKeys - 1000;
                        const res = await fetch(`${API}/keys/overflow?limit=${deleteCount}`, {
                        method: 'DELETE',
                        headers: getAuthHeader()
                    });

                    if (!res.ok) throw new Error('Nie można usunąć nadmiarowych kluczy');

                    const data = await res.json();
                    console.log(`Usunięto ${data.deleted} kluczy`);
                    } catch (err) {
                        alert('Error: ' + err.message);
                    }
                }

                } catch (numErr) {
                alert('Klucze zostały wygenerowane, ale nie można sprawdzić liczby kluczy w bazie: ' + numErr.message);
                }

                await loadKeys();

            } catch (err) {
                alert('Error: ' + err.message);
            }
        }

        function prevPage() {
            setPage(p => Math.max(1, p - 1));
        }

        function nextPage() {
            setPage(p => Math.min(tabsInfo.numberOfTabs, p + 1));
        }

        function changePage(value) {
            let v = Number(value);

            if (v > tabsInfo.numberOfTabs) v = tabsInfo.numberOfTabs;
            if (v < 1) v = 1;

            setPage(v);
        }

        function changeLimit(value) {
            setLimit(Number(value));
            setPage(1);
        }

        async function handleCopy(key) {
            try {
                await navigator.clipboard.writeText(key.secret_key);

                await fetch(`${API}/keys/${key.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({
                    status: 'Wykorzystany'
                })
                });

                setKeys(prev =>
                    prev.map(k =>
                        k.id === key.id
                        ? { ...k, status: 'Wykorzystany' }
                        : k
                    )
                );

            } catch (err) {
                alert(err.message);
            }
        }

        async function setupKeysPages() {
        try {
            const currentTab = Number(page);
            const keysPerTab = Number(limit);
            const res = await fetch(`${API}/keys/tabs`, { 
                method: 'POST',
                headers: {
                ...getAuthHeader(), 
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                currentTab,
                keysPerTab
                })
            });
            if (!res.ok) throw new Error('Nie można sprawdzić liczby kluczy');

            const data = await res.json();

            setTabsInfo(data);

            } catch (numErr) {
            alert('Klucze zostały wygenerowane, ale nie można sprawdzić liczby kluczy w bazie: ' + numErr.message);
            }
        }

    return (
        <main className="view">
            <div className="view-header">
                <div>
                    <h2 className="view-title">Generator kodów</h2>
                    <p className="view-sub">Generuj unikalne kody</p>
                </div>
            </div>   

            <form className="key-form" novalidate>
                <div className="form-card">
                    <h3 className="form-card-title">Liczba generowanych haseł</h3>

                    <div className="key-count-radio-group">
                        <input type="radio" name="key-count" value="1" id="1" checked={selected === "1"} onChange={(e) => setSelected(e.target.value)} />
                        <label for="1">1</label>

                        <input type="radio" name="key-count" value="10" id="10" checked={selected === "10"} onChange={(e) => setSelected(e.target.value)}/>
                        <label for="10">10</label>

                        <input type="radio" name="key-count" value="50" id="50" checked={selected === "50"} onChange={(e) => setSelected(e.target.value)}/>
                        <label for="50">50</label>

                        <input type="radio" name="key-count" value="100" id="100" checked={selected === "100"} onChange={(e) => setSelected(e.target.value)}/>
                        <label for="100">100</label>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="generate-key-btn btn btn-primary btn-full" onClick={submitGenerateKeyForm}>
                        <span className="generate-key-label">Generuj</span>
                    </button>
                </div>
            </form>

            <div className="view-header">
                <h2 className="view-title">Wygenerowane kody</h2>
            </div>

            <KeyViewLimit
                page={page}
                limit={limit}
                tabsInfo={tabsInfo}
                onPrev={prevPage}
                onNext={nextPage}
                onChangePage={changePage}
                onChangeLimit={changeLimit}
            />

            <div id='key-list'>
                {error && (
                    <div className="error-msg">
                        Błąd: {error}
                    </div>
                )}
                
                {loading ? (
                    <ListLoading label='Ładowanie kodów...'/>
                    ) : (
                    keys.length === 0 ? (
                        <div className="empty-state">
                            <p>Brak wygenerowanych kodów.</p>
                        </div>
                    ) : (
                    keys.map((key) => {
                        const isUsed = key.status === 'Wykorzystany';

                        return (
                            <div
                            key={key.id}
                            className="key-row"
                            style={isUsed ? { backgroundColor: "#f3f3f3" } : undefined}
                            >
                            <span className="key-num">{key.row_num}</span>

                            <span className="key-label">
                                {key.secret_key}
                            </span>

                            <span className="key-date">
                                {key.created_at?.slice(0, 10)} | {key.created_at?.slice(11, 16)}
                            </span>

                            <span className={`key-status ${isUsed ? "used" : ""}`}>
                                {key.status}
                            </span>

                            <button
                                type="button"
                                className="action-btn action-copy"
                                title="Skopiuj"
                                disabled={isUsed}
                                onClick={(e) => handleCopy(key, e.currentTarget)}
                            >
                                <i className={isUsed ? "fa-solid fa-check" : "fa-regular fa-copy"} />
                            </button>
                            </div>
                        );
                    })
                    )
                )}
            </div>
        </main>
    );
}