export default function SandboxPreview({ title, subtitle, fileCount, selectedFile }) {
  return (
    <div className="sandbox-card">
      <div className="sandbox-header">
        <span className="sandbox-dot sandbox-dot-red" />
        <span className="sandbox-dot sandbox-dot-yellow" />
        <span className="sandbox-dot sandbox-dot-green" />
        <div className="sandbox-title">Live preview sandbox</div>
      </div>
      <div className="sandbox-body">
        <div className="sandbox-app-bar">
          <div>
            <p className="sandbox-app-name">{title}</p>
            <p className="sandbox-app-subtitle">{subtitle}</p>
          </div>
          <div className="sandbox-chip">{fileCount} files</div>
        </div>
        <div className="sandbox-content">
          <div className="sandbox-screen">
            <p className="sandbox-screen-heading">Preview experience</p>
            <p className="sandbox-screen-text">
              {selectedFile ? `Selected file: ${selectedFile}` : 'Select a file from the list to preview details.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
