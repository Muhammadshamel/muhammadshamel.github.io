# GA4 Key Events and Engagement Tracking

The production analytics now sends the following intent events to both Google Analytics 4 and Microsoft Clarity.

## Primary intent events

- `download_cv`
- `email_click`

In GA4, mark these two events as **Key events** after they have appeared at least once:

1. Open **Admin**.
2. Go to **Data display > Events**.
3. Find `download_cv` and `email_click`.
4. Turn on **Mark as key event**.

This GA4 setting is managed in the Analytics property and cannot be enabled by static website code alone.

## Secondary intent events

- `linkedin_click`
- `engagement_open`
- `view_banking_transformation`
- `view_cloud_modernization`
- `view_regional_platform`
- `view_operational_excellence`

Each dedicated engagement event also includes:

- `engagement_name`
- `engagement_category`
- `engagement_index`

The generic `engagement_open` event is retained so all engagement opens can still be analysed together.

## Validation

After deployment:

1. Open the production website in an Incognito window with blockers disabled.
2. Open each engagement once.
3. Click LinkedIn, Email, and Download CV.
4. Check **GA4 > Reports > Realtime** for the event names.
5. Check **Clarity > Recordings** and custom events after processing.

Regular GA4 event reports can take longer than Realtime to populate.
