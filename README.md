# obr

Public release channel for the private Obsidian plugin **brat**.

The plugin's source lives in a private repository. Its CI pushes each
released build (`manifest.json`, `main.js`, and `styles.css` when present)
to this repository together with a version tag; the tag push triggers
[`.github/workflows/release.yml`](.github/workflows/release.yml), which
publishes a GitHub release with those files attached as individual assets —
the standard Obsidian plugin release layout, installable via the GitHub
Releases API with no token.

Nothing is developed here; files and tags are only ever written by the
plugin's release automation.
