VF SHOP FRONTEND STARTER

Files:
- login.html
- register.html
- home.html
- style.css
- auth.js

Run:
1. Keep your Spring Boot backend running on http://localhost:8080.
2. Open this folder in VS Code.
3. Use the VS Code Live Server extension and open login.html.
4. Register a new account, then login.
5. Successful login redirects to home.html. Logout returns to login.html.

Expected backend endpoints:
POST http://localhost:8080/api/auth/register
JSON: { "name": "...", "email": "...", "phone": "...", "password": "..." }

POST http://localhost:8080/api/auth/login
JSON: { "email": "...", "password": "..." }

The login API response is expected to include: id, name, email, role.
If your backend uses a different port, update API_BASE in auth.js.

IMPORTANT:
- This is a starter UI integration, not production-grade authentication.
- The current backend login response does not issue a JWT/session token.
- The demo stores only public user details in localStorage for page navigation.
- For production, add server-side session or JWT authentication and protect backend routes.
- Do not store plain-text passwords or return password hashes to the frontend.
