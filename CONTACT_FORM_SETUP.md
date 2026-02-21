# Contact Form Setup Guide

## Overview
Your contact form is now fully functional with multiple storage options:
1. **Local Storage** (automatic, works immediately)
2. **GitHub Repository** (optional, requires token)
3. **Email Notification** (optional, via Formspree)

## How It Works

### Basic Functionality (No Setup Required)
- Form submissions are automatically saved to browser localStorage
- Access submissions via [contact-admin.html](/contact-admin.html)
- Export submissions as JSON file anytime
- Works offline and requires no external services

### GitHub Integration (Optional)

To automatically save submissions to your GitHub repository:

#### Step 1: Create GitHub Personal Access Token
1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens/new)
2. Click "Generate new token (classic)"
3. Configure:
   - **Note**: "Contact Form Submissions"
   - **Expiration**: Choose duration (90 days recommended)
   - **Scopes**: Check `repo` (full repo access)
4. Click "Generate token"
5. **Copy the token immediately** (shown only once)

#### Step 2: Configure Token
1. Visit [contact-admin.html](/contact-admin.html)
2. Paste token in "GitHub Integration" section
3. Click "Save Token"

Now all form submissions will be automatically committed to `/contact-submissions/` folder as JSON files.

### Email Notifications (Optional)

To receive email notifications for each submission:

#### Using Formspree (Free Tier)
1. Sign up at [formspree.io](https://formspree.io) (free tier: 50 submissions/month)
2. Create a new form
3. Copy your Form ID (looks like: `abc123xyz`)
4. Edit `contact-handler.js`:
   ```javascript
   const FORMSPREE_ID = 'YOUR_FORMSPREE_ID'; // Replace with actual ID
   ```
5. Commit and push changes

## Admin Panel Features

Access [contact-admin.html](/contact-admin.html) to:

- **View All Submissions**: See all form submissions with timestamps
- **Export as JSON**: Download all submissions for backup/analysis
- **Copy Individual Submissions**: Copy specific submissions as JSON
- **Load from GitHub**: Sync submissions from repository
- **View Statistics**: Total, today, and weekly submission counts
- **Clear Data**: Remove submissions from localStorage

## File Structure

```
/
├── contact-handler.js          # Form submission logic
├── contact-admin.html          # Admin panel
├── contact-submissions/        # Stored submissions (when using GitHub integration)
│   ├── submission-1234567.json
│   └── submission-7654321.json
└── index.html                  # Contact form
```

## Submission Data Format

Each submission is stored as JSON:

```json
{
  "timestamp": "2026-02-21T10:30:00.000Z",
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Project inquiry about...",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://..."
}
```

## Security Notes

- GitHub token is stored in browser localStorage (client-side only)
- Admin panel includes `noindex` meta tag
- Consider adding password protection for admin panel if needed
- Never commit your GitHub token to the repository

## Troubleshooting

### Submissions not saving to GitHub
- Check if GitHub token is configured in admin panel
- Verify token has `repo` scope permissions
- Check browser console for error messages
- Ensure `/contact-submissions/` folder exists in repository

### Form not submitting
- Check browser console for JavaScript errors
- Ensure `contact-handler.js` is loaded
- Verify form fields have correct `name` attributes

### Can't access admin panel
- Ensure you're on the same browser where submissions were made
- Check if localStorage is enabled in browser settings

## Export and Backup

Regular backups recommended:
1. Visit [contact-admin.html](/contact-admin.html)
2. Click "Export JSON"
3. Save file to secure location

## Privacy Compliance

The contact form collects:
- Name, email, message (user-provided)
- Timestamp (automatic)
- User agent and referrer (automatic)

Consider adding privacy policy link near form if required by local regulations (GDPR, etc.).

## Advanced Configuration

### Customize Formspree Integration
Edit `contact-handler.js` line ~94:
```javascript
const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';
```

### Change Notification Duration
Edit `contact-handler.js` line ~140:
```javascript
setTimeout(() => { /* ... */ }, 5000); // 5 seconds, adjust as needed
```

### Modify Submission Storage
Edit `contact-handler.js` `STORAGE_KEY` (line 7):
```javascript
this.STORAGE_KEY = 'contact_submissions'; // Change if needed
```

## Support

For issues or questions:
- Check browser console for errors
- Review [contact-handler.js source](contact-handler.js)
- Email: barkotullahopu@gmail.com
