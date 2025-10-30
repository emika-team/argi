# Cloudflare Authentication Guide

This application supports two methods of authenticating with Cloudflare's API:

## Option 1: API Token (Recommended)

API Tokens are the recommended method as they provide more granular permissions and better security.

### Creating an API Token:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Choose **Custom Token** or use the **Read all resources** template
5. Set the following permissions:
   - **Zone** → **Zone** → **Read**
   - **Zone** → **DNS** → **Read** (optional, for DNS records)
6. Configure **Zone Resources**:
   - Select **Include** → **All zones** (or specific zones)
7. Click **Continue to summary** → **Create Token**
8. Copy the token (you won't be able to see it again!)

### Using API Token:

- **Email**: Leave blank or omit
- **API Token/Key**: Paste your API token

The system automatically detects API tokens (typically longer than 40 characters) and uses Bearer authentication.

## Option 2: Global API Key

The Global API Key provides full access to your Cloudflare account and should be used with caution.

### Getting your Global API Key:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **My Profile** → **API Tokens**
3. Scroll down to **API Keys** section
4. Click **View** next to **Global API Key**
5. Enter your password to reveal the key

### Using Global API Key:

- **Email**: Your Cloudflare account email
- **API Token/Key**: Your Global API Key

## How the System Detects Authentication Method

The system automatically determines which authentication method to use:

- **API Token**: If email is empty/blank OR the key length > 40 characters
  - Uses `Authorization: Bearer <token>` header
  - Validates using `/user/tokens/verify` endpoint

- **Global API Key**: If email is provided AND key length ≤ 40 characters
  - Uses `X-Auth-Email` and `X-Auth-Key` headers
  - Validates using `/user` endpoint

## Required Permissions

For the domain import feature to work, you need at minimum:

- **Zone:Read** permission to list and read zone information
- If you want to import DNS records in the future, you'll also need **DNS:Read**

## Troubleshooting

### "Invalid Cloudflare credentials" error

1. **For API Token**:
   - Ensure the token has **Zone:Read** permission
   - Check that the token includes the zones you want to import
   - Verify the token hasn't expired
   - Leave the email field blank

2. **For Global API Key**:
   - Verify you're using the correct email address
   - Make sure you copied the entire API key
   - The key should be exactly 37 characters long

### "Failed to fetch domains" error

- Ensure your API token has permission to access the zones
- Check that you have zones configured in your Cloudflare account
- Verify your token hasn't been revoked

## Security Best Practices

1. **Use API Tokens** instead of Global API Key when possible
2. **Limit permissions** to only what's needed (Zone:Read)
3. **Set expiration dates** for tokens
4. **Use IP restrictions** if accessing from a fixed IP
5. **Rotate tokens regularly**
6. **Never commit tokens** to version control
7. **Revoke unused tokens** immediately
