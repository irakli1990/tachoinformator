export default function KeyViewLimit({
    page,
    limit,
    setPage,
    setLimit,
    tabsInfo,
    onPrev,
    onNext,
    onChangePage,
    onChangeLimit
}) {
    return (
        <div className="key-view-limit">

            <button onClick={onPrev}>
                <i className="fa-solid fa-angle-left"></i>
            </button>

            <p>
                <input
                    className="current-tab"
                    type="number"
                    value={page}
                    min="1"
                    step="1"
                    onChange={(e) => onChangePage(e.target.value)}
                />
                {" / "}
                <span>{tabsInfo.numberOfTabs}</span>
            </p>

            <button onClick={onNext}>
                <i className="fa-solid fa-angle-right"></i>
            </button>

            <p>
                {tabsInfo.tabStart} - {tabsInfo.maxForTab} / {tabsInfo.keysAmount}
            </p>

            <select value={limit} onChange={(e) => onChangeLimit(e.target.value)}>
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>

        </div>
    );
}