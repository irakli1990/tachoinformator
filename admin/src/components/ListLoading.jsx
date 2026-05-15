export default function ListLoading({ label }) {
    return (
        <div class="list-loading">
            <div class="spinner"></div>
            <span>{label}</span>
        </div>
    );
}