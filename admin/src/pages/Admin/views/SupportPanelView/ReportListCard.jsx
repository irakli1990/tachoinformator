import { useEffect, useState } from 'preact/hooks';
import '../../../../styles/global.css';
import ListLoading from '../../../../components/ListLoading';
import { API, useAuth } from '../../../../api.js';
import { useMemo } from 'preact/hooks';
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function ReportListCard() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const { getAuthHeader } = useAuth();
    const [openReports, setOpenReports] = useState({});
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function loadFiles() {
            setLoading(true);
            try {
                const res = await fetch(`${API}/support/uploads?search=${encodeURIComponent(search)}`, {
                    headers: getAuthHeader() 
                });

                const data = await res.json();
                setFiles(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        const delayDebounce = setTimeout(() => {
            loadFiles();
        }, 300); 

        return () => clearTimeout(delayDebounce);
    }, [search]);

    const groupedFiles = useMemo(() => {
    const grouped = files.reduce((acc, file) => {
        if (!acc[file.report_id]) {
            acc[file.report_id] = {
                report_id: file.report_id,
                created_by: file.created_by,
                created_by_email: file.created_by_email,
                status: file.status,
                created_at: file.created_at,
                description: file.description,
                files: []
            };
        }

        acc[file.report_id].files.push(file.file_path);
        return acc;
    }, {});

    return Object.values(grouped)
        .filter(r => {
            const q = search.toLowerCase();

            return (
                r.created_by?.toLowerCase().includes(q) ||
                r.created_by_email?.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            const aIsNew = a.status !== 'Odczytane';
            const bIsNew = b.status !== 'Odczytane';

            if (aIsNew !== bIsNew) {
                return bIsNew - aIsNew;
            }

            return new Date(b.created_at) - new Date(a.created_at);
        });
}, [files, search]);

    async function toggle(reportId) {
        const isOpening = !openReports[reportId];

        setOpenReports(prev => ({
            ...prev,
            [reportId]: isOpening
        }));

        if (isOpening) {
            try {
                await fetch(`${API}/support/reports/${reportId}/read`, {
                    method: 'PATCH',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });

                setFiles(prev =>
                    prev.map(f =>
                        f.report_id === reportId
                            ? { ...f, status: 'Odczytane' }
                            : f
                    )
                );

            } catch (err) {
                console.error("Failed to mark as read:", err);
            }
        }
    }

    async function deleteReport(reportId) {
        try {
            const res = await fetch(`${API}/support/reports/${reportId}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err);
            }

            setFiles(prev =>
                prev.filter(f => f.report_id !== reportId)
            );

        } catch (err) {
            console.error("Delete failed:", err);
            alert("Nie udało się usunąć zgłoszenia");
        }
    }

    async function downloadZip(report) {
        const zip = new JSZip();

        for (const filePath of report.files) {
            const fileName = filePath.split("/").pop();

            const res = await fetch(`${API}/download/${encodeURIComponent(fileName)}`);
            const blob = await res.blob();

            zip.file(fileName, blob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `report-${report.created_by}.zip`);
    }

    return (
        <div className="report-list-card">
            <div className="report-list-header">
                <h3>Lista zgłoszeń</h3>
                <input
                    type="text"
                    placeholder="Szukaj (imię, email...)"
                    className="report-search"
                    value={search}
                    onInput={(e) => setSearch(e.target.value)}
                />
            </div>

            <table className="report-table">
                <thead>
                    <tr>
                        <th>KLIENT</th>
                        <th>EMAIL</th>
                        <th>STATUS</th>
                        <th>DATA</th>
                        <th>PLIKI</th>
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="5">
                                <ListLoading />
                            </td>
                        </tr>
                    ) : (
                        groupedFiles.length === 0 ? (
                            <div className="empty-state">
                                <p>Brak zgłoszeń.</p>
                            </div>
                        ) : (
                        groupedFiles.map((r) => (
                            <>
                            <tr key={r.report_id} className="report-row">
                                <td>{r.created_by}</td>
                                <td>{r.created_by_email}</td>
                                <td className={`${r.status === 'Nowe' ? 'new' : 'read'}`}>{r.status}</td>
                                <td>{new Date(r.created_at).toLocaleString()}</td>
                                <td className='showBtnBox'>
                                    <button className='showFilesBtn' onClick={() => toggle(r.report_id)}>
                                        {openReports[r.report_id]
                                            ? "Ukryj pliki"
                                            : `Pokaż pliki (${r.files.length})`}
                                    </button>
                                    <button
                                        className="deleteBtn"
                                        onClick={() => {
                                            if (confirm("Na pewno usunąć zgłoszenie?")) {
                                                deleteReport(r.report_id);
                                            }
                                        }}
                                        >
                                            <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </td>
                            </tr>

                            {openReports[r.report_id] && (
                                <tr className="report-expanded-row">
                                    <td colSpan="5">
                                        <div className='expandedContent'
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: '20px',
                                                padding: '12px 0',
                                                width: '100%'
                                            }}>
                                        <div className='description'
                                                style={{
                                                    flex: 1,
                                                    textAlign: 'left',
                                                    wordBreak: 'break-word',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    minHeight: '40px'
                                                }}>
                                                {r.description || "Brak opisu"}
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                    flexShrink: 0
                                                }}>
                                                <ul
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        listStyle: 'none',
                                                        margin: 0,
                                                        marginRight: '100px',
                                                        padding: 0
                                                    }}
                                                >
                                                    {r.files.map((f, i) => (
                                                        <li className='fileDownload' key={i}>
                                                            <a
                                                                href={`http://localhost:3000/download/${encodeURIComponent(f.split('/').pop())}`}
                                                                style={{
                                                                    textDecoration: 'none',
                                                                    color: '#4da3ff',
                                                                    fontWeight: '500',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    height: '40px'
                                                                }}
                                                            >
                                                                {f.split('/').pop()}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>

                                                <button
                                                    className="downloadAllBtn"
                                                    onClick={() => downloadZip(r)}
                                                    style={{
                                                        height: '40px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginRight: '80px'
                                                    }}
                                                >
                                                    Pobierz wszystkie
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </>
                        ))
                    ))}
                </tbody>
            </table>
        </div>
    );
}