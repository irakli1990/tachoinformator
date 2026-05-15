import '../../../../styles/global.css';

export default function UploadInfoCard({label, number, description}) {
    return (
        <div className="upload-info-card">
            <h5>{label}</h5>
            <p>{number}</p>
            <h6>{description}</h6>
        </div>
    )
}