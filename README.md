# Szybkie Liczenie 1v1

Projekt inżynierski — aplikacja do treningu liczenia i pojedynków 1v1.

## Struktura

- `backend/` — serwer NestJS i TypeScript.
- Frontend zostanie dodany w kolejnych etapach.

## Wymagania

- Node.js 24.16.0 — wersja używana podczas przygotowania projektu.
- npm instalowany razem z Node.js.
- Git.

## Lokalna baza PostgreSQL

Wymagany Docker Desktop z uruchomionym silnikiem kontenerów Linux.

Polecenia wykonuj z głównego folderu repozytorium.

Przy pierwszej konfiguracji skopiuj wzór:

```powershell
Copy-Item .env.example .env
```

W `.env` ustaw własne hasło `POSTGRES_PASSWORD`.
Jeśli `.env` już istnieje, nie nadpisuj go.

Uruchomienie bazy:

```powershell
docker compose up -d --wait
docker compose ps
```

Oczekiwany status: `healthy`.

Połączenie przez klienta psql wewnątrz kontenera:

```powershell
docker compose exec postgres psql -h 127.0.0.1 -U 123 -d math_duel -W
```

Podaj hasło z głównego `.env`.
Jeżeli zmieniono użytkownika lub nazwę bazy, dostosuj parametry `-U` i `-d`.

Wyjście z psql: `\q`.

Zatrzymanie i usunięcie kontenera z zachowaniem danych:

```powershell
docker compose down
```

Dane są przechowywane w nazwanym wolumenie `postgres_data`.
Polecenie `docker compose down -v` usuwa również ten wolumen i dane.

Baza jest dostępna z Windowsa pod adresem `127.0.0.1:5432`.
Backend nie jest jeszcze połączony z bazą.

### Pliki konfiguracji

- Główny `.env` — konfiguracja Docker Compose.
- `backend/.env` — konfiguracja aplikacji NestJS.
- Pliki `.env.example` — wzory bez rzeczywistych haseł.

Zmienne POSTGRES_DB, POSTGRES_USER i POSTGRES_PASSWORD inicjalizują
bazę przy pierwszym uruchomieniu z pustym katalogiem danych.
Późniejsza edycja `.env` nie zmienia automatycznie istniejącego
użytkownika, hasła ani nazwy bazy w zachowanym wolumenie.

## Uruchomienie backendu

Z głównego folderu repozytorium:

```powershell
cd backend
npm ci
```

Przy pierwszym uruchomieniu utwórz lokalną konfigurację:

```powershell
Copy-Item .env.example .env
```

Jeśli `backend/.env` już istnieje, nie nadpisuj go.

Uruchom serwer:

```powershell
npm run start:dev
```

Sprawdzenie działania: http://localhost:3000/health

Oczekiwana odpowiedź: `{"status":"ok"}`.
Adres zakłada `PORT=3000` w `backend/.env`.

Zatrzymanie serwera: Ctrl+C.

## Kontrole backendu

Z folderu `backend`:

```powershell
npm run lint
npm run format:check
npm run typecheck
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

### Przygotowanie bazy dla backendu

Najpierw uruchom PostgreSQL z głównego folderu repozytorium:

```powershell
docker compose up -d --wait
```

W `backend/.env` ustaw:
- `DATABASE_URL` — adres lokalnej bazy z właściwym użytkownikiem i hasłem;
- `SEED_USER_PASSWORD` — własne hasło przykładowego konta gracza.

Z folderu `backend` wykonaj:

```powershell
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

Polecenia generują klienta Prisma, stosują zapisane migracje
i przygotowują konto `tester@example.com` z nickiem `Tester`.

Ponowne uruchomienie seedu nie tworzy duplikatu ani nie zmienia
hasła istniejącego konta.

Backend i testy E2E wymagają działającej bazy.

### Zmiany modelu danych podczas developmentu

Po edycji `prisma/schema.prisma` utwórz migrację:

```powershell
npx prisma migrate dev --name opis_zmiany
npx prisma generate
```

Schemat i migracje zapisujemy w Git.
Wygenerowanego klienta z `src/generated/prisma` nie zapisujemy.

## Backend — podstawy REST API

Backend korzysta z globalnej walidacji DTO:
- odrzuca dane niespełniające reguł walidacji;
- odrzuca dodatkowe pola niezdefiniowane w DTO;
- przekształca dane wejściowe w instancje klas DTO.

### Konfiguracja CORS

W `backend/.env` ustaw adres frontendu:

```dotenv
FRONTEND_ORIGIN=http://localhost:5173
```

Origin obejmuje protokół, host i port. Podczas integracji należy
dopasować go do rzeczywistego adresu frontendu.

### Health check

`GET /health` zwraca:

```json
{
  "status": "ok"
}
```

Endpoint potwierdza działanie aplikacji HTTP.
Nie sprawdza dostępności bazy danych.

### Format błędów

Odpowiedzi błędów HTTP mają wspólną strukturę:

```json
{
  "statusCode": 404,
  "message": ["Cannot GET /nie-istnieje"],
  "path": "/nie-istnieje",
  "timestamp": "2026-10-22T20:00:00.000Z"
}
```

