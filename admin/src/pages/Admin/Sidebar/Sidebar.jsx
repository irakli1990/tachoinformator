import { useState, useEffect } from 'preact/hooks';
import { useRouter } from 'preact-router';
import { API, useAuth } from '../../../api.js';

import SidebarItem from './SidebarItem.jsx';
import ExpandableSidebarItem from './ExpandableSidebarItem.jsx';
import SidebarLogo from './SidebarLogo.jsx';
import SidebarFooter from './SidebarFooter.jsx';

import '../../../styles/global.css';
import './Sidebar.css';

export default function Sidebar() {
    const { getAuthHeader } = useAuth();
    const [activeCount, setActiveCount] = useState(0);
    const [{ url }] = useRouter();

    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');
    
    const currentPathBase = url.split('?')[0];
    const isEditingMode = currentPathBase === '/informator/edytuj-komunikat' && id;

    const messageFormLabel = isEditingMode ? 'Edytuj komunikat' : 'Nowy komunikat';
    const messageFormIcon = isEditingMode ? <i className="fa-solid fa-pen-to-square"></i> : <i className="fa-solid fa-plus"></i>;
    const messageFormPath = isEditingMode ? url : '/informator/nowy-komunikat';

    const activeIcon = <i className="fa-solid fa-circle-check"></i>;
    const archivedIcon = <i className="fa-solid fa-box-archive"></i>;
    const generateKeysIcon = <i className="fa-solid fa-key"></i>;
    const supportPanelIcon = <i className="fa-solid fa-upload"></i>;
    const inboxIcon = <i className="fa-solid fa-inbox"></i>;

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch(`${API}/messages?filter=active`, { headers: getAuthHeader() });
                if (res.ok) {
                    const list = await res.json();
                    setActiveCount(list.length);
                }
            } catch (err) { console.error("Sidebar badge error:", err); }
        };
        fetchCount();

        window.addEventListener('messageCountChanged', fetchCount);
        return () => window.removeEventListener('messageCountChanged', fetchCount);
    }, []);

    return (
        <aside className="sidebar screen">
            <SidebarLogo />

            <ExpandableSidebarItem label={'Informator'} icon={inboxIcon} >
                <SidebarItem 
                    label={messageFormLabel} 
                    icon={messageFormIcon} 
                    path={messageFormPath} 
                />
                <SidebarItem 
                    label={'Aktywne'} 
                    icon={activeIcon} 
                    path={'/informator/aktywne'} 
                    badge={activeCount > 0 ? activeCount.toString() : null}
                />
                <SidebarItem 
                    label={'Archiwum'} 
                    icon={archivedIcon} 
                    path={'/informator/archiwum'} 
                />
            </ExpandableSidebarItem>
            
            <SidebarItem label={'Generator kodów'} icon={generateKeysIcon} path={'/generator-kodow'} />
            <SidebarItem label={'Panel supportu'} icon={supportPanelIcon} path={'/support'} />

            <SidebarFooter />
        </aside>
    );
}