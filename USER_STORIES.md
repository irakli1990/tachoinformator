# ClientPulse — User Stories

## Typ użytkownika: Klient (Użytkownik końcowy)

| ID | Jako... | Chcę... | Aby... | Kryteria akceptacji |
|---|---|---|---|---|
| **US-C01** | Klient | Mieć aplikację zainstalowaną automatycznie z produktem | Nie musieć nic instalować osobno | Instalator głównego produktu zawiera ClientPulse; po instalacji ikona pojawia się w zasobniku systemowym |
| **US-C02** | Klient | Widzieć ikonę aplikacji w zasobniku systemowym | Wiedzieć, że jest aktywna | Ikona jest widoczna w tray; tooltip „ClientPulse — Komunikaty firmowe" |
| **US-C03** | Klient | Otrzymywać powiadomienia push o nowych komunikatach | Być na bieżąco z informacjami firmy | Powiadomienie push pojawia się z miniaturką grafiki i hasłem głównym o skonfigurowanej godzinie |
| **US-C04** | Klient | Kliknąć w powiadomienie i zobaczyć listę przesłanych komunikatów | Szybko zobaczyć wszystkie aktualności | Po kliknięciu otwiera się okno z listą komunikatów (grafika + hasło + początek opisu + „Czytaj dalej") |
| **US-C05** | Klient | Kliknąć komunikat i przeczytać pełną treść | Zapoznać się ze szczegółami | Otwiera się widok szczegółowy z grafiką, hasłem i pełnym opisem; widoczny przycisk „Wróć do listy" |
| **US-C06** | Klient | Zamknąć okno i wrócić do pracy | Nie być rozpraszanym | Przycisk ✕ zamyka okno; aplikacja nadal działa w tle |
| **US-C07** | Klient | Wyłączyć aplikację gdy nie chcę komunikatów | Mieć kontrolę nad narzędziem | Menu kontekstowe tray → „Zamknij ClientPulse"; po kliknięciu aplikacja kończy działanie |
| **US-C08** | Klient | Otrzymywać powiadomienia o rozsądnej porze | Nie być niepokojonym w nieodpowiednim momencie | Powiadomienia wyświetlane tylko o godzinie skonfigurowanej przez nadawcę (domyślnie 10:00) |
| **US-C09** | Klient | Mieć aplikację działającą cicho w tle | Nie odczuwać jej wydajnościowego wpływu | Aplikacja w idle zużywa < 50 MB RAM; brak okna gdy schowana do tray |

---

## Typ użytkownika: Pracownik BOK / Dział Marketingu (Administrator)

| ID | Jako... | Chcę... | Aby... | Kryteria akceptacji |
|---|---|---|---|---|
| **US-A01** | Pracownik | Zalogować się podając firmowy e-mail (bez hasła) | Szybko uzyskać dostęp do panelu | Formularz z polem e-mail; walidacja domeny firmowej; redirect do dashboardu po zatwierdzeniu |
| **US-A02** | Pracownik | Widzieć listę aktywnych komunikatów | Wiedzieć co jest widoczne dla klientów | Dashboard pokazuje: miniaturkę, hasło, status, datę wygaśnięcia, częstotliwość |
| **US-A03** | Pracownik | Widzieć archiwum wygasłych komunikatów | Mieć wgląd w historię komunikacji | Zakładka „Archiwum" z komunikatami wyłączonymi lub po dacie wygaśnięcia |
| **US-A04** | Pracownik | Wyłączyć aktywny komunikat jednym kliknięciem | Szybko reagować na zmiany | Toggle switch na liście zmienia status natychmiast; zmiana widoczna w czasie rzeczywistym |
| **US-A05** | Pracownik | Tworzyć nowy komunikat z hasłem i opisem | Informować klientów o nowych wydarzeniach | Formularz z polami „Hasło główne" (wymagane) i „Opis" (wymagane); walidacja przed wysłaniem |
| **US-A06** | Pracownik | Dodać grafikę miniaturkę do komunikatu | Zwiększyć atrakcyjność powiadomienia | Upload grafiki z podglądem; akceptowane: JPG, PNG, WebP, GIF; max 5 MB |
| **US-A07** | Pracownik | Ustawić czas wyświetlania komunikatu (domyślnie 7 dni) | Określić jak długo klienci będą go widzieć | Dropdown: 1 dzień, 3 dni, 1 tydzień, 2 tygodnie, 1 miesiąc, 3 miesiące |
| **US-A08** | Pracownik | Ustawić częstotliwość powiadomień (domyślnie 1×/dzień) | Kontrolować natężenie komunikacji | Dropdown: 1×, 2×, 3× dziennie; domyślnie 1× dziennie |
| **US-A09** | Pracownik | Ustawić godzinę wyświetlania (domyślnie 10:00) | Docierać do klientów o odpowiedniej porze | Time picker z domyślną wartością 10:00; format HH:MM, zgodnie z zegarem systemu klienta |
| **US-A10** | Pracownik | Włączyć/wyłączyć push notification dla komunikatu | Wybrać formę prezentacji | Toggle „Push notification" — domyślnie włączony; gdy wyłączony, komunikat tylko na liście |
| **US-A11** | Pracownik | Edytować istniejący komunikat | Poprawić treść lub zmienić ustawienia | Przycisk „Edytuj" otwiera formularz z wypełnionymi danymi; zapisanie aktualizuje komunikat |
| **US-A12** | Pracownik | Usunąć komunikat | Trwale go usunąć z systemu | Przycisk „Usuń" z dialogiem potwierdzenia; komunikat znika po zatwierdzeniu |

---

## Podsumowanie ról i uprawnień

| Rola | Logowanie | Uprawnienia |
|---|---|---|
| **Klient** | Brak (automatyczna instalacja) | Odczyt komunikatów, wyłączenie aplikacji |
| **BOK / Marketing** | E-mail firmowy (bez hasła) | Pełne zarządzanie: tworzenie, edycja, usuwanie, toggle, archiwum |
