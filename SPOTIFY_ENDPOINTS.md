# Spotify API Endpoints — ANDROMEDA Reference

> All endpoints are proxied through the Node.js server at `/api/*`.
> The server adds rate-limit retry with exponential backoff (429 handling).
> All requests require `Authorization: Bearer <access_token>` header.

---

## Authentication

### `POST /auth/token`
Exchange authorization code for tokens (PKCE flow).

**Request Body:**
```json
{
  "code": "AQD...",
  "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
  "redirect_uri": "http://127.0.0.1:3001/callback"
}
```

**Response:**
```json
{
  "access_token": "BQD...",
  "refresh_token": "AQA...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

---

### `POST /auth/refresh`
Refresh an expired access token.

**Request Body:**
```json
{
  "refresh_token": "AQA..."
}
```

**Response:**
```json
{
  "access_token": "BQD...(new)",
  "refresh_token": "AQA...(may be new or same)",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

---

## User Profile

### `GET /api/me`
Get current user's Spotify profile.

**Response:**
```json
{
  "id": "user123",
  "display_name": "John Doe",
  "email": "john@example.com",
  "country": "MX",
  "product": "premium",
  "followers": { "total": 42 },
  "images": [
    { "url": "https://i.scdn.co/image/...", "height": 300, "width": 300 }
  ]
}
```

**Used by:** Mainframe (dashboard), NavBar (avatar)

---

## Top Items

### `GET /api/me/top/artists`
Get user's top artists.

**Query params:**
| Param | Values | Default |
|-------|--------|---------|
| `time_range` | `short_term` (4 weeks), `medium_term` (6 months), `long_term` (all time) | `medium_term` |
| `limit` | 1-50 | 20 |

**Response:**
```json
{
  "items": [
    {
      "id": "6eUKZXaKkcviH0Ku9w2n3V",
      "name": "Ed Sheeran",
      "popularity": 89,
      "genres": ["pop", "singer-songwriter pop", "uk pop"],
      "images": [
        { "url": "https://i.scdn.co/image/...", "height": 640, "width": 640 }
      ],
      "followers": { "total": 102345678 }
    }
  ],
  "total": 50,
  "limit": 50,
  "offset": 0
}
```

**Key fields for analytics:**
- `genres[]` — Array of genre strings per artist. **Used by genre frequency algorithm.**
- `popularity` — 0-100 score
- `images[]` — Artist photos

**Used by:** Consumption Analytics (genre chart), Archive (artist cards)

---

### `GET /api/me/top/tracks`
Get user's top tracks.

**Query params:** Same as top artists (`time_range`, `limit`)

**Response:**
```json
{
  "items": [
    {
      "id": "7qiZfU4dY1lWllzX7mPBI3",
      "name": "Shape of You",
      "popularity": 85,
      "duration_ms": 233713,
      "explicit": false,
      "uri": "spotify:track:7qiZfU4dY1lWllzX7mPBI3",
      "artists": [
        { "id": "6eUKZXaKkcviH0Ku9w2n3V", "name": "Ed Sheeran" }
      ],
      "album": {
        "name": "÷ (Divide)",
        "release_date": "2017-03-03",
        "images": [
          { "url": "https://i.scdn.co/image/...", "height": 640, "width": 640 }
        ]
      }
    }
  ]
}
```

**Used by:** Archive (track cards/filtering)

---

## Recently Played

### `GET /api/me/player/recently-played`
Get user's recently played tracks (last ~50).

**Query params:**
| Param | Values | Default |
|-------|--------|---------|
| `limit` | 1-50 | 20 |

**Response:**
```json
{
  "items": [
    {
      "played_at": "2026-04-23T22:15:30.000Z",
      "track": {
        "id": "7qiZfU4dY1lWllzX7mPBI3",
        "name": "Shape of You",
        "duration_ms": 233713,
        "artists": [
          { "id": "6eUKZXaKkcviH0Ku9w2n3V", "name": "Ed Sheeran" }
        ],
        "album": {
          "name": "÷ (Divide)",
          "images": [
            { "url": "https://i.scdn.co/image/..." }
          ]
        },
        "uri": "spotify:track:7qiZfU4dY1lWllzX7mPBI3"
      }
    }
  ],
  "cursors": {
    "after": "1682371530000",
    "before": "1682285130000"
  }
}
```

**Key fields for analytics:**
- `played_at` — ISO 8601 timestamp. **Used by hourly activity algorithm.**
- `track.id` — For counting most repeated tracks
- `track.artists[]` — For finding dominant artist

**Used by:** Consumption Analytics (activity chart, metrics), Mainframe (signal log)

---

## Playback Control

### `GET /api/me/player`
Get current playback state.

**Response:**
```json
{
  "device": {
    "id": "abc123",
    "name": "ANDROMEDA // Neural Interface",
    "type": "Computer",
    "volume_percent": 50
  },
  "is_playing": true,
  "progress_ms": 45000,
  "item": { "...track object..." }
}
```

**Used by:** SpotifyPlayer component

---

### `PUT /api/me/player/play`
Start/resume playback.

**Query params:** `device_id` (optional)

**Request Body:**
```json
{
  "uris": ["spotify:track:7qiZfU4dY1lWllzX7mPBI3"]
}
```

**Response:** `204 No Content` on success

---

### `PUT /api/me/player`
Transfer playback to a device.

**Request Body:**
```json
{
  "device_ids": ["abc123"],
  "play": true
}
```

**Response:** `204 No Content` on success

---

## Playlists

### `POST /api/users/:userId/playlists`
Create a new playlist.

**Request Body:**
```json
{
  "name": "ANDROMEDA // Filtered — 6_MONTHS",
  "description": "Auto-generated playlist",
  "public": true
}
```

**Response:**
```json
{
  "id": "playlist123",
  "name": "ANDROMEDA // Filtered — 6_MONTHS",
  "external_urls": { "spotify": "https://open.spotify.com/playlist/..." }
}
```

---

### `POST /api/playlists/:playlistId/tracks`
Add tracks to a playlist.

**Request Body:**
```json
{
  "uris": [
    "spotify:track:7qiZfU4dY1lWllzX7mPBI3",
    "spotify:track:0tgVpDi06FyKpA1z0VMD4v"
  ]
}
```

**Response:**
```json
{
  "snapshot_id": "abc123..."
}
```

---

## Multiple Artists (Batch)

### `GET /api/artists?ids=id1,id2,...`
Get details for multiple artists at once (max 50 IDs).

**Response:**
```json
{
  "artists": [
    {
      "id": "6eUKZXaKkcviH0Ku9w2n3V",
      "name": "Ed Sheeran",
      "genres": ["pop", "singer-songwriter pop"],
      "popularity": 89,
      "images": [...]
    }
  ]
}
```

> ⚠ **Note:** This endpoint is useful for getting genre data when you only have artist IDs (e.g., from track objects that don't include genres).

---

## Audio Features (Deprecated for new apps)

### `GET /api/audio-features?ids=id1,id2,...`
Get audio analysis features for tracks.

**Response:**
```json
{
  "audio_features": [
    {
      "id": "7qiZfU4dY1lWllzX7mPBI3",
      "danceability": 0.825,
      "energy": 0.652,
      "valence": 0.931,
      "acousticness": 0.581,
      "instrumentalness": 0.0,
      "liveness": 0.0931
    }
  ]
}
```

> ⚠ **Warning:** This endpoint returns `403 Forbidden` for apps created after Nov 2024. The Consumption Analytics page does NOT use this endpoint.

---

## Rate Limits

| Scenario | Behavior |
|----------|----------|
| Normal usage | ~180 requests / minute |
| 429 response | Server retries with exponential backoff (`Retry-After` header) |
| Vite HMR (dev) | Can trigger multiple rapid requests — use dev cache strategy |

### Anti-429 Strategy (Development)
The `Consumption_Analytics` page caches API responses in `sessionStorage` for 2 minutes during development (`import.meta.env.DEV`). This prevents Vite's Hot Module Replacement from hitting the API on every code save.

---

## Scopes Required

```
streaming
user-read-playback-state
user-modify-playback-state
user-top-read
user-read-recently-played
playlist-modify-public
playlist-modify-private
user-read-email
user-read-private
```
