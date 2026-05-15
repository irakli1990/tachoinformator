import { useState, useEffect } from 'preact/hooks';
import { useRouter } from 'preact-router';
import clsx from 'clsx';

export default function ExpandableSidebarItem({ label, icon, children }) {
    const [router] = useRouter();
    const currentPath = router.url;

    const childrenArray = Array.isArray(children) ? children : [children];
    const isChildActive = childrenArray.some(child => currentPath === child.props.path);

    const [isOpen, setIsOpen] = useState(isChildActive);


    useEffect(() => {
        if (isChildActive) {
            setIsOpen(true);
        }
    }, [isChildActive]);

    return (
        <div className={clsx('expandable-group', isOpen && 'is-open')}>
            <button type="button" onClick={() => setIsOpen(!isOpen)}  className={clsx('nav-item expandable-trigger', isChildActive && 'parent-active')}>
                {icon}
                <span>{label}</span>
                <i className={clsx('fa-solid fa-chevron-down arrow', isOpen && 'rotated')}></i>
            </button>

            {isOpen && (
                <div className="expandable-content">
                    {children}
                </div>
            )}
        </div>
    );
}