# Notion REST API research for a programmatic student "Life OS" (Node.js, internal integration, macOS)

Researched 2026-09-23 against developers.notion.com and notion.com/help. **Headline corrections to the brief's assumptions:**

- The current API version is **`2026-03-11`**, not `2025-09-03`. The 2025-09-03 database/data-source split still applies; 2026-03-11 only renames a few things (`after` → `position`, `archived` → `in_trash`, `transcription` → `meeting_notes`). ([Versioning](https://developers.notion.com/reference/versioning), [2026-03-11 upgrade guide](https://developers.notion.com/docs/upgrade-guide-2026-03-11))
- **Views CAN now be created via API** (Views API launched March 19, 2026, eight endpoints under `/v1/views`), including **linked database views on any page** via `create_database`, with filter, sorts, group_by, visible properties, calendar date property and gallery covers. The "API can't create views" workaround is obsolete. ([Working with views](https://developers.notion.com/guides/data-apis/working-with-views), [Create a view](https://developers.notion.com/reference/create-view), [Changelog](https://developers.notion.com/page/changelog))
- **Status properties CAN be created/updated via API** since March 19, 2026. ([Changelog](https://developers.notion.com/page/changelog))
- **Native Notion icons** (`{"type":"icon","icon":{"name":"book","color":"blue"}}`) are settable via API on pages, databases and callouts — exactly the "one icon set, one color" premium look. ([Emoji and icon](https://developers.notion.com/reference/emoji-and-icon))

---

## 1. Current API version and core endpoints

### What changed in 2025-09-03 (still the mental model)
A **database** is now a container; one or more **data sources** inside it hold the schema (`properties`) and the rows. Most operations moved from `database_id` to `data_source_id`: querying, updating the schema, page parents and relation targets. `GET /v1/databases/{id}` returns a `data_sources: [{id, name}]` array but *not* the properties; properties live on `GET /v1/data_sources/{id}`. Search filter values are `"page" | "data_source"`. ([Upgrade guide 2025-09-03](https://developers.notion.com/docs/upgrade-guide-2025-09-03), [Database object](https://developers.notion.com/reference/database), [Data source object](https://developers.notion.com/reference/data-source))

### Required headers (every request)
```http
Authorization: Bearer ntn_xxx
Notion-Version: 2026-03-11
Content-Type: application/json
```
`Notion-Version` is mandatory. JS SDK `@notionhq/client` >= 5.12.0 supports `notionVersion: "2026-03-11"`. ([Versioning](https://developers.notion.com/reference/versioning))

### Create a database with an initial data source — `POST /v1/databases`
Parent must be a page (`page_id`). `is_inline: true` renders it as an inline block on the parent page; `false` = full-page child. `icon`/`cover` accepted here. Optional `database_type: "tasks"|"projects"|"skills"` builds a canonical schema instead (cannot combine with `initial_data_source`). Requires the "Insert content" capability. ([Create a database](https://developers.notion.com/reference/create-a-database))

```json
{
  "parent": { "type": "page_id", "page_id": "PARENT_PAGE_ID" },
  "title": [{ "type": "text", "text": { "content": "Daily Blocks" } }],
  "is_inline": false,
  "icon": { "type": "icon", "icon": { "name": "calendar", "color": "blue" } },
  "cover": { "type": "external", "external": { "url": "https://images.unsplash.com/photo-...?w=1600" } },
  "initial_data_source": {
    "properties": {
      "Name": { "title": {} },
      "Notes": { "rich_text": {} },
      "Minutes": { "number": { "format": "number" } },
      "Type": { "select": { "options": [
        { "name": "Deep work", "color": "blue" },
        { "name": "Review", "color": "green" },
        { "name": "Class", "color": "gray" } ] } },
      "Tags": { "multi_select": { "options": [ { "name": "IB", "color": "purple" }, { "name": "Stanford", "color": "red" } ] } },
      "When": { "date": {} },
      "Done": { "checkbox": {} },
      "Link": { "url": {} },
      "Owner": { "people": {} },
      "Status": { "status": {} },
      "Subject": { "relation": { "data_source_id": "SUBJECTS_DATA_SOURCE_ID", "type": "single_property", "single_property": {} } },
      "Days until": { "formula": { "expression": "dateBetween(prop(\"When\"), now(), \"days\")" } }
    }
  }
}
```
Response: `{ "object":"database", "id":"...", "data_sources":[{"id":"DATA_SOURCE_ID","name":"Daily Blocks"}], "is_inline":..., "icon":..., "cover":..., "url":... }`. Save `data_sources[0].id` — you need it for everything else.

### Property schema JSON, type by type
Source: [Property object](https://developers.notion.com/reference/property-object), [Property schema object](https://developers.notion.com/reference/property-schema-object), [Update property schema](https://developers.notion.com/reference/update-property-schema-object), [Create a data source](https://developers.notion.com/reference/create-a-data-source).

| Type | Schema JSON | Creatable via API? |
|---|---|---|
| title | `{"title": {}}` (exactly one per data source; type can't change) | Yes |
| rich_text | `{"rich_text": {}}` | Yes |
| number | `{"number": {"format": "percent"}}` — formats: `number, number_with_commas, percent, dollar, euro, pound, yen, ...` | Yes. **"Show as: Bar/Ring" is NOT exposed** in the API schema; set it once in the UI. |
| select / multi_select | `{"select": {"options": [{"name":"A","color":"blue"}]}}` (max 100 options/request) | Yes |
| date | `{"date": {}}` | Yes |
| checkbox / url / email / phone_number / people / files | `{"checkbox": {}}` etc. | Yes |
| **status** | `{"status": {}}` → defaults Not started / In progress / Done with groups; or `{"status":{"options":[{"name":"Planned","color":"gray"},{"name":"Active","color":"blue"},{"name":"Done","color":"green"}]}}` | **Yes** (since 2026-03-19). Groups are read back (`groups[].option_ids`) but "to rename, reorder, or otherwise reconfigure groups, use the Notion UI." |
| relation (single) | `{"relation": {"data_source_id":"X","type":"single_property","single_property":{}}}` | Yes; related data source must also be shared with the connection |
| relation (dual) | `{"relation": {"data_source_id":"X","type":"dual_property","dual_property":{}}}` → Notion auto-creates the synced back-property (name returned as `synced_property_name`) | Yes |
| **rollup** | `{"rollup": {"relation_property_name":"Topics","rollup_property_name":"Done","function":"percent_checked"}}` — functions: `average, checked, count, count_values, date_range, earliest_date, empty, latest_date, max, median, min, not_empty, percent_checked, percent_empty, percent_not_empty, percent_unchecked, range, show_original, show_unique, sum, unchecked, unique` | **Yes** — `rollup` is in the supported list for Create data source and Update data source; the relation property must already exist (create the relation first, then PATCH the rollup in). |
| formula | `{"formula": {"expression": "dateBetween(prop(\"Date\"), now(), \"days\")"}}` | Yes. Expressions are validated on save; a `prop()` to a missing property returns `validation_error`, so add referenced properties first. |
| created_time / last_edited_time / created_by / last_edited_by / unique_id | `{"created_time": {}}` | Creatable as schema; values are read-only |

Formula syntax (Formulas 2.0, [help.notion.so/formula-syntax](https://www.notion.com/help/formula-syntax)): `prop("Name")`, `now()`, `today()`, `dateAdd(now(), 1, "days")`, `dateBetween(date1, date2, "days")` (units: years/quarters/months/weeks/days/hours/minutes), `formatDate(now(), "MM/DD/YYYY")`, `if(cond, a, b)`, `repeat("●", 4)`, `substring(t, 0, 3)`, `round(x, 2)`, `style(text, "b", "blue")`. Example text progress bar (Thomas Frank style):
```text
repeat("●", floor(prop("Progress") * 10)) + repeat("○", 10 - floor(prop("Progress") * 10)) + " " + format(round(prop("Progress") * 100)) + "%"
```

### Add/update properties — `PATCH /v1/data_sources/{data_source_id}`
Body: `title`, `icon`, `properties`, `in_trash`. Add = include a new key; rename = `{"Old": {"name": "New"}}`; delete = `{"Old": null}`. Keep schema under ~50 KB / 500 properties. Synced-content and `place` props can't be updated. ([Update a data source](https://developers.notion.com/reference/update-a-data-source))
```json
{ "properties": {
    "Progress": { "rollup": { "relation_property_name": "Topics", "rollup_property_name": "Mastered", "function": "percent_checked" } },
    "Old name": { "name": "Feedback" },
    "Unused": null } }
```

### Create a page in a data source — `POST /v1/pages`
Parent is `{"type":"data_source_id","data_source_id":"..."}`; `children` max 100 blocks; property keys must match the schema. ([Create a page](https://developers.notion.com/reference/post-page), [Page property values](https://developers.notion.com/reference/page-property-values))
```json
{
  "parent": { "type": "data_source_id", "data_source_id": "DATA_SOURCE_ID" },
  "icon": { "type": "icon", "icon": { "name": "flask", "color": "green" } },
  "cover": { "type": "external", "external": { "url": "https://.../cover.jpg" } },
  "properties": {
    "Name":    { "title": [{ "type": "text", "text": { "content": "Chem S1.5 spaced review" } }] },
    "Notes":   { "rich_text": [{ "type": "text", "text": { "content": "≤2000 chars per text object" }, "annotations": { "bold": true, "color": "blue" } }] },
    "Minutes": { "number": 45 },
    "Type":    { "select": { "name": "Deep work" } },
    "Tags":    { "multi_select": [{ "name": "IB" }, { "name": "Chem" }] },
    "When":    { "date": { "start": "2026-10-01T16:00:00", "end": "2026-10-01T16:45:00", "time_zone": "America/Sao_Paulo" } },
    "Done":    { "checkbox": false },
    "Link":    { "url": "https://example.com" },
    "Subject": { "relation": [{ "id": "SUBJECT_PAGE_ID" }] },
    "Owner":   { "people": [{ "object": "user", "id": "USER_ID" }] },
    "Status":  { "status": { "name": "Not started" } }
  },
  "children": [ { "object": "block", "type": "paragraph", "paragraph": { "rich_text": [{ "type": "text", "text": { "content": "Body" } }] } } ]
}
```
Date rules: ISO 8601; date-only `"2026-10-01"` = all-day; with a time use either an offset (`2026-10-01T16:00:00-03:00`) or a naive time plus `"time_zone"` (IANA name). `end` and `time_zone` are optional. Formula, rollup, created_*/last_edited_*, unique_id values are read-only.

### Query — `POST /v1/data_sources/{id}/query`
Body: `filter`, `sorts`, `start_cursor`, `page_size` (≤100), `filter_properties`, `is_archived`. Response `{results, next_cursor, has_more}`. Max 10,000 results per filter/sort combo. ([Query a data source](https://developers.notion.com/reference/query-a-data-source))
```json
{ "filter": { "and": [
      { "property": "When", "date": { "on_or_after": "2026-09-23" } },
      { "property": "Done", "checkbox": { "equals": false } } ] },
  "sorts": [{ "property": "When", "direction": "ascending" }],
  "page_size": 100 }
```

---

## 2. Limits and bulk-creation strategy
Source: [Request limits](https://developers.notion.com/reference/request-limits), [Append block children](https://developers.notion.com/reference/patch-block-children), [Errors](https://developers.notion.com/reference/errors).

- **Rate limit:** 180 req / 60 s per connection (avg 3 req/s) on Free/Plus; 600/min on Business/Enterprise; plus a per-workspace limit shared across all connections. Over limit → HTTP 429 `rate_limited` with a **`Retry-After`** header (≤60 s per-connection; can be longer for workspace limit). 529 `service_overload` also retryable.
- **Recommended retry:** exponential backoff with jitter (base ≤30 s), max ~6 attempts; retry 429/529 for all methods; retry 500/502/503/504 only for idempotent (GET/DELETE) requests; queue outgoing requests to avoid bursts.
- **Payload:** 500 KB per request; 1000 block elements per request overall; **100 block children per append/create-page call**, **two levels of nesting** per request (append deeper levels in follow-up calls).
- **Property value limits per request:** `text.content` 2000 chars; rich_text array 100 elements; URL 2000; email/phone 200; equation 1000; multi_select 100 options; relation 100 pages; people 100.
- **Pagination:** `page_size` max 100; loop on `has_more`/`next_cursor`.
- Other errors: 400 `validation_error`, 404 `object_not_found` (also when not shared with the connection), 409 `conflict_error` ("make sure the parameters are up to date and try again"), 503 `database_connection_unavailable`.

**Plan for ~200 pages:** one `POST /v1/pages` per row (there is no batch create), throttled to ~2.5 req/s with a token bucket, concurrency 1–2, honouring `Retry-After`. Create Subjects first, keep a `name → page_id` map, then Topics/Assessments that relate to them. Node sketch:
```js
import { Client } from "@notionhq/client";
const notion = new Client({ auth: process.env.NOTION_TOKEN, notionVersion: "2026-03-11" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function withRetry(fn, attempt = 0) {
  try { return await fn(); }
  catch (e) {
    const retryable = e.status === 429 || e.status === 529 || e.status >= 500;
    if (!retryable || attempt >= 6) throw e;
    const ra = Number(e.headers?.["retry-after"]);
    const wait = ra ? ra * 1000 : Math.min(30000, 500 * 2 ** attempt) + Math.random() * 300;
    await sleep(wait); return withRetry(fn, attempt + 1);
  }
}
for (const row of rows) { await withRetry(() => notion.pages.create(row)); await sleep(400); }
```

---

## 3. Page design via API

### Block types creatable via `children` / `PATCH /v1/blocks/{id}/children`
Source: [Block](https://developers.notion.com/reference/block), [Append block children](https://developers.notion.com/reference/patch-block-children).
Creatable: `paragraph`, `heading_1/2/3` (with `is_toggleable`), `callout`, `quote`, `divider`, `toggle`, `to_do`, `bulleted_list_item`, `numbered_list_item`, `code`, `equation`, `bookmark`, `embed`, `image` (external/file_upload), `video`, `audio`, `file`, `pdf`, `table` + `table_row`, `table_of_contents`, `breadcrumb`, `column_list` + `column` (≥2 columns, each column ≥1 child, optional `width_ratio`), `synced_block` (original; duplicates reference an original via `synced_from`), `link_to_page`, `tab` (new March 2026), `child_page`/`child_database` (create via the page/database endpoints, not as blocks). NOT creatable: `link_preview` (read-only), `template` (deprecated), `meeting_notes` (own endpoint). Positioning under 2026-03-11 uses `"position": {"type":"end"|"start"|"after_block","after_block":{"id":"..."}}`.

```json
[
 { "type": "callout", "callout": {
     "rich_text": [{ "type": "text", "text": { "content": "Today's focus" }, "annotations": { "bold": true } }],
     "icon": { "type": "icon", "icon": { "name": "target", "color": "blue" } },
     "color": "blue_background" } },
 { "type": "heading_2", "heading_2": { "rich_text": [{ "type": "text", "text": { "content": "This week" } }], "is_toggleable": false } },
 { "type": "column_list", "column_list": {}, "children": [
     { "type": "column", "column": { "width_ratio": 0.5 }, "children": [ { "type": "quote", "quote": { "rich_text": [{ "type": "text", "text": { "content": "Amor fati." } }] } } ] },
     { "type": "column", "column": { "width_ratio": 0.5 }, "children": [ { "type": "divider", "divider": {} } ] } ] },
 { "type": "table_of_contents", "table_of_contents": { "color": "gray" } },
 { "type": "link_to_page", "link_to_page": { "type": "page_id", "page_id": "PAGE_ID" } },
 { "type": "image", "image": { "type": "external", "external": { "url": "https://.../banner.png" } } },
 { "type": "bookmark", "bookmark": { "url": "https://admission.stanford.edu", "caption": [] } },
 { "type": "synced_block", "synced_block": { "synced_from": null, "children": [ { "type": "paragraph", "paragraph": { "rich_text": [{ "type": "text", "text": { "content": "Shared header" } }] } } ] } }
]
```
Callout `color` values: `default, gray, brown, orange, yellow, green, blue, purple, pink, red` and their `_background` variants (same palette as rich-text annotations).

### Linked database views, filters, sorts, groups — YES via the Views API (Notion-Version ≥ 2025-09-03; docs show 2026-03-11)
`POST /v1/views` with exactly one of `database_id` (add a tab to an existing database), `view_id` (add a widget to a dashboard view) or **`create_database`** (creates a **linked database block on any page** pointing at an existing data source). Types: `table, board, list, calendar, timeline, gallery, form, chart, map, dashboard`. Supports `filter`/`sorts` (same shapes as data-source query), `quick_filters`, `configuration.properties` (visibility, width, wrap), `group_by` (required for board), calendar `date_property_id`, timeline `date_property_id`/`end_date_property_id`, gallery/board `cover` (`{"type":"property","property_id":...}`, `cover_size`, `card_layout`), chart (`chart_type: column|bar|line|donut|number`). Databases must keep ≥1 view. ([Working with views](https://developers.notion.com/guides/data-apis/working-with-views), [Create a view](https://developers.notion.com/reference/create-view))
```json
{ "create_database": { "parent": { "type": "page_id", "page_id": "HOME_PAGE_ID" } },
  "data_source_id": "DAILY_BLOCKS_DS_ID",
  "name": "Today",
  "type": "table",
  "filter": { "and": [
     { "property": "When", "date": { "this_week": {} } },
     { "property": "Done", "checkbox": { "equals": false } } ] },
  "sorts": [{ "property": "When", "direction": "ascending" }],
  "configuration": { "type": "table",
     "properties": [ { "property_id": "title", "visible": true, "width": 320 }, { "property_id": "WHEN_PROP_ID", "visible": true } ],
     "group_by": { "type": "select", "property_id": "TYPE_PROP_ID", "sort": { "direction": "ascending" }, "hide_empty_groups": true } } }
```
Property IDs come from `GET /v1/data_sources/{id}` (`properties[name].id`). A "default view" is simply the first tab; use `position` (`{"type":"start"}`) when adding to a `database_id`. What the API still cannot do: set a number property's Bar/Ring "Show as", reorder status groups, or set page-level width/font/small-text settings — these are one-time UI touches.

### Icons and covers
Page and database `icon` accepts `emoji`, `external` (URL), `icon` (native Notion icon: `{"type":"icon","icon":{"name":"graduation-cap","color":"blue"}}`; colors `gray, lightgray, brown, yellow, orange, green, blue, purple, pink, red`; names are case-insensitive and match the icon-picker tooltip names), `custom_emoji` (`{id}`; list via the custom emojis endpoint) and `file_upload`. Callout icons accept all but `file_upload`. `cover` accepts `external` or `file_upload` only. ([Emoji and icon](https://developers.notion.com/reference/emoji-and-icon), [Page](https://developers.notion.com/reference/page)) Set icon/cover on create or via `PATCH /v1/pages/{id}` / `PATCH /v1/databases/{id}`.

### Custom cover via the File Upload API
([Working with files and media](https://developers.notion.com/guides/data-apis/working-with-files-and-media), [File upload](https://developers.notion.com/reference/file-upload))
1. `POST /v1/file_uploads` `{"filename":"cover.jpg","content_type":"image/jpeg"}` (add `"mode":"multi_part","number_of_parts":N` for files > 20 MB) → `{id, expiry_time}` (expires in **1 hour** unless attached).
2. `POST /v1/file_uploads/{id}/send` as `multipart/form-data` with a `file` field: `curl -F "file=@cover.jpg" -H "Authorization: Bearer $NOTION_TOKEN" -H "Notion-Version: 2026-03-11" https://api.notion.com/v1/file_uploads/{id}/send`.
3. Attach: `"cover": {"type":"file_upload","file_upload":{"id":"<upload id>"}}` on `POST /v1/pages`, `PATCH /v1/pages/{id}`, `POST /v1/databases`, or in an `image` block. Limits: 5 MiB per file on Free, 5 GiB on paid. External URLs must be publicly reachable.

---

## 4. Notion Calendar
Sources: [Use Notion Calendar with Notion](https://www.notion.com/help/use-notion-calendar-with-notion), [Notion Calendar apps](https://www.notion.com/help/notion-calendar-apps), [Getting started with Notion Calendar](https://www.notion.com/help/guides/getting-started-with-notion-calendar), [Time zones](https://www.notion.com/help/time-zones), [Calendar views](https://www.notion.com/help/calendars).

- **What appears:** database pages whose date property has a value. A database must have a **date property**, and in practice must have a **Calendar or Timeline view** to be offered in the "Add Notion database" picker (also via the "Open in Calendar" button on that view). Up to **20 databases** per user. Needs at least "Can view"; editing/creating from Calendar needs "Can edit content".
- **Timed vs all-day:** pages with a start *and* end time appear as timed blocks; "If no start and end time is specified, your items will show up as All-day events". So your Daily Blocks `When` property must be written with `start` and `end` datetimes for time-blocking. Timeline start/end across separate properties is only partially supported (start only).
- **Connect:** Notion Calendar → Settings → "Notion workspaces" → "Add Notion workspace" → authorize, then `…` next to the workspace → "Add Notion database…". Connections are per user (admins can't push them). Do it once on the Mac; the same Notion Calendar account on iPhone shows the same databases.
- **iPhone:** Home-screen widget (iOS 14+) and **lock-screen widget (iOS 16+)**; configure in the mobile app settings (days shown, all-day events, hide titles for privacy, exclude calendars). Mobile is limited to 1–3 day views. Mac: macOS 11+.
- **Time zones:** events display in the calendar's *primary* time zone (initially imported from Google Calendar; changes don't sync back). Changing an event's time zone in Calendar reschedules it (keeps the clock time). Write dates with an explicit offset or `time_zone: "America/Sao_Paulo"` so they land correctly.

---

## 5. Integration, sharing, token storage, MCP

### Create the internal connection (the docs now call integrations "connections")
([Internal connections guide](https://developers.notion.com/guides/get-started/internal-connections), [Authorization](https://developers.notion.com/docs/authorization), [Help: create integrations](https://www.notion.com/help/create-integrations-with-the-notion-api))
1. Be a **workspace owner**. Open the Developer portal: **https://app.notion.com/developers/connections** (the old `notion.so/profile/integrations` / `my-integrations` redirects there).
2. Sidebar **Build → Internal connections → Create a new connection**; enter a name (e.g. "IB45 Builder"), pick the workspace.
3. **Configuration** tab: copy the **Installation access token** (prefix `ntn_`). Capabilities: tick **Read content, Update content, Insert content**; leave comments off; **User information: No access** (only needed for `people` property values — if you want to set `people`, choose "Read without email" and fetch the user id via `GET /v1/users`).
4. Grant access: either **Content access** tab → **Edit access** → pick the top-level page, or in Notion open the page → **•••** → **Connections → + Add connection** → choose it → confirm. Child pages and databases inherit access. Unshared pages return 404.
5. Alternative: a **Personal access token** (Developer portal → Personal access tokens → New token → capability "Notion API") acts as *you* and needs no page sharing.

### Storing the token on macOS
```bash
mkdir -p ~/.config/ib45 && printf 'NOTION_TOKEN=ntn_xxx\nNOTION_PARENT_PAGE_ID=...\n' > ~/.config/ib45/notion.env
chmod 600 ~/.config/ib45/notion.env
echo '.env*' >> .gitignore
node --env-file=$HOME/.config/ib45/notion.env build.js     # Node 20.6+, no dotenv needed
```
Notion's guidance: "Never store the token in source code or commit it to version control. Use environment variables or a secret manager." (Keychain alternative: `security add-generic-password -s notion -a ib45 -w` and `security find-generic-password -s notion -w`.)

### Official Notion MCP
Hosted remote server **https://mcp.notion.com/mcp** (streamable HTTP; legacy `/sse`), OAuth login, inherits your full permissions; tools include search, create-pages, update-page, create-database, update-data-source (STATUS supported), move/duplicate pages, comments. Add to Claude Code: `claude mcp add notion --transport http https://mcp.notion.com/mcp`. The self-hosted `@notionhq/notion-mcp-server` (npx / Docker, `NOTION_TOKEN` env) still exists but is "no longer actively maintained." ([MCP docs](https://developers.notion.com/docs/mcp), [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server)). Good for interactive touch-ups (Bar/Ring display, group reorder) but for a 200-row build the REST script is more deterministic.

---

## 6. Design patterns from the "$1M Life OS" designers

**Structure (all three converge):**
- Thomas Frank, Ultimate Brain: PARA-style **Areas → Projects → Tasks**, plus Notes, Goals, Milestones, People, Books; an Inbox default for capture; a **"My Day"/Today dashboard**; a home page that is "One Page to Rule Them All" with tabbed linked views; projects with statuses Planned / Doing / Done / Ongoing / On Hold. ([UB docs](https://thomasjfrank.com/docs/ultimate-brain/start-using-ultimate-brain-the-simple-way/))
- August Bradley, PPV: **Pillars (life areas/values) → Goals → Projects → this week's tasks (Pipelines)**, **Vaults** for knowledge, and a built-in cadence of **daily / weekly / monthly / quarterly reviews** with linked databases so the chain is navigable both ways. ([PPV overview](https://esilva.net/tla_insights/ppv_bradley), [asambl](https://asambl.app/guides/ppv-method/))
- Marie Poulin: a **Today dashboard that shows only what matters today/this week**, filters out done/later/unrelated items, groups tasks by status/project/context, puts high-frequency databases one click away, links to weekly and monthly reviews; "there is no perfect system" — reduce cognitive load, friction and decisions. ([Poulin dashboard](https://mariepoulin.com/blog/the-notion-dashboard-i-use-every-day/), [Principles of dashboarding](https://notionmastery.com/principles-of-dashboarding/))

**What makes them feel premium:** one consistent icon family in one accent color (use native `icon` type, e.g. all `blue`); callout blocks as section headers with `gray_background`/`blue_background`; two-column layouts (Today | This week); gallery cards with covers for Subjects; sparse emoji; short titles; generous whitespace (dividers, empty paragraphs); progress shown as rollup `percent_checked` rendered with the number Bar (UI toggle) or a `●○` formula; status properties (not checkboxes) for pipelines; a Weekly Review database whose pages carry a template body (headings + to-dos) that your script writes into `children`.

**Mapping to this project (all API-achievable now):**
- Areas = **Subjects** (gallery with covers + native icons); Projects = **Assessments** and **Stanford Milestones** (status, date, relation to Subject, rollup of linked Topics); Tasks = **Daily Blocks** (`When` start/end datetime → Notion Calendar) and **Topics/Syllabus** (checkbox Mastered → rollup % on Subject → progress formula).
- **Error Log / Feedback Log / Reading & Quote Bank** relate to Subject and Topic; **Weekly Reviews** date property + relation to blocks done that week (rollup count).
- Home page: heading + callout ("Today"), `column_list` with linked views created via `POST /v1/views` + `create_database` (Today table filtered `this_week`, Assessments board grouped by status, Milestones timeline, Subjects gallery), `link_to_page` blocks to each database, `table_of_contents`.
- Remaining manual steps (one-time, UI or MCP): switch progress numbers to "Show as: Bar", reorder status groups, set page width/font.

**Sources (developers.notion.com):** [versioning](https://developers.notion.com/reference/versioning) · [upgrade 2025-09-03](https://developers.notion.com/docs/upgrade-guide-2025-09-03) · [upgrade 2026-03-11](https://developers.notion.com/docs/upgrade-guide-2026-03-11) · [changelog](https://developers.notion.com/page/changelog) · [create a database](https://developers.notion.com/reference/create-a-database) · [create a data source](https://developers.notion.com/reference/create-a-data-source) · [update a data source](https://developers.notion.com/reference/update-a-data-source) · [property object](https://developers.notion.com/reference/property-object) · [property schema](https://developers.notion.com/reference/property-schema-object) · [update property schema](https://developers.notion.com/reference/update-property-schema-object) · [create a page](https://developers.notion.com/reference/post-page) · [page property values](https://developers.notion.com/reference/page-property-values) · [query a data source](https://developers.notion.com/reference/query-a-data-source) · [request limits](https://developers.notion.com/reference/request-limits) · [errors](https://developers.notion.com/reference/errors) · [block](https://developers.notion.com/reference/block) · [append block children](https://developers.notion.com/reference/patch-block-children) · [rich text](https://developers.notion.com/reference/rich-text) · [emoji and icon](https://developers.notion.com/reference/emoji-and-icon) · [page](https://developers.notion.com/reference/page) · [file upload](https://developers.notion.com/reference/file-upload) · [files and media guide](https://developers.notion.com/guides/data-apis/working-with-files-and-media) · [working with views](https://developers.notion.com/guides/data-apis/working-with-views) · [create a view](https://developers.notion.com/reference/create-view) · [internal connections](https://developers.notion.com/guides/get-started/internal-connections) · [authorization](https://developers.notion.com/docs/authorization) · [MCP](https://developers.notion.com/docs/mcp)
