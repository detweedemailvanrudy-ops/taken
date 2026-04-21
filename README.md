# Takkie — PWA Takenapp

Kleurrijke takenapp met subtaken en sub-subtaken. Werkt offline als PWA.

## Bestanden

```
takkie/
├── index.html      ← Hoofd HTML
├── style.css       ← Alle stijlen
├── app.js          ← App logica + service worker registratie
├── sw.js           ← Service worker (offline support)
├── manifest.json   ← PWA manifest
├── icon-192.png    ← App icoon (zelf toevoegen, zie hieronder)
└── icon-512.png    ← App icoon groot (zelf toevoegen)
```

## Iconen aanmaken

Je hebt twee PNG-iconen nodig. Makkelijkste manier:

1. Ga naar https://favicon.io/favicon-generator/
2. Kies tekst: **T**, achtergrond: #D85A30, afgerond
3. Download en hernoem naar `icon-192.png` en `icon-512.png`

Of gebruik een afbeelding naar keuze (minimaal 512×512 px).

## Online zetten (gratis)

### Netlify (aanbevolen, makkelijkst)
1. Maak een account op https://netlify.com
2. Sleep de hele `takkie/` map naar het Netlify dashboard
3. Je krijgt direct een URL zoals `https://takkie-abc123.netlify.app`
4. Open die URL in Chrome op je Moto G72

### GitHub Pages
1. Maak een GitHub account + nieuw repository
2. Upload alle bestanden
3. Ga naar Settings → Pages → Deploy from main branch
4. URL wordt `https://<jouwusername>.github.io/<reponame>/`

## Installeren op Moto G72

1. Open de URL in **Chrome**
2. Tik op de **drie puntjes** (rechtsboven)
3. Kies **"Toevoegen aan startscherm"** (of "App installeren")
4. Tik op **Toevoegen**

De app staat nu als icoon op je startscherm en werkt ook zonder internet!

## Functies

- ✅ Taken aanmaken met kleurlabel
- ✅ Taken opdelen in subtaken
- ✅ Subtaken opdelen in sub-subtaken
- ✅ Voortgangsbalk per taak
- ✅ Filter: Alle / Actief / Klaar
- ✅ Alles werkt offline (service worker)
- ✅ Data opgeslagen in localStorage (blijft bewaard)
