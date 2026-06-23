# Public Site Deployment

The public legal/support site is deployed from the static `site/` directory.

## Production

- Vercel project: `site`
- Vercel production URL: `https://site-gamma-black-80.vercel.app`
- Intended primary domain: `https://relaxbutton.melnyklabs.com`
- Required Play Console URLs:
  - Privacy Policy: `https://relaxbutton.melnyklabs.com/privacy`
  - Terms of Use: `https://relaxbutton.melnyklabs.com/terms`
  - Support: `https://relaxbutton.melnyklabs.com/support`

## DNS

The domains are already added to the Vercel project, but the DNS provider must point them to Vercel.

Recommended DNS records:

```text
A     relaxbutton     76.76.21.21
```

After DNS propagation, verify:

```sh
curl -I https://relaxbutton.melnyklabs.com/privacy
curl -I https://relaxbutton.melnyklabs.com/terms
curl -I https://relaxbutton.melnyklabs.com/support
```

Each command should return `HTTP/2 200`.

## Security

`site/vercel.json` enables clean URLs and static security headers:

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

The site is static and does not require environment variables, server-side code, databases, analytics, or tracking scripts.
