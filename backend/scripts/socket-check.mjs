import { io } from 'socket.io-client';

const frontendOrigin = 'http://localhost:5173';
const origin = process.env.SOCKET_ORIGIN ?? frontendOrigin;

console.log('Tworzę sesję gościa przez HTTP...');

const guestResponse = await fetch('http://localhost:3000/auth/guest', {
  method: 'POST',
  headers: {
    Origin: frontendOrigin,
  },
});

if (!guestResponse.ok) {
  throw new Error(
    `Tworzenie gościa nie powiodło się: HTTP ${guestResponse.status}`,
  );
}

const setCookie = guestResponse.headers
  .getSetCookie()
  .find((value) => value.startsWith('math_duel_guest='));

const guestCookie = setCookie?.split(';')[0];

if (!guestCookie) {
  throw new Error('Backend nie zwrócił ciasteczka gościa.');
}

const socket = io('http://localhost:3000/realtime', {
  autoConnect: false,
  reconnection: false,
  timeout: 5000,
  extraHeaders: {
    Origin: origin,
    Cookie: guestCookie,
  },
});

socket.on('connect', async () => {
  console.log('Połączono z backendem.');
  console.log('Identyfikator połączenia:', socket.id);

  try {
    console.log('Wysyłam connection:check...');

    const response = await socket.timeout(5000).emitWithAck('connection:check');

    console.log('Odpowiedź backendu:', response);

    if (response?.ok !== true || response.socketId !== socket.id) {
      throw new Error('Backend zwrócił nieoczekiwaną odpowiedź.');
    }

    console.log('Odpowiedź dotyczy naszego połączenia.');
    console.log('Wylogowuję gościa przez HTTP...');

    const logoutResponse = await fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      headers: {
        Origin: frontendOrigin,
        Cookie: guestCookie,
      },
    });

    if (logoutResponse.status !== 204) {
      throw new Error(
        `Wylogowanie nie powiodło się: HTTP ${logoutResponse.status}`,
      );
    }

    console.log('Ponawiam wiadomość na tym samym połączeniu...');

    const afterLogout = await socket
      .timeout(5000)
      .emitWithAck('connection:check');

    console.log('Odpowiedź po wylogowaniu:', afterLogout);

    if (
      afterLogout?.ok !== false ||
      afterLogout.error?.code !== 'UNAUTHORIZED'
    ) {
      throw new Error('Backend nie odrzucił wiadomości po wylogowaniu.');
    }

    console.log('Unieważniona sesja została poprawnie odrzucona.');
  } catch (error) {
    console.error('Test wiadomości nie powiódł się:', error);
    process.exitCode = 1;
  } finally {
    socket.disconnect();
  }
});

socket.on('disconnect', (reason) => {
  console.log('Rozłączono. Powód:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Nie udało się połączyć:', error.message);
  socket.disconnect();
  process.exitCode = 1;
});

console.log('Rozpoczynam łączenie...');
socket.connect();
