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