# Student Management System — Full-Stack CRUD Application

A complete CRUD web application built per the attached SOP, using the
recommended stack: **HTML/CSS/JavaScript** frontend, **Django REST
Framework** backend, and a **SQLite** database.

```
student-management-system/
├── backend/                  Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── sms_backend/          Project settings, URLs, WSGI/ASGI
│   └── students/             App: model, serializer, viewset, admin, urls
└── frontend/                 Plain HTML/CSS/JS client (no build step)
    ├── index.html
    ├── style.css
    └── app.js
```

## 1. Entity: Student

| Field      | Type        | Rules                                      |
|------------|-------------|---------------------------------------------|
| name       | string      | required                                     |
| email      | string      | required, valid email, unique                |
| age        | integer     | required, 15–100                             |
| course     | choice      | one of CSE, ECE, MECH, CIVIL, IT, MBA        |
| phone      | string      | optional, 7–15 digits, optional leading `+`  |

Validation is enforced **both** client-side (`app.js`) and server-side
(`students/serializers.py`, `students/models.py`), per SOP section 9.

## 2. Setup & Run

### Backend (Django REST API)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate        # creates db.sqlite3 and applies schema
python manage.py createsuperuser  # optional, for /admin/
python manage.py runserver      # starts at http://localhost:8000
```

### Frontend (HTML/CSS/JS)

No build step needed. Either:

- Open `frontend/index.html` directly in a browser, **or**
- Serve it locally (recommended, avoids some browsers' `file://` fetch quirks):

```bash
cd frontend
python -m http.server 5500
# then visit http://localhost:5500
```

The frontend calls the API at `http://localhost:8000/api/students/`
(configurable at the top of `app.js`). CORS is already enabled on the
backend for local development.

## 3. REST API Reference

| Operation | Method | Endpoint                  | Body / Notes                          |
|-----------|--------|----------------------------|----------------------------------------|
| Create    | POST   | `/api/students/`           | JSON: name, email, age, course, phone |
| Read all  | GET    | `/api/students/`           | Optional `?search=` and `?course=`    |
| Read one  | GET    | `/api/students/{id}/`      | —                                      |
| Update    | PUT/PATCH | `/api/students/{id}/`   | Full (PUT) or partial (PATCH) update  |
| Delete    | DELETE | `/api/students/{id}/`      | Returns 200 with confirmation message |

Example (create):

```bash
curl -X POST http://localhost:8000/api/students/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Rao","email":"asha@example.com","age":21,"course":"CSE","phone":"+919876543210"}'
```

Django admin (browse/edit records directly): `http://localhost:8000/admin/`

## 4. Testing (SOP section 10)

The CRUD logic and validation were verified with Django's REST framework
test client, covering:

- Create with valid data → `201 Created`
- Create with invalid age (out of 15–100 range) → `400 Bad Request`
- Create with duplicate email → `400 Bad Request`
- Read all / read one
- Partial update (PATCH) → reflected in response and `updated_at`
- Search by name/email/phone via `?search=`
- Delete → `200 OK`, record removed from subsequent list

To re-run these checks yourself, import Postman's collection manually by
hitting the endpoints above, or write a `tests.py` in the `students` app
using `rest_framework.test.APIClient` (a good next step for CI).

## 5. Security & Quality Notes (SOP section 11)

- `SECRET_KEY` is read from an environment variable in production
  (`DJANGO_SECRET_KEY`), with a dev-only fallback.
- All DB access goes through Django's ORM (parameterized, no raw SQL).
- Server-side validation is enforced independently of the client.
- `DEBUG = True` and `CORS_ALLOW_ALL_ORIGINS = True` are for local
  development only — turn these off and set `ALLOWED_HOSTS` properly
  before deploying.

## 6. Possible Future Enhancements

- Add authentication (e.g. JWT via `djangorestframework-simplejwt`) so
  only logged-in staff can modify records.
- Add pagination controls and sorting in the frontend UI.
- Containerize with Docker Compose (backend + frontend + Postgres).
- Add automated `tests.py` and wire up GitHub Actions CI.
