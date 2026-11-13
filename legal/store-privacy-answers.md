# Store privacy answers

Answers for the App Store "App Privacy" questions and the Google Play "Data safety" form, based on what the app does on 13 November 2026 and on legal/privacy-policy.md. Update both whenever the app starts collecting something new. AI Smart Reviews (13 November 2026) use the subscription data already listed under Financial info, plus the phone's time zone, which neither store counts as location, so no answer changed.

Before you submit:
- **PostHog location.** PostHog works out an approximate location from the IP address. To drop it, turn on "Discard client IP data" in PostHog → Project settings, then answer "No" to coarse/approximate location below. The answers below assume you keep it.
- **Account deletion link (Google Play).** Play requires a web page where people can ask for their account to be deleted without reinstalling the app. Until the landing page has one, it can say: email cleveraph@gmail.com from your account's address, or use Settings > Delete account in the app.
- **Privacy policy URL.** Both stores need the public URL of legal/privacy-policy.md.

## App Store (App Store Connect → App Privacy)

**Do you or your third-party partners collect data from this app?** Yes.

**Tracking:** No. Recurvo has no ads, doesn't share data with data brokers, and doesn't link its data with other companies' data for advertising. No App Tracking Transparency prompt is needed.

For each data type: **Linked to the user = Yes**, **Used for tracking = No**.

| Data type (Apple's category) | What it is in Recurvo | Purposes to tick |
|---|---|---|
| Contact Info → Name | First and last name at sign-up | App Functionality |
| Contact Info → Email Address | Sign-in email | App Functionality |
| User Content → Photos or Videos | Optional profile photo | App Functionality |
| Financial Info → Other Financial Info | Subscriptions (names, amounts, cycles, renewal dates), card name, last 4 digits and type, and statements read to find them | App Functionality |
| Identifiers → User ID | Clerk account ID, also used to link analytics events | App Functionality, Analytics |
| Usage Data → Product Interaction | Screen views and events such as adding a subscription | Analytics |
| Location → Coarse Location | Approximate location PostHog derives from the IP address (skip if you turn on "Discard client IP data") | Analytics |

**Not collected:** Health & Fitness, Payment Info (Recurvo takes no payments), Credit Info, Precise Location, Sensitive Info, Contacts, Emails or Text Messages, Audio, Gameplay, Customer Support (support happens by email, outside the app), Other User Content, Browsing History, Search History, Purchases, Device ID (no advertising ID is read), Crash Data, Performance Data, Other Diagnostic Data, Other Data.

## Google Play (Play Console → App content → Data safety)

**Does your app collect or share any of the required user data types?** Yes.

**Is all of the user data collected by your app encrypted in transit?** Yes.

**Which methods do you provide for users to request that their data is deleted?** In-app (Settings > Delete account), and a web link (the account deletion page, see above).

**Shared data:** None. Every provider (Clerk, Supabase, OpenAI, PostHog, Expo, Logo.dev) processes data on our behalf as a service provider, which Google doesn't count as sharing.

**Collected data:**

| Category → Type | Required or optional | Processed ephemerally? | Purposes |
|---|---|---|---|
| Personal info → Name | Required | No | Account management, App functionality |
| Personal info → Email address | Required | No | Account management, App functionality |
| Personal info → User IDs | Required | No | Account management, Analytics |
| Financial info → Other financial info | Required (it's what the app does) | No | App functionality |
| Photos and videos → Photos | Optional (profile photo) | No | Account management |
| Files and docs → Files and docs | Optional (statement upload; manual entry needs none) | Yes: read and not stored | App functionality |
| App activity → App interactions | Required | No | Analytics |
| Location → Approximate location | Required (skip if PostHog discards IP data) | No | Analytics |
| Device or other IDs → Device or other IDs | Optional (push token, only if notifications are allowed) | No | App functionality |

**Not collected:** Precise location, Address, Phone number, Race and ethnicity, Political or religious beliefs, Sexual orientation, Other personal info, User payment info, Purchase history, Credit score, Health and fitness, Messages, Audio, Calendar, Contacts, Web browsing, Installed apps, Other user-generated content, Crash logs, Diagnostics, Other app performance data.

## Other store questions you'll meet

- **Target age (Play) / Age rating (Apple):** 16 and over. Recurvo isn't designed for children, so don't join Google Play's Families programme.
- **Ads:** the app contains no ads.
- **Financial features (Play declaration):** Recurvo is a subscription tracker. It doesn't provide banking, loans, payments, investments or crypto. It reads uploaded statements but doesn't connect to bank accounts.
- **Sign-in for reviewers:** both stores need a demo account. Create one in Clerk with a few subscriptions added, and put its email and password in the review notes. Statement scanning needs a real statement, so mention that manual entry shows the main features.
