
import { ApiError, apiRequest } from './client';

export function getCurrentPlayer() {
    return apiRequest('/auth/me');
}

export function createGuestSession() {
    return apiRequest('/auth/guest', {
        method: 'POST',
    });
}

export function logout() {
    return apiRequest('/auth/logout', {
        method: 'POST',
    });
}

let sessionPromise = null;

export function ensurePlayerSession() {
    if (!sessionPromise) {
        sessionPromise = (async () => {
            try {
                const response = await getCurrentPlayer();
                return response.player;
            } catch (error) {
                if (!(error instanceof ApiError) || error.status !== 401) {
                    throw error;
                }

                const response = await createGuestSession();
                return response.player;
            }
        })().finally(() => {
            sessionPromise = null;
        });
    }

    return sessionPromise;
}
