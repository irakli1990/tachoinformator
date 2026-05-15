import '../../../../styles/global.css';
import './SupportPanelView.css';

import UploadInfoCard from './UploadInfoCard.jsx';
import ReportListCard from './ReportListCard.jsx';

import { useEffect, useState } from 'preact/hooks';

import { API, useAuth } from '../../../../api.js';

export default function SupportPanelView() {
    const { getAuthHeader } = useAuth();

     const [stats, setStats] = useState({
        total: 0,
        read: 0,
        new: 0
    });

    async function reportNumbers() {
        try {
            const res = await fetch(`${API}/support/uploadCount`, {
                method: 'GET',
                headers: getAuthHeader()
            });

            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        reportNumbers();
    }, []);

    return (
        <main className="view">
            <div className="view-header">
                <div>
                    <h2 className="view-title">Panel supportu</h2>
                    <p className="view-sub">Wiadomości i pliki od klientów</p>
                </div>
            </div>

            <div className='info-cards'>
                <UploadInfoCard label={'Łącznie uploadów'} number={stats.total} description={'wszystkie zgłoszenia'} />
                <UploadInfoCard label={'Odczytane'} number={stats.read} description={'zgłoszenia odczytane'} />
                <UploadInfoCard label={'Nowe'} number={stats.new} description={'zgłoszenia nowe'} />
            </div>

            <ReportListCard />
        </main>
    )
}