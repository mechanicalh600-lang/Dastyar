# Museum hardening test matrix

The hardening release is acceptable only when these historical behaviors remain intact:

1. Login with an existing normal user.
2. Login with a default-password user and complete forced password change.
3. Load dashboard and existing modules after login.
4. Create and read a representative work order.
5. Admin password reset remains functional for authorized admins.
6. Logout removes client access to the museum session.
7. Anonymous requests cannot enumerate users or application tables.
8. Legacy public helper functions cannot be used to inspect or query the database.
9. No intentional CSS, layout, label, branding, or navigation changes.
