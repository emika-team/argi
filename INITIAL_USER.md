# Initial User Setup

## Default Login Credentials

An initial user has been created for you to access the application:

```
Email: admin@argi.local
Password: Admin123!
Role: user
```

## Creating the Initial User

If you need to recreate the initial user, run:

```bash
cd backend
npm run seed-user
```

This script will:
- Check if the user already exists (won't create duplicates)
- Create a new user with the default credentials above
- Display the credentials in the terminal

## Security Note

⚠️ **IMPORTANT**: Please change the password immediately after your first login!

The default credentials are meant for initial setup only and should not be used in production.

## Changing Your Password

After logging in, you can change your password through:
1. The user settings/profile page in the application
2. Using the password reset feature if available

## Production Deployment

For production environments:
1. Run the seed script once during initial deployment
2. Log in and change the password immediately
3. Consider implementing additional security measures like:
   - Two-factor authentication
   - Stronger password policies
   - Password rotation policies
   - Account lockout after failed attempts
