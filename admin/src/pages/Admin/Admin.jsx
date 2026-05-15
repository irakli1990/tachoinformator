import { Router, useRouter } from 'preact-router';
import Sidebar from './Sidebar/Sidebar.jsx';
import Redirect from '../../components/Redirect.jsx';

import ActiveView from './views/ActiveView/ActiveView.jsx';
import ArchivedView from './views/ArchivedView/ArchivedView.jsx';
import GenerateKeysView from './views/GenerateKeysView/GenerateKeysView.jsx';
import MessageFormView from './views/MessageFormView/MessageFormView.jsx';
import SupportPanelView from './views/SupportPanelView/SupportPanelView.jsx';

export default function Admin() {
    const [ router ] = useRouter();
    
    return (
    <>
        <Sidebar />

        <Router key={router.url}>
            <Redirect path="/" to="/informator/aktywne" />
            <Redirect path="/informator" to="/informator/aktywne" />
            <Redirect path="" to="" />

            <ActiveView path="/informator/aktywne" />
            <ArchivedView path="/informator/archiwum" />
            <MessageFormView path="/informator/nowy-komunikat" />
            <MessageFormView path="/informator/edytuj-komunikat" />

            <GenerateKeysView path="/generator-kodow" />
            <SupportPanelView path="/support" />
        </Router>
    </>
    );
}