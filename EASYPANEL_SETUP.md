# EasyPanel Deployment Setup

## Erforderliche Environment Variables

Damit der Docker Build auf EasyPanel erfolgreich durchläuft, müssen folgende Environment Variables als **Build Arguments** UND als **Runtime Environment Variables** konfiguriert werden:

### Build Arguments (Build-Time)

Diese Variablen müssen während des Docker Builds verfügbar sein, da Next.js sie in den Client-Code einbettet:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
FIREBASE_ADMIN_CREDENTIALS
```

### Runtime Environment Variables

Diese Variable muss zur Laufzeit verfügbar sein (für Server-Side Rendering und API Routes):

```
FIREBASE_ADMIN_CREDENTIALS
```

## Werte aus .env.local

Kopiere die Werte aus der lokalen `.env.local` Datei:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCWzLcm3pkFkehiaSJ7OkBri3kNa4erP8w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seminararbeit-ws-25.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seminararbeit-ws-25
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seminararbeit-ws-25.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=615542878364
NEXT_PUBLIC_FIREBASE_APP_ID=1:615542878364:web:c23c6627a7a86a02747d59
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-JSYW3VESBZ
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCKV8SNCIn7nJMnyvbcSJWpUkoIaIXF87Y
FIREBASE_ADMIN_CREDENTIALS={"projectId":"seminararbeit-ws-25","clientEmail":"firebase-adminsdk-fbsvc@seminararbeit-ws-25.iam.gserviceaccount.com","privateKey":"-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDuiD1ffQymYLgA\\nK4ijdcufRPBLmYp5+2L+pn+oMqB7FF6R0nKVJsLXI6hf9MdYW6nKLvH9hppQmWPA\\ntw+94sreZkXtsjdgs4LZcfMiTJ/+KAyq8J6pB01BZUH/HahsEdjwMC/gnjwK1NVQ\\nsjiX5fNDiAFOsN2iQEBInprm5cfMAC589Th1TNhjYDjSGN61FFd/jVj2ZVnPX8yS\\ngBcToBcQoJtQEcsQ7BQhsogCd1ubIaH/qFo4Tbc2LM84gErG/lSqZ+kvqVPxpWSi\\nf4vQr5YqZzcrcOh+LxiFQhycZddPIEhAh1B+geXgd6IgniCPV6DhVHxo5rC7uAyr\\ncvmcjqWpAgMBAAECggEAA8PH9zK7sUEPymXlgFH2wqblhYXw/POiKHuDgom5BXRI\\n+VN5XkAIPXnJOal8/3ij5YZn6JzYIOtI2yTwhUpX8hpqYmHolJjEuQ6evCT6NfpX\\nF9gYIvoT5rM0z1ReIQWHl2PlT43jy/Z3vvAvKzuUgzV5cs7hEqNhuFuzfW81P/Od\\ne0qY6U6erKmnmNdVYG9IQG2iXb9dNXM1hcnUagyKQnk2STeUW2evSC35ucvAnqZZ\\nCwlICl+dq4QwbgM8Bbb690KUUyEfq8szfkPNv566IjdcZfS69FeWUZdsK3AL7yLn\\nHz1XwK9lWWNzzY/TYp4FR0dJS1W4PFtKcJ9yciMcgQKBgQD3uAdBSVXdxH/b8CIX\\n9/FLMikk19DzPLymjJ9e+cumECis7gbWZGEw5vx8lPhAUpeSE1rbSeW4rU6Awi4E\\n4QLeuwC01YMNBBEkNZy9VVmsLaUE+uxx+pmE2l9XgnZAy143Jwd38TRN2xQBxutT\\n3roV0C+X7WmQyjaqqDzb4MdzgQKBgQD2gZeSR8Tdx5mrngN34IUaDERrtfUGvxUg\\nJUi1aJMerSHk7xW7+JrtqFkyT0bigg7y5v5+7ILl+B7Cu9N8g5KKgqZjC60d9SDZ\\nYlMyHcocXbcPvZZV45HyyL3kCqFxaEu7fmxTrCwE6MKVzCmrwa9Lsl6SORhwk3uO\\nJkJxXXgmKQKBgQDv+0Z8BxG6cFz1s2M0GS2XjZaybKmumw6fwue6WQDjdhARx96z\\n4DcP6xZ7ks4Vcm4IQ9vnSWXVTYAZ2QRAEcR4Bm4ewiHdgC0jCRU5ju/6j5Woh3Z8\\nzSvgurVWz7rD9sDlaVgg6HmlWzG8rvrYG5PnAfK5mnSEooHnPmkHEnHnAQKBgQDr\\nQ3u5rK2DTYCofkKpIqtl1NdoRVz5d11eNLdUC959pJd4u4ZuxDJ5J/cZQPhSLfa+\\ndR/nWysC+O/Cwyhw6dHuSAss9HPg55bWYjUs26mNsROJ/lOA3ZTpthUlk8/JQNUm\\nuN4CbYwFk3BDL3uF5XC8OhxwSfW9W8TMQk+fiqmlIQKBgExlfmAQnvEYP3kyDqB5\\neJC9Uf3x0jHb1bUuWJTIz+nCYt8mGZz6PzV2ur4fCVOb3qMvLUYD8lpFOIZVS+v4\\nUgnqBpDrRJXDwG0B9lJb0tYUFqbtiDbMoNQsyIcTv4ZKObw2Xug00itfN3kSeDxN\\nw+aHiGiNvN2+Pzr3wpAZpY6D\\n-----END PRIVATE KEY-----\\n"}
```

## EasyPanel Konfiguration

### 1. Build Arguments setzen

In EasyPanel unter **Build Settings** → **Build Arguments**:
- Füge alle oben genannten Variablen als Build Arguments hinzu
- Kopiere die Werte aus der Liste oben

### 2. Runtime Environment Variables setzen

In EasyPanel unter **Environment Variables**:
- Füge `FIREBASE_ADMIN_CREDENTIALS` als Environment Variable hinzu
- Kopiere den Wert aus der Liste oben

### 3. Dockerfile verwenden

Stelle sicher, dass EasyPanel das aktualisierte Dockerfile verwendet, das die ARG Instruktionen enthält.

## Wichtige Hinweise

⚠️ **Sicherheit**: Die hier gezeigten API Keys sind für Development. Für Production sollten separate Firebase Projekte und Keys verwendet werden.

⚠️ **NEXT_PUBLIC_* Variablen**: Diese werden während des Builds in den Client-Code eingebettet und sind im Browser sichtbar. Verwende sie nur für öffentliche Informationen.

⚠️ **FIREBASE_ADMIN_CREDENTIALS**: Diese Variable enthält sensible Informationen und sollte nur server-seitig verwendet werden. Sie wird niemals an den Client gesendet.

## Troubleshooting

Falls der Build immer noch fehlschlägt:

1. Überprüfe, ob alle Build Arguments in EasyPanel korrekt gesetzt sind
2. Stelle sicher, dass keine Escape-Zeichen in den Werten fehlen (besonders bei `FIREBASE_ADMIN_CREDENTIALS`)
3. Prüfe die Build-Logs auf Fehlermeldungen bezüglich fehlender Environment Variables
4. Teste den Build lokal mit: `docker build --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=... ...`
