# Frontend — Szybkie Liczenie 1v1

Początkowy interfejs aplikacji oparty na React, TypeScript, Vite i SCSS Modules.

## Uruchomienie

Wymagany Node.js 24 i npm.

```bash
cd frontend
npm install
npm run dev
```

Adres lokalny jest wyświetlany przez Vite (zwykle http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages

Workflow `.github/workflows/frontend-pages.yml` buduje frontend i publikuje katalog `frontend/dist` po zmianach w `frontend/` na gałęzi `main`.

W ustawieniach repozytorium wybierz **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Adres strony po poprawnym wdrożeniu: https://underdence.github.io/inzynierka/

GitHub Pages publikuje wyłącznie statyczny frontend. Backend NestJS, baza PostgreSQL i obsługa Socket.IO będą wdrażane oddzielnie.

## Aktualny zakres

Strona startowa, responsywna nawigacja oraz ekrany informacyjne treningu i pojedynku. Logika gry i komunikacja z backendem nie są jeszcze podłączone.
