export default function TitleBar() {
  return (
    <header className="titlebar">
      <div className="titlebar__left">
        <svg className="titlebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span className="titlebar__name">DiffSync</span>
      </div>
      <div className="titlebar__center">
        <span className="titlebar__status">Ready</span>
      </div>
      <div className="titlebar__controls">
        <button className="titlebar__btn titlebar__btn--minimize">─</button>
        <button className="titlebar__btn titlebar__btn--maximize">□</button>
        <button className="titlebar__btn titlebar__btn--close">✕</button>
      </div>
    </header>
  )
}
