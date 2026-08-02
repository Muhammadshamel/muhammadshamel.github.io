# Portfolio Analytics

Production analytics are enabled only in `docs/index.html`.
The local editor does not load Google Analytics or Microsoft Clarity.

## Services

- Google Analytics 4 measurement ID: `G-M8ZXN0602X`
- Microsoft Clarity project ID: `xvm2myrajs`

## Files

- `docs/index.html` loads the GA4 and Clarity base tags.
- `docs/js/analytics.js` contains custom event tracking.

## Tracked events

| Event | Trigger | Key parameters |
|---|---|---|
| `download_cv` | Download CV click | `file_name`, `link_text` |
| `linkedin_click` | LinkedIn click | `link_location`, `link_url` |
| `email_click` | Email click | `link_location` |
| `engagement_open` | Engagement row opened | `engagement_name`, `engagement_category`, `engagement_index` |
| `view_engagements_click` | Hero engagement CTA | `link_location`, `link_text` |
| `navigation_click` | Main navigation link | `destination_section`, `link_text` |
| `section_view` | A page section becomes visible | `section_name` |
| `scroll_depth` | 25%, 50%, 75%, 100% scroll | `percent_scrolled` |
| `time_on_page` | 30, 60, 120 seconds | `seconds_elapsed` |
| `campaign_landing` | A URL contains UTM parameters | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` |

The same event names are also sent to Microsoft Clarity as custom events.

## Verification

1. Deploy the `docs` folder through GitHub Pages.
2. Open the live website in an incognito browser window.
3. In GA4, open **Reports > Realtime** and confirm an active user and events.
4. In Clarity, open the project dashboard. Recordings can take a few minutes to appear.
5. Test the CV, LinkedIn, email, and engagement buttons.

## Campaign links

Example LinkedIn URL:

`https://muhammadshamel.github.io/?utm_source=linkedin&utm_medium=post&utm_campaign=portfolio_launch`

Example email-signature URL:

`https://muhammadshamel.github.io/?utm_source=email&utm_medium=signature&utm_campaign=portfolio`

## Privacy note

GA4 and Clarity collect usage data from production visitors. Depending on the countries you target and your chosen configuration, consider adding a short privacy notice and consent mechanism.
