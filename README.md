# Universal Contact Info Extractor

A Chrome Extension that automatically extracts contact information (Emails, Phone Numbers, Social Media Links) from websites. It prioritizes the **Footer** section for accuracy but scans the full page if necessary.

## 🚀 How It Works

1.  **User Trigger**: You click the extension icon in your browser toolbar.
2.  **Message Passing**: The `popup.js` (UI) sends a message `EXTRACT_INFO` to the active tab's `content.js` (Background Worker).
3.  **Smart Scan**:
    - The script actively looks for a `<footer>`, `#contact`, or `.footer` element.
    - If found, it scans _only_ that section to avoid unrelated data (like emails in a blog post body).
    - If _not_ found, it falls back to scanning the entire `<body>`.
4.  **Extraction**:
    - **Emails**: Uses a regular expression to find email patterns.
    - **Phones**: Uses a pattern matcher for common phone formats (international and local).
    - **Socials**: Checks all link (`<a>`) tags against a list of known social media domains (Facebook, LinkedIn, X/Twitter, etc.).
5.  **Display**: The data is sent back to the Popup, which renders it with a premium "Dark Mode" UI.

## 🛠️ Key Code Functions Explained

Here is an explanation of the most important functions in `content.js`:

### 1. `extractContactInfo()`

This is the main orchestrator.

- **What it does**: Decides _where_ to look (Footer vs Body) and calls the specific extraction functions.
- **Why**: It ensures we prioritize the most relevant sections of the page.

### 2. `findFooter()`

- **What it does**: Loops through a list of common selectors (`footer`, `.site-footer`, `#contact`, etc.).
- **Why**: HTML structures vary across the web. This helper makes the extension compatible with millions of sites, not just one.

### 3. `extractEmails(text)`

- **Code**: `const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;`
- **Why**: This regex captures standard email formats while ignoring casing (`/i` flag) and finding all occurrences (`/g` flag). using `new Set()` removes duplicates automatically.

### 4. `extractPhones(text)`

- **what it does**: Searches for number patterns that look like phones (approx 8-15 digits, allowing for `+`, spaces, and dashes).
- **Why**: Phone extraction is tricky because year numbers (2024) or IDs look like phones. We filter for length to reduce "false positives".

### 5. `extractSocials(scope)`

- **What it does**: It gets all links `<a>` in the scope and checks if their `href` contains `facebook.com`, `instagram.com`, etc.
- **Why**: This is safer than regex because it verifies exact domain matches.

## 📦 Installation (Developer Mode)

1.  Download this folder.
2.  Open Chrome and go to `chrome://extensions`.
3.  Enable **Developer mode** (top right).
4.  Click **Load unpacked**.
5.  Select this project folder.
