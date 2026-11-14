
const API_URL = (
    import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '');

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export async function apiRequest(path, options = {}) {
    const { body, headers, ...init } = options;

    const requestHeaders = new Headers(headers);

    if (body !== undefined) {
        requestHeaders.set('Content-Type', 'application/json');
    }

    let response;

    try {
        response = await fetch(`${API_URL}/${path.replace(/^\/+/, '')}`, {
            ...init,
            headers: requestHeaders,
            credentials: 'include',
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new Error('Nie udało się połączyć z serwerem.');
    }

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        let message = `Błąd serwera (${response.status}).`;

        if (errorBody && typeof errorBody === 'object') {
            const value = errorBody.message;

            if (typeof value === 'string') {
                message = value;
            } else if (Array.isArray(value)) {
                message =
                    value.filter((item) => typeof item === 'string').join(', ') ||
                    message;
            }
        }

        throw new ApiError(response.status, message);
    }

    if (response.status === 204) {
        return undefined;
    }

    return response.json();
}
