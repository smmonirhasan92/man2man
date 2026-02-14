'use client';

export default function GlobalError({ error, reset }) {
    return (
        <html>
            <body>
                <div style={{ padding: '2rem', color: 'red', fontFamily: 'monospace' }}>
                    <h2>CRITICAL APPLICATION CRASH</h2>
                    <pre>{error.message}</pre>
                    <pre>{error.stack}</pre>
                    <button onClick={() => reset()}>Try again</button>
                </div>
            </body>
        </html>
    );
}
