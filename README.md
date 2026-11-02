# Rhythm Lab — Personal Rhythm Trainer

A local, browser-based rhythm practice tool built with plain HTML, CSS and JavaScript.

## Run it

1. Extract `rhythm-lab.zip` (or open the project folder).
2. Open `index.html` in Chrome, Edge, Firefox or another modern browser.
3. Press **Play rhythm** to hear the generated example.

No installation, server, account, external libraries or audio downloads are required.

## Features

- **Mode A — Listen & recreate:** hear a generated rhythm and enter it using the note/rest palette.
- **Mode B — Read & identify:** compare four written rhythm choices and listen to their audio.
- Adjustable tempo from 40–200 BPM.
- Beginner, Intermediate and Advanced generation settings.
- 2/4, 3/4, 4/4 and 6/8 meter settings.
- Optional triplets and syncopation.
- Synthesised audio using the Web Audio API.
- Simplified SVG rhythm notation.

## Project structure

```text
rhythm_trainer/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    ├── app.js
    ├── audioEngine.js
    ├── notation.js
    └── rhythmGenerator.js
```

## Editing it

- `index.html` — page structure and labels.
- `css/style.css` — colours, spacing, layout and responsive styling.
- `js/rhythmGenerator.js` — rhythm generation rules and difficulty pools.
- `js/audioEngine.js` — sound synthesis and playback.
- `js/notation.js` — SVG rhythm notation renderer.
- `js/app.js` — modes, controls, answer checking and UI behaviour.

## Notes / limitations

This is a first working version intended as a foundation to customise. The notation renderer is a simplified single-line rhythm staff, not a complete music engraving engine. The generator uses quarter-note beat durations; 6/8 is currently represented as three dotted-quarter-style beats for exercise timing. The triplet button adds one third of a quarter-note beat per click (three clicks fill one quarter-note beat). The current answer checker compares the entered event sequence exactly, including rests.

Audio begins after a user interaction because browsers restrict autoplay. Headphones are recommended.
