# Email Templates

Professional HTML email templates for transactional emails.

## Templates

### `client-invitation.html`
Sent when a client is invited to the portal. Uses template variables:

| Variable | Description |
|---|---|
| `{{APP_NAME}}` | Application name (from theme config) |
| `{{CLIENT_NAME}}` | The client organization name |
| `{{CLIENT_EMAIL}}` | Recipient email address |
| `{{INVITATION_LINK}}` | Full invitation URL |
| `{{SUPPORT_EMAIL}}` | Support contact email |
| `{{COPYRIGHT_YEAR}}` | Current year |

## Design

- Dark theme matching the app brand (emerald green accent)
- Responsive layout
- Accessible markup with proper `role="presentation"` tables
- All template variables are injected server-side via `src/lib/email.ts`
