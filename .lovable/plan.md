# Fix Lovable thumbnail in shared links

When the site link is shared on SMS, iMessage, WhatsApp, or social apps, the preview image shown is Lovable's default artwork. That is because `index.html` explicitly points the social preview tags at a Lovable-hosted image:

```
<meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
<meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
```

Crawlers use exactly that URL, so every shared link renders Lovable branding.

## What to change

1. Create a branded 1200x630 social preview image for Prosperity Financial (dark green brand color, "PF" mark, app name, and a short tagline such as "Financial Risk Assessment & Tax-Free Retirement Planning"). Save it to `public/og-image.jpg`.
2. Point `og:image` and `twitter:image` at the absolute URL on the live custom domain: `https://theprosperityfinancial.com/og-image.jpg`, and add `og:image:width` / `og:image:height`.
3. Align the rest of the head metadata with the real brand, which currently still says "Smart Risk Analyzer":
   - `<title>`: Prosperity Financial — Financial Risk Assessment
   - `meta description`, `og:title`, `og:description`, `og:url`, `og:site_name`, `twitter:title`, `twitter:description`
   - add `<link rel="canonical" href="https://theprosperityfinancial.com/" />`
4. Republish so the new image and tags are live at the domain.

## Notes

- The preview only updates after the sharing platform re-scrapes the link. Messaging apps cache aggressively, so an already-shared link may keep showing the old thumbnail for a while. Sharing the URL with a `?v=2` suffix, or using Facebook's / LinkedIn's link preview debugger, forces a refresh.
- This is a static Vite SPA, so one site-wide preview image applies to every route; per-page previews would need SSR.
