# Discogs Watcher

A small React + Vite app that lets you **track Discogs releases** and quickly see:

- the **cover art**,
- the **number of copies for sale**,
- the **lowest price** (in USD),
- and a direct link to the Discogs release.

You can maintain your own watchlist of releases and refresh it any time.  
IDs are stored in **LocalStorage**, so your list persists between sessions.

---

## Features

- Add releases by **ID** or by pasting a full Discogs release URL.
- Persistent watchlist (stored locally).
- Show cover art thumbnail, artist + title, for-sale count, lowest price, and link.
- Manual refresh button to fetch the latest data.
- Sorting (lowest price, for sale count, artist, ID).
- Filter: show only releases that are currently for sale.
- Dark mode UI.

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/discogs-watcher.git
cd discogs-watcher
npm install
```

### 2. Environment variable

Create a `.env` file in the project root:

```
VITE_DISCOGS_TOKEN=your_discogs_token_here
```

> You can generate a token in your [Discogs account settings](https://www.discogs.com/settings/developers).  
> The app uses this token to authenticate requests to the Discogs API.

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Screenshot

![Alt text](/public/image.png)
