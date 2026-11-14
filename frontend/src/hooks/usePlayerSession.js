
import { useEffect, useState } from 'react';
import { ensurePlayerSession } from '../api/auth';

export function usePlayerSession() {
    const [session, setSession] = useState({
        status: 'loading',
        player: null,
        error: null,
    });

    useEffect(() => {
        let active = true;

        ensurePlayerSession()
            .then((player) => {
                if (active) {
                    setSession({
                        status: 'ready',
                        player,
                        error: null,
                    });
                }
            })
            .catch((error) => {
                if (active) {
                    setSession({
                        status: 'error',
                        player: null,
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Nie udało się rozpocząć sesji.',
                    });
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return session;
}
