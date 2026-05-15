import { useContext } from 'preact/hooks';
import { UserContext } from '../../../context/UserContext.jsx';

export default function SidebarFooter() {
    const { currentUser, setCurrentUser } = useContext(UserContext);

    return (
        <div className="sidebar-footer">
            <div className="user-info">
                <div className="user-avatar">
                    {currentUser?.email?.[0]?.toUpperCase() || "?"}
                </div>

                <div className="user-details">
                    <div className="user-email">
                        {currentUser?.email}
                    </div>

                    <div className="user-dept">
                        {currentUser?.department || ""}
                    </div>
                </div>
            </div>

            <button className="btn-logout" title="Wyloguj się" onClick={() => setCurrentUser(null)}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
        </div>
    );
}