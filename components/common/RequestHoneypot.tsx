export function RequestHoneypot() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      <label htmlFor="request-company-website">Company website</label>
      <input
        id="request-company-website"
        name="companyWebsite"
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
