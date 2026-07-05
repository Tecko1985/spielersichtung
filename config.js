const APP_VERSION = "1.4";

const APP_CHANGELOG = [
  {
    version: "1.4",
    groups: [
      {
        title: "Navigation",
        items: [
          "Der Tab „Einstellungen“ zeigt jetzt zusätzlich die aktuelle Versionsnummer direkt am Tab-Reiter an."
        ]
      }
    ]
  },
  {
    version: "1.3",
    groups: [
      {
        title: "Navigation",
        items: [
          "Der Tab „Einstellungen“ ist jetzt sichtbar von den übrigen Tabs abgesetzt (rechtsbündig in der Tab-Leiste), wie in der Tools-Übersicht."
        ]
      }
    ]
  },
  {
    version: "1.2",
    groups: [
      {
        title: "Navigation",
        items: [
          "„Zurück zum Dashboard“ ist jetzt ein Button direkt in der blauen Kopfzeile (mittig), statt eines separaten Links darüber."
        ]
      }
    ]
  },
  {
    version: "1.1",
    groups: [
      {
        title: "Navigation",
        items: [
          "Link „Zurück zum Dashboard“ oben auf der Seite ergänzt (Öffnen erfolgt jetzt im selben Tab statt in einem neuen)."
        ]
      }
    ]
  },
  {
    version: "1.0",
    groups: [
      {
        title: "Spieler-Sichtungen",
        items: [
          "Liste aller gesichteten Nachwuchsspieler mit Suche und Filtern (Verein, Position, Status, Zuständigkeit).",
          "Detailformular je Spieler: Person, Stützpunkt, Scouting-Einschätzung, Kontaktverlauf, Probetraining & Wechsel-Entscheidung.",
          "Automatisch berechneter Status-Badge (Neu gesichtet / Kontakt läuft / Probetraining bestätigt / Gewechselt / Kein Wechsel).",
          "Datum der letzten Bearbeitung wird automatisch gesetzt, kein manuelles Nachtragen mehr nötig."
        ]
      },
      {
        title: "Vereinsverzeichnis",
        items: [
          "Kontaktdaten gescouteter Vereine (Adresse, Website, mehrere Ansprechpartner je Verein)."
        ]
      },
      {
        title: "Datenübernahme",
        items: [
          "Einmaliger Import der bestehenden Scouting-Excel-Liste (82 Spieler, 13 Vereine) per Knopfdruck — der Ablageordner in der Nextcloud wird dabei automatisch angelegt."
        ]
      },
      {
        title: "Anmeldung & Speicherung",
        items: [
          "Automatische Nextcloud-Synchronisierung über die zentrale Anmeldung (Tools-Übersicht) — kein separates Passwort auf dem Gerät nötig.",
          "Sichtbare Rückmeldung im Kopfbereich, ob Änderungen gespeichert wurden; gleichzeitige Änderungen von zwei Geräten werden erkannt und gemeldet."
        ]
      }
    ]
  }
];
