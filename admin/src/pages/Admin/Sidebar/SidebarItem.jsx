import clsx from 'clsx';
import { route, useRouter } from 'preact-router';

export default function SidebarItem({ label, icon, path, badge }) {
    const [{ url }] = useRouter();

    const currentPathBase = url.split('?')[0];
    const itemPathBase = path.split('?')[0];

    const isActive = currentPathBase === itemPathBase;

    const handleClick = (e) => {
        e.preventDefault();
        if (url === path) return;

        route(path);
    };

    return (
        <button onClick={handleClick} className={clsx('nav-item', isActive && 'active')} type="button">
            {icon}
            <span className="nav-label">{label}</span>
            {badge && <span className="nav-badge">{badge}</span>}
        </button>
    );
}