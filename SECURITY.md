# Sicherheit

## Sicherheitslücken melden

Bitte melde vermutete Sicherheitslücken **nicht** über öffentliche Issues, sondern über ein
[GitHub Security Advisory](https://github.com/Bladeage/allkauf-helper/security/advisories/new)
(privat). Wir bemühen uns um eine zeitnahe Rückmeldung.

## Unterstützte Versionen

Unterstützt wird jeweils die neueste Version (`latest` bzw. der jüngste `v*`-Tag).

## Betriebs-Empfehlungen

- **`JWT_SECRET`** lang und geheim halten (`openssl rand -base64 48`) — daraus wird auch der
  AES-Schlüssel der 2FA-Secrets abgeleitet. Eine Rotation meldet alle Sessions ab; bestehende
  2FA-Nutzer verifizieren danach nur noch per Recovery-Code und müssen 2FA neu einrichten.
- **HTTPS-Reverse-Proxy** davorschalten und **`TRUST_PROXY`** passend setzen (`1` ohne, `2` mit
  eigenem Proxy) — sonst greifen die Rate-Limits nicht zuverlässig.
- **Zwei-Faktor-Authentisierung** in den Einstellungen aktivieren; Recovery-Codes sicher ablegen.
- **Regelmäßige Backups** ziehen (siehe README → Backup & Restore), insbesondere vor Updates.
- Zugang zusätzlich hinter eine **Access-List (Basic Auth)** und **fail2ban** legen, wenn öffentlich erreichbar.
