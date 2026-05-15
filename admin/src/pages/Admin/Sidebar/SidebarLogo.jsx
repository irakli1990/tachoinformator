import logoNormal from '../../../assets/logo-normal.png';

export default function SidebarLogo() {
    return (
        <div className="sidebar-logo">
            <img className="logo" src={logoNormal} alt="logo" />
        </div>
    );
}