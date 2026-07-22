const APP_VERSION = "1.0";

// Konfigurierbarer CSV-Export der Spieler-Liste (siehe initExportPanel/exportSpielerCsv
// in app.js): jedes Feld einzeln per Checkbox an-/abwählbar, gruppiert wie das Spieler-
// Formular (gleiche Sektionstitel). "type" steuert nur die Formatierung des Zellwerts
// (exportFieldValue in app.js) — ohne "type" wird der Rohwert unverändert exportiert.
// Bewusst ohne "id" (interne UUID, keine Tabellenaussage).
const EXPORT_FIELD_GROUPS = [
  {
    title: "Person",
    fields: [
      { key: "nachname", label: "Nachname" },
      { key: "vorname", label: "Vorname" },
      { key: "geschlecht", label: "Geschlecht", type: "geschlecht" },
      { key: "geburtsdatum", label: "Geburtsdatum" },
      { key: "verein", label: "Verein" },
      { key: "position", label: "Position" },
      { key: "trikotnummer", label: "Trikotnummer" },
      { key: "passnummer", label: "Passnummer" }
    ]
  },
  {
    title: "Stützpunkt",
    fields: [
      { key: "stuetzpunktSpieler", label: "Ist Stützpunktspieler", type: "bool" },
      { key: "stuetzpunkt", label: "Stützpunkt" }
    ]
  },
  {
    title: "Scouting",
    fields: [
      { key: "sichtungDurch", label: "Sichtung durch" },
      { key: "bemerkungen", label: "Bemerkungen" }
    ]
  },
  {
    title: "Kontaktverlauf",
    fields: [
      { key: "zustaendigkeit", label: "Zuständigkeit" },
      { key: "kontaktDurchWen", label: "Kontakt durch wen?" },
      { key: "kontaktMitVerein", label: "Kontakt mit Verein" },
      { key: "kontaktMitEltern", label: "Kontakt mit Eltern" },
      { key: "rueckinfoNachEinladung", label: "Rückinfo nach der Einladung" }
    ]
  },
  {
    title: "Probetraining & Entscheidung",
    fields: [
      { key: "probetrainingAm", label: "Probetraining am" },
      { key: "zusageProbetraining", label: "Zusage Probetraining" },
      { key: "wechsel", label: "Wechsel" },
      { key: "letzteBearbeitung", label: "Letzte Bearbeitung", type: "dateonly" }
    ]
  }
];

const APP_CHANGELOG = [
  {
    version: "1.0",
    groups: [
      {
        title: "Spieler-Sichtungen",
        items: [
          "Liste aller gesichteten Nachwuchsspieler mit Suche und Filtern (Verein, Position, Status, Zuständigkeit).",
          "Detailformular je Spieler: Person, Stützpunkt, Scouting-Einschätzung, Kontaktverlauf, Probetraining & Wechsel-Entscheidung.",
          "\"Sichtung durch\" und \"Zuständigkeit\" werden bei einem neuen Spieler automatisch mit dem eigenen Namen vorbelegt, bleiben aber änderbar.",
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
        title: "CSV-Export",
        items: [
          "Konfigurierbarer CSV-Export der Spieler-Liste – jedes Feld (Person, Stützpunkt, Scouting, Kontaktverlauf, Probetraining & Entscheidung) einzeln per Checkbox wählbar, berücksichtigt die aktuelle Such-/Filter-Einstellung."
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
          "Sichtbare Rückmeldung im Kopfbereich, ob Änderungen gespeichert wurden; gleichzeitige Änderungen von zwei Geräten werden erkannt und gemeldet.",
          "Speichern startet ohne Verzögerung. Wird die Seite geschlossen, bevor die Bestätigung da ist, geht der Stand trotzdem noch raus — und es kommt eine Rückfrage, falls das einmal nicht mehr möglich sein sollte."
        ]
      }
    ]
  }
];