Pole `message` jest zawsze tablicą tekstów.
Błędy serwera są logowane, a klient otrzymuje ogólny komunikat.

### Testy

Z folderu `backend`:

```powershell
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

Testy e2e wymagają uruchomionej bazy i poprawnego `DATABASE_URL`.
Obejmują połączenie z bazą, health, walidację, format błędów,
ukrywanie szczegółów awarii oraz nagłówek CORS.

Kontroler testowy istnieje wyłącznie w aplikacji testowej.

## Tożsamość gracza

Backend obsługuje konta oraz tymczasowych gości.

### Endpointy

| Metoda | Endpoint | Działanie |
|---|---|---|
| POST | /auth/register | Utworzenie konta |
| POST | /auth/login | Logowanie i utworzenie sesji konta |
| POST | /auth/guest | Utworzenie sesji gościa z automatycznym nickiem |
| GET | /auth/me | Odczyt aktualnego gracza |
| POST | /auth/logout | Unieważnienie przesłanych sesji konta i gościa |

Rejestracja nie loguje automatycznie.

### Dane konta

- E-mail jest normalizowany do małych liter.
- Nick ma 3–20 znaków: litery polskie i łacińskie, cyfry oraz `_`.
- Nick jest unikalny bez rozróżniania wielkości liter.
- Hasło ma 8–128 znaków i jest hashowane przez Argon2id.

### Sesje

Sesje są ważne maksymalnie 24 godziny, bez automatycznego
przedłużania. Baza przechowuje hashe tokenów.

Tokeny są przekazywane przez ciasteczka HttpOnly:
- math_duel_session — konto;
- math_duel_guest — gość.

Przy obecności obu ważnych sesji konto ma pierwszeństwo.
Wylogowanie unieważnia obie sesje przesłane przez klienta.

Odpowiedź /auth/me zawiera obiekt player:
- type: user — konto, pola id, email, nickname;
- type: guest — gość, pola id, nickname.

### Żądania z frontendu

Frontend powinien używać credentials: 'include'.
Żądania zmieniające dane wymagają Origin zgodnego z FRONTEND_ORIGIN.
Brak lub niezgodny Origin powoduje odpowiedź 403.

Logowanie, rejestracja i tworzenie gościa mają osobne limity:
10 żądań na minutę z jednego IP; przekroczenie powoduje 429.
Liczniki są przechowywane w pamięci procesu.

### Wdrożenie i utrzymanie

Przy wdrożeniu wymagane są HTTPS, NODE_ENV=production
oraz dopasowanie konfiguracji origin i zaufanego proxy.

Wygasłe sesje są odrzucane przez backend, ale ich rekordy
nie są jeszcze automatycznie usuwane z bazy.

## Diagnostyka Socket.IO — etap 02.08

Backend obsługuje namespace `/realtime`. Tożsamość gracza jest
rozpoznawana na podstawie cookie sesji użytkownika lub gościa.

Podczas nawiązywania połączenia backend sprawdza origin i sesję.
Sesja jest ponownie sprawdzana podczas obsługi zdarzeń.

### Zdarzenia diagnostyczne

- `connection:check` — zwraca dane połączenia i rozpoznanego gracza.
- `diagnostic:join` — dołącza połączenie do wspólnego pokoju testowego.
- `diagnostic:ping` — wysyła powiadomienie do uczestników pokoju.
- `diagnostic:message` — powiadomienie odbierane przez klientów.

Zdarzenia wysyłane przez klienta zwracają potwierdzenie:
`{ ok: true, ... }` albo `{ ok: false, error: { code, message } }`.

Pokój diagnostyczny nie jest pokojem pojedynku i nie ma limitu
dwóch uczestników.

### Strony diagnostyczne

Pliki znajdują się w `backend/tools/socket-check`.

Aby udostępnić je przez Nest, ustaw w `backend/.env`:

ENABLE_DIAGNOSTICS=true

Uruchamiaj backend z folderu `backend`.
Strona pokoju jest dostępna pod `/diagnostics/room.html`.
Korzysta z tego samego originu co serwer, który ją udostępnia.

FRONTEND_ORIGIN musi odpowiadać originowi otwartej strony.

Ustawienie ENABLE_DIAGNOSTICS=false wyłącza udostępnianie stron,
ale nie wyłącza zdarzeń diagnostycznych w gatewayu.

### Wykonane próby ręczne

- Połączenie z ważną sesją gościa.
- Odrzucenie połączenia bez ważnej sesji oraz z niedozwolonym originem.
- Odrzucenie wiadomości po wylogowaniu na nadal otwartym połączeniu.
- Odrzucenie wysyłania do pokoju przed dołączeniem: NOT_IN_ROOM.
- Przekazywanie wiadomości między dwiema sesjami przeglądarki.
- Komunikacja przez WebSocket między komputerem i telefonem
  korzystającym z internetu komórkowego, przez tymczasowy tunel HTTPS.

Próba między urządzeniami zakończyła się powodzeniem 23.10.2026.

### Ograniczenia

To rozwiązanie diagnostyczne. Nie obejmuje jeszcze zasad dostępu
do prywatnych pojedynków ani automatycznego usuwania odbiorcy
z pokoju po unieważnieniu jego sesji.