export default function TitleBar() {
  const isMac = window.electronAPI.platform === 'darwin'

  return (
    <header className={`titlebar ${isMac ? 'titlebar--mac' : ''}`}>
      <div className="titlebar__left">
        <svg className="titlebar__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Left file */}
          <rect x="2" y="3" width="8" height="18" rx="1.5" stroke="#58a6ff" strokeWidth="1.5" fill="rgba(88,166,255,0.1)" />
          <line x1="4.5" y1="7" x2="7.5" y2="7" stroke="#58a6ff" strokeWidth="1" strokeLinecap="round" />
          <line x1="4.5" y1="10" x2="8" y2="10" stroke="#58a6ff" strokeWidth="1" strokeLinecap="round" />
          <line x1="4.5" y1="13" x2="7" y2="13" stroke="#58a6ff" strokeWidth="1" strokeLinecap="round" />
          {/* Right file */}
          <rect x="14" y="3" width="8" height="18" rx="1.5" stroke="#a78bfa" strokeWidth="1.5" fill="rgba(167,139,250,0.1)" />
          <line x1="16.5" y1="7" x2="19.5" y2="7" stroke="#a78bfa" strokeWidth="1" strokeLinecap="round" />
          <line x1="16.5" y1="10" x2="20" y2="10" stroke="#a78bfa" strokeWidth="1" strokeLinecap="round" />
          <line x1="16.5" y1="13" x2="19" y2="13" stroke="#a78bfa" strokeWidth="1" strokeLinecap="round" />
          {/* Sync arrows */}
          <path d="M11 9l1.5-1.5L11 6" stroke="#58a6ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 15l-1.5 1.5L13 18" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="titlebar__name">DiffSync</span>
      </div>
      <div className="titlebar__center">
        <span className="titlebar__status">Ready</span>
      </div>
      {!isMac && (
        <div className="titlebar__controls">
          <button className="titlebar__btn titlebar__btn--minimize">─</button>
          <button className="titlebar__btn titlebar__btn--maximize">□</button>
          <button className="titlebar__btn titlebar__btn--close">✕</button>
        </div>
      )}
    </header>
  )
}
