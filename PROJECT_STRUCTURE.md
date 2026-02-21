# Project Structure

```
operator/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── services/
│   │   └── openrouter_client.py
│   └── routers/
│       └── openrouter.py
├── frontend/
├── README.md
└── DEPLOYMENT.md
```

## Backend API Surface

Only one route exists:
- `POST /api/openrouter`

All previous provider-specific routes and integrations were removed.
