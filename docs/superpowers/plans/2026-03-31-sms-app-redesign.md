# SMS App Full Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the SeloraX SMS messaging app from a basic 4-event SMS sender into a fully customizable messaging platform with automations, bulk campaigns, auto-renewal billing, and help/instructions.

**Architecture:** Build on the existing Express.js backend (selorax-messaging) and Next.js frontend (frontend-sms). Add new DB tables for automations and campaigns. Extend the webhook receiver to handle more event types. Add campaign audience fetching via SeloraX platform API (read:customers, read:orders scopes). Frontend gets 3 new pages (Automations, Campaigns, Settings) and enhanced existing pages.

**Tech Stack:** Express.js, MySQL, Next.js 14, React 18, TanStack Query v5, Tailwind CSS, SeloraX Platform API

**Codebases:**
- Backend: `/Volumes/Nimion/Selorax/selorax-messaging`
- Frontend: `/Volumes/Nimion/Selorax/frontend-sms`

---

## File Structure

### Backend — New Files
- `migrations/006_automations_campaigns.sql` — New tables + settings columns
- `models/messaging-automations.js` — Automation CRUD + event mapping
- `models/messaging-campaigns.js` — Campaign CRUD + recipient management + bulk send
- `routers/automations.js` — Automation routes
- `routers/campaigns.js` — Campaign routes
- `services/campaign-sender.js` — Background campaign send processor

### Backend — Modified Files
- `models/messaging.js` — Update sendSms to work with automations instead of templates
- `routers/messaging.js` — Add/update settings fields for auto-renewal
- `routers/webhooks.js` — Expand event mapping, use automations model
- `routers/wallet.js` — Return auto-renewal info
- `services/scheduler.js` — Add auto-renewal credit check + campaign processing
- `startup/routes.js` — Mount new routers

### Frontend — New Files
- `app/automations/page.js` — Automations list + per-event config
- `app/campaigns/page.js` — Campaign list
- `app/campaigns/new/page.js` — Create campaign wizard
- `app/campaigns/[id]/page.js` — Campaign detail/results
- `app/settings/page.js` — Full settings + auto-renewal + help
- `components/AutomationCard.js` — Single automation event card with toggle/edit
- `components/CampaignCard.js` — Campaign list item
- `components/AudienceSelector.js` — Platform customer filter + manual phone input
- `components/HelpSection.js` — Instructions/how-to-use

### Frontend — Modified Files
- `components/MessagingTabNav.js` — Add Automations, Campaigns, Settings tabs; remove Templates, Send, Scheduled
- `app/page.js` — Updated dashboard with credits, recent automations, campaign stats
- `app/history/page.js` — Enhanced filters (event type, campaign, date range)
- `app/billing/page.js` — Show auto-renewal status
- `components/WalletCard.js` — Show auto-renewal badge

---

## Task 1: Database Migration

**Files:**
- Create: `selorax-messaging/migrations/006_automations_campaigns.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- ============================================================
-- SeloraX Messaging App — Automations & Campaigns
-- Run AFTER 005_sms_packages.sql
-- ============================================================

-- 1. Automations — replaces simple templates with full event rules
CREATE TABLE IF NOT EXISTS `app_messaging_automations` (
    `automation_id` INT NOT NULL AUTO_INCREMENT,
    `store_id` INT NOT NULL,
    `installation_id` INT NOT NULL,
    `event_key` VARCHAR(100) NOT NULL,
    `event_label` VARCHAR(255) NOT NULL,
    `event_group` VARCHAR(50) NOT NULL DEFAULT 'order',
    `is_active` TINYINT DEFAULT 0,
    `delivery_mode` ENUM('instant','delayed','off') DEFAULT 'off',
    `delay_minutes` INT DEFAULT 0,
    `template_text` TEXT DEFAULT NULL,
    `template_name` VARCHAR(100) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`automation_id`),
    UNIQUE KEY `idx_auto_store_event` (`store_id`, `event_key`),
    KEY `idx_auto_store` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Campaigns — bulk/marketing SMS
CREATE TABLE IF NOT EXISTS `app_messaging_campaigns` (
    `campaign_id` INT NOT NULL AUTO_INCREMENT,
    `store_id` INT NOT NULL,
    `installation_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `audience_type` ENUM('manual','filter','csv') NOT NULL DEFAULT 'manual',
    `audience_data` JSON DEFAULT NULL,
    `status` ENUM('draft','scheduled','sending','completed','cancelled') DEFAULT 'draft',
    `scheduled_at` TIMESTAMP NULL DEFAULT NULL,
    `started_at` TIMESTAMP NULL DEFAULT NULL,
    `completed_at` TIMESTAMP NULL DEFAULT NULL,
    `total_recipients` INT DEFAULT 0,
    `sent_count` INT DEFAULT 0,
    `failed_count` INT DEFAULT 0,
    `credits_used` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`campaign_id`),
    KEY `idx_campaign_store` (`store_id`),
    KEY `idx_campaign_status` (`status`, `scheduled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Campaign recipients — individual phone tracking
CREATE TABLE IF NOT EXISTS `app_messaging_campaign_recipients` (
    `recipient_id` INT NOT NULL AUTO_INCREMENT,
    `campaign_id` INT NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `status` ENUM('pending','sent','failed') DEFAULT 'pending',
    `error_message` VARCHAR(255) DEFAULT NULL,
    `sent_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`recipient_id`),
    KEY `idx_recipient_campaign` (`campaign_id`),
    KEY `idx_recipient_status` (`campaign_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Extend settings with auto-renewal fields
ALTER TABLE `app_messaging_settings`
    ADD COLUMN `auto_renew_enabled` TINYINT DEFAULT 0 AFTER `sms_credits`,
    ADD COLUMN `auto_renew_package_id` INT DEFAULT NULL AFTER `auto_renew_enabled`,
    ADD COLUMN `auto_renew_threshold` INT DEFAULT 50 AFTER `auto_renew_package_id`;
```

- [ ] **Step 2: Run the migration on the database**

```bash
mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < /Volumes/Nimion/Selorax/selorax-messaging/migrations/006_automations_campaigns.sql
```

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Nimion/Selorax/selorax-messaging
git add migrations/006_automations_campaigns.sql
git commit -m "feat: add automations and campaigns tables, auto-renewal settings"
```

---

## Task 2: Automations Model

**Files:**
- Create: `selorax-messaging/models/messaging-automations.js`

- [ ] **Step 1: Create the automations model**

```javascript
const { connection } = require('../startup/db');

/**
 * Default automation events — seeded for each store on first access.
 */
const DEFAULT_AUTOMATIONS = [
    { event_key: 'order.confirmed', event_label: 'Order Confirmed', event_group: 'order' },
    { event_key: 'order.shipped', event_label: 'Order Shipped', event_group: 'order' },
    { event_key: 'order.delivered', event_label: 'Order Delivered', event_group: 'order' },
    { event_key: 'order.cancelled', event_label: 'Order Cancelled', event_group: 'order' },
    { event_key: 'order.refunded', event_label: 'Order Refunded', event_group: 'order' },
    { event_key: 'order.payment_received', event_label: 'Payment Received', event_group: 'order' },
    { event_key: 'customer.welcome', event_label: 'New Customer Welcome', event_group: 'customer' },
    { event_key: 'customer.updated', event_label: 'Customer Updated', event_group: 'customer' },
];

/**
 * Mapping from platform webhook event+status to automation event_key.
 */
const WEBHOOK_EVENT_MAP = {
    'order.status_changed': {
        processing: 'order.confirmed',
        shipped: 'order.shipped',
        completed: 'order.delivered',
        delivered: 'order.delivered',
        cancelled: 'order.cancelled',
        hold: 'order.cancelled',
        refunded: 'order.refunded',
    },
    'order.created': 'order.payment_received',
    'customer.created': 'customer.welcome',
    'customer.updated': 'customer.updated',
};

/**
 * Template variables available per event group.
 */
const TEMPLATE_VARIABLES = {
    order: ['order_id', 'order_number', 'customer_name', 'customer_phone', 'total', 'status', 'tracking_id', 'store_name'],
    customer: ['customer_name', 'customer_phone', 'customer_email', 'store_name'],
};

/**
 * Ensure default automations exist for a store. Called on first access.
 */
async function ensureDefaults(store_id, installation_id) {
    const [existing] = await connection.promise().query(
        'SELECT COUNT(*) as count FROM app_messaging_automations WHERE store_id = ?',
        [store_id]
    );

    if (existing[0].count > 0) return;

    const values = DEFAULT_AUTOMATIONS.map(a =>
        [store_id, installation_id, a.event_key, a.event_label, a.event_group]
    );

    await connection.promise().query(
        `INSERT IGNORE INTO app_messaging_automations
         (store_id, installation_id, event_key, event_label, event_group)
         VALUES ?`,
        [values]
    );
}

/**
 * Get all automations for a store (seeds defaults if needed).
 */
async function getAll(store_id, installation_id) {
    await ensureDefaults(store_id, installation_id);
    const [rows] = await connection.promise().query(
        `SELECT * FROM app_messaging_automations WHERE store_id = ? ORDER BY event_group, event_key`,
        [store_id]
    );
    return rows;
}

/**
 * Get a single active automation by store_id + event_key.
 * Used by webhook receiver.
 */
async function getByEventKey(store_id, event_key) {
    const [rows] = await connection.promise().query(
        `SELECT * FROM app_messaging_automations
         WHERE store_id = ? AND event_key = ? AND is_active = 1`,
        [store_id, event_key]
    );
    return rows[0] || null;
}

/**
 * Update an automation's settings.
 */
async function update(automation_id, store_id, updates) {
    const allowed = ['is_active', 'delivery_mode', 'delay_minutes', 'template_text', 'template_name'];
    const sets = [];
    const params = [];

    for (const key of allowed) {
        if (updates[key] !== undefined) {
            sets.push(`\`${key}\` = ?`);
            params.push(updates[key]);
        }
    }

    if (sets.length === 0) return null;
    params.push(automation_id, store_id);

    await connection.promise().query(
        `UPDATE app_messaging_automations SET ${sets.join(', ')} WHERE automation_id = ? AND store_id = ?`,
        params
    );

    const [rows] = await connection.promise().query(
        'SELECT * FROM app_messaging_automations WHERE automation_id = ?',
        [automation_id]
    );
    return rows[0];
}

/**
 * Resolve a platform webhook event to an automation event_key.
 */
function resolveEventKey(webhookEvent, orderStatus) {
    const mapping = WEBHOOK_EVENT_MAP[webhookEvent];
    if (!mapping) return null;
    if (typeof mapping === 'string') return mapping;
    return mapping[orderStatus] || null;
}

module.exports = {
    DEFAULT_AUTOMATIONS,
    TEMPLATE_VARIABLES,
    WEBHOOK_EVENT_MAP,
    ensureDefaults,
    getAll,
    getByEventKey,
    update,
    resolveEventKey,
};
```

- [ ] **Step 2: Commit**

```bash
git add models/messaging-automations.js
git commit -m "feat: add automations model with event mapping and defaults"
```

---

## Task 3: Campaigns Model

**Files:**
- Create: `selorax-messaging/models/messaging-campaigns.js`

- [ ] **Step 1: Create the campaigns model**

```javascript
const { connection } = require('../startup/db');

/**
 * Create a new campaign (draft status).
 */
async function create(store_id, installation_id, { name, message, audience_type, audience_data, scheduled_at }) {
    const [result] = await connection.promise().query(
        `INSERT INTO app_messaging_campaigns
         (store_id, installation_id, name, message, audience_type, audience_data, scheduled_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            store_id, installation_id, name, message,
            audience_type, JSON.stringify(audience_data || {}),
            scheduled_at || null,
            scheduled_at ? 'scheduled' : 'draft',
        ]
    );
    return getById(result.insertId, store_id);
}

/**
 * Get a single campaign with stats.
 */
async function getById(campaign_id, store_id) {
    const [rows] = await connection.promise().query(
        'SELECT * FROM app_messaging_campaigns WHERE campaign_id = ? AND store_id = ?',
        [campaign_id, store_id]
    );
    return rows[0] || null;
}

/**
 * List campaigns for a store (paginated).
 */
async function list(store_id, { page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE store_id = ?';
    const params = [store_id];

    if (status) {
        where += ' AND status = ?';
        params.push(status);
    }

    const [rows] = await connection.promise().query(
        `SELECT * FROM app_messaging_campaigns ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const [countRows] = await connection.promise().query(
        `SELECT COUNT(*) as total FROM app_messaging_campaigns ${where}`,
        params
    );

    return { campaigns: rows, total: countRows[0].total, page, limit };
}

/**
 * Add recipients to a campaign (bulk insert).
 */
async function addRecipients(campaign_id, phones) {
    if (!phones.length) return 0;
    const values = phones.map(p => [campaign_id, p]);
    const [result] = await connection.promise().query(
        'INSERT INTO app_messaging_campaign_recipients (campaign_id, phone) VALUES ?',
        [values]
    );
    await connection.promise().query(
        'UPDATE app_messaging_campaigns SET total_recipients = ? WHERE campaign_id = ?',
        [phones.length, campaign_id]
    );
    return result.affectedRows;
}

/**
 * Get recipients for a campaign (paginated).
 */
async function getRecipients(campaign_id, { page = 1, limit = 50, status } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE campaign_id = ?';
    const params = [campaign_id];

    if (status) {
        where += ' AND status = ?';
        params.push(status);
    }

    const [rows] = await connection.promise().query(
        `SELECT * FROM app_messaging_campaign_recipients ${where} ORDER BY recipient_id LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );
    return rows;
}

/**
 * Get the next batch of pending recipients to send.
 */
async function getNextBatch(campaign_id, batchSize = 20) {
    const [rows] = await connection.promise().query(
        `SELECT * FROM app_messaging_campaign_recipients
         WHERE campaign_id = ? AND status = 'pending'
         ORDER BY recipient_id LIMIT ?`,
        [campaign_id, batchSize]
    );
    return rows;
}

/**
 * Mark a recipient as sent or failed.
 */
async function updateRecipientStatus(recipient_id, status, error_message) {
    await connection.promise().query(
        `UPDATE app_messaging_campaign_recipients
         SET status = ?, error_message = ?, sent_at = IF(? = 'sent', NOW(), NULL)
         WHERE recipient_id = ?`,
        [status, error_message || null, status, recipient_id]
    );
}

/**
 * Update campaign send counts.
 */
async function updateCounts(campaign_id) {
    await connection.promise().query(
        `UPDATE app_messaging_campaigns c SET
            sent_count = (SELECT COUNT(*) FROM app_messaging_campaign_recipients WHERE campaign_id = ? AND status = 'sent'),
            failed_count = (SELECT COUNT(*) FROM app_messaging_campaign_recipients WHERE campaign_id = ? AND status = 'failed')
         WHERE campaign_id = ?`,
        [campaign_id, campaign_id, campaign_id]
    );
}

/**
 * Update campaign status.
 */
async function updateStatus(campaign_id, store_id, status) {
    const extra = {};
    if (status === 'sending') extra.started_at = new Date();
    if (status === 'completed') extra.completed_at = new Date();

    const sets = ['status = ?'];
    const params = [status];

    if (extra.started_at) { sets.push('started_at = ?'); params.push(extra.started_at); }
    if (extra.completed_at) { sets.push('completed_at = ?'); params.push(extra.completed_at); }

    params.push(campaign_id, store_id);
    await connection.promise().query(
        `UPDATE app_messaging_campaigns SET ${sets.join(', ')} WHERE campaign_id = ? AND store_id = ?`,
        params
    );
}

/**
 * Cancel a campaign (only if draft or scheduled).
 */
async function cancel(campaign_id, store_id) {
    const [result] = await connection.promise().query(
        `UPDATE app_messaging_campaigns SET status = 'cancelled'
         WHERE campaign_id = ? AND store_id = ? AND status IN ('draft', 'scheduled')`,
        [campaign_id, store_id]
    );
    return result.affectedRows > 0;
}

module.exports = {
    create,
    getById,
    list,
    addRecipients,
    getRecipients,
    getNextBatch,
    updateRecipientStatus,
    updateCounts,
    updateStatus,
    cancel,
};
```

- [ ] **Step 2: Commit**

```bash
git add models/messaging-campaigns.js
git commit -m "feat: add campaigns model with recipient management and batch processing"
```

---

## Task 4: Campaign Sender Service

**Files:**
- Create: `selorax-messaging/services/campaign-sender.js`

- [ ] **Step 1: Create the campaign sender background service**

```javascript
const campaigns = require('../models/messaging-campaigns');
const messaging = require('../models/messaging');
const wallet = require('../models/messaging-wallet');
const { connection } = require('../startup/db');

const BATCH_SIZE = 20;
const POLL_INTERVAL_MS = 5000;
let pollInterval = null;

/**
 * Process active sending campaigns — called by poll interval.
 */
async function processCampaigns() {
    // Find campaigns that are 'sending' or 'scheduled' and due
    const [active] = await connection.promise().query(
        `SELECT * FROM app_messaging_campaigns
         WHERE (status = 'sending')
            OR (status = 'scheduled' AND scheduled_at <= NOW())
         ORDER BY created_at ASC LIMIT 5`
    );

    for (const campaign of active) {
        // Move scheduled → sending
        if (campaign.status === 'scheduled') {
            await campaigns.updateStatus(campaign.campaign_id, campaign.store_id, 'sending');
        }

        await processSingleCampaign(campaign);
    }
}

/**
 * Send the next batch of recipients for a campaign.
 */
async function processSingleCampaign(campaign) {
    const batch = await campaigns.getNextBatch(campaign.campaign_id, BATCH_SIZE);

    if (batch.length === 0) {
        // All recipients processed — mark completed
        await campaigns.updateCounts(campaign.campaign_id);
        await campaigns.updateStatus(campaign.campaign_id, campaign.store_id, 'completed');
        console.log(`[Campaign] ${campaign.campaign_id} completed for store ${campaign.store_id}`);
        return;
    }

    for (const recipient of batch) {
        // Check credits before each send
        const hasCredits = await wallet.hasCredits(campaign.store_id, 1);
        if (!hasCredits) {
            console.warn(`[Campaign] ${campaign.campaign_id} — out of credits, pausing`);
            // Update counts so far and stop
            await campaigns.updateCounts(campaign.campaign_id);
            return;
        }

        try {
            const result = await messaging.sendSms(
                campaign.store_id,
                campaign.installation_id,
                recipient.phone,
                campaign.message,
                { event_topic: 'campaign', resource_id: String(campaign.campaign_id) }
            );

            await campaigns.updateRecipientStatus(
                recipient.recipient_id,
                result.success ? 'sent' : 'failed',
                result.success ? null : 'SMS send failed'
            );
        } catch (err) {
            await campaigns.updateRecipientStatus(recipient.recipient_id, 'failed', err.message);
        }
    }

    // Update running counts
    await campaigns.updateCounts(campaign.campaign_id);
}

/**
 * Start the campaign sender polling loop.
 */
function start() {
    if (pollInterval) return;
    console.log('[CampaignSender] Started — polling every 5s');
    pollInterval = setInterval(async () => {
        try {
            await processCampaigns();
        } catch (err) {
            console.error('[CampaignSender] Poll error:', err.message);
        }
    }, POLL_INTERVAL_MS);
    pollInterval.unref();
}

function stop() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

module.exports = { processCampaigns, start, stop };
```

- [ ] **Step 2: Update `index.js` to start campaign sender alongside scheduler**

In `selorax-messaging/index.js`, after the scheduler.start() line, add:

```javascript
const campaignSender = require('./services/campaign-sender');
campaignSender.start();
```

- [ ] **Step 3: Commit**

```bash
git add services/campaign-sender.js index.js
git commit -m "feat: add campaign sender background service"
```

---

## Task 5: Automations Router

**Files:**
- Create: `selorax-messaging/routers/automations.js`
- Modify: `selorax-messaging/startup/routes.js`

- [ ] **Step 1: Create the automations router**

```javascript
const express = require('express');
const Router = express.Router();
const auth = require('../middlewares/auth');
const asyncMiddleware = require('../middlewares/asyncMiddleware');
const automations = require('../models/messaging-automations');

/**
 * GET /api/messaging/automations
 * List all automations for the store (seeds defaults if needed).
 */
Router.get('/', auth, asyncMiddleware(async (req, res) => {
    const list = await automations.getAll(req.user.store_id, req.installation.installation_id);
    res.send({
        message: 'Automations fetched.',
        data: {
            automations: list,
            variables: automations.TEMPLATE_VARIABLES,
        },
        status: 200,
    });
}));

/**
 * PUT /api/messaging/automations/:automation_id
 * Update an automation (toggle, template, delivery mode, delay).
 */
Router.put('/:automation_id', auth, asyncMiddleware(async (req, res) => {
    const updated = await automations.update(
        Number(req.params.automation_id),
        req.user.store_id,
        req.body
    );

    if (!updated) {
        return res.status(404).send({ message: 'Automation not found.', status: 404 });
    }

    res.send({ message: 'Automation updated.', data: updated, status: 200 });
}));

module.exports = Router;
```

- [ ] **Step 2: Mount the router in startup/routes.js**

Add this line after the `/api/messaging/payment` mount:

```javascript
app.use('/api/messaging/automations', require('../routers/automations'));
```

- [ ] **Step 3: Commit**

```bash
git add routers/automations.js startup/routes.js
git commit -m "feat: add automations routes (list + update)"
```

---

## Task 6: Campaigns Router

**Files:**
- Create: `selorax-messaging/routers/campaigns.js`
- Modify: `selorax-messaging/startup/routes.js`

- [ ] **Step 1: Create the campaigns router**

```javascript
const express = require('express');
const Router = express.Router();
const auth = require('../middlewares/auth');
const asyncMiddleware = require('../middlewares/asyncMiddleware');
const campaigns = require('../models/messaging-campaigns');
const wallet = require('../models/messaging-wallet');
const platformApi = require('../services/platform-api');

const BD_PHONE_REGEX = /^(?:\+?880|0)1[3-9]\d{8}$/;

/**
 * GET /api/messaging/campaigns
 * List campaigns (paginated).
 */
Router.get('/', auth, asyncMiddleware(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await campaigns.list(req.user.store_id, {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        status,
    });
    res.send({ message: 'Campaigns fetched.', data: result, status: 200 });
}));

/**
 * GET /api/messaging/campaigns/:campaign_id
 * Get single campaign with recipient stats.
 */
Router.get('/:campaign_id', auth, asyncMiddleware(async (req, res) => {
    const campaign = await campaigns.getById(Number(req.params.campaign_id), req.user.store_id);
    if (!campaign) {
        return res.status(404).send({ message: 'Campaign not found.', status: 404 });
    }

    const recipients = await campaigns.getRecipients(campaign.campaign_id, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 50,
        status: req.query.recipient_status,
    });

    res.send({
        message: 'Campaign fetched.',
        data: { ...campaign, recipients },
        status: 200,
    });
}));

/**
 * POST /api/messaging/campaigns
 * Create a campaign + add recipients.
 * Body: { name, message, audience_type, phones[], filters{}, scheduled_at }
 */
Router.post('/', auth, asyncMiddleware(async (req, res) => {
    const { name, message, audience_type, phones, filters, scheduled_at } = req.body;

    if (!name || !message) {
        return res.status(400).send({ message: 'name and message are required.', status: 400 });
    }

    let phoneList = [];

    if (audience_type === 'manual' || audience_type === 'csv') {
        // Manual / CSV — phones provided directly
        if (!Array.isArray(phones) || phones.length === 0) {
            return res.status(400).send({ message: 'phones array is required for manual audience.', status: 400 });
        }
        phoneList = phones
            .map(p => p.toString().replace(/[\s\-()]+/g, ''))
            .filter(p => BD_PHONE_REGEX.test(p));

        if (phoneList.length === 0) {
            return res.status(400).send({ message: 'No valid BD phone numbers found.', status: 400 });
        }
    } else if (audience_type === 'filter') {
        // Fetch customers from platform API using filters
        try {
            const result = await platformApi.get(req.user.store_id, '/customers', {
                ...filters,
                limit: 10000,
            });
            const customers = result?.data?.customers || result?.data || [];
            phoneList = customers
                .map(c => (c.phone || c.customer_phone || '').replace(/[\s\-()]+/g, ''))
                .filter(p => BD_PHONE_REGEX.test(p));
        } catch (err) {
            return res.status(502).send({
                message: 'Failed to fetch customers from platform.',
                status: 502,
            });
        }

        if (phoneList.length === 0) {
            return res.status(400).send({ message: 'No customers matched the filters.', status: 400 });
        }
    } else {
        return res.status(400).send({ message: 'Invalid audience_type.', status: 400 });
    }

    // Deduplicate
    phoneList = [...new Set(phoneList)];

    // Check credits
    const credits = await wallet.getCredits(req.user.store_id);
    if (credits < phoneList.length) {
        return res.status(402).send({
            message: `Not enough SMS credits. Need ${phoneList.length}, have ${credits}.`,
            sms_credits: credits,
            required: phoneList.length,
            status: 402,
        });
    }

    // Create campaign
    const campaign = await campaigns.create(req.user.store_id, req.installation.installation_id, {
        name,
        message,
        audience_type,
        audience_data: audience_type === 'filter' ? filters : { count: phoneList.length },
        scheduled_at,
    });

    // Add recipients
    await campaigns.addRecipients(campaign.campaign_id, phoneList);

    res.send({
        message: 'Campaign created.',
        data: { ...campaign, total_recipients: phoneList.length },
        status: 200,
    });
}));

/**
 * POST /api/messaging/campaigns/:campaign_id/send
 * Start sending a draft/scheduled campaign immediately.
 */
Router.post('/:campaign_id/send', auth, asyncMiddleware(async (req, res) => {
    const campaign = await campaigns.getById(Number(req.params.campaign_id), req.user.store_id);
    if (!campaign) {
        return res.status(404).send({ message: 'Campaign not found.', status: 404 });
    }
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        return res.status(400).send({ message: `Cannot send campaign in '${campaign.status}' status.`, status: 400 });
    }

    await campaigns.updateStatus(campaign.campaign_id, req.user.store_id, 'sending');
    res.send({ message: 'Campaign sending started.', status: 200 });
}));

/**
 * POST /api/messaging/campaigns/:campaign_id/cancel
 * Cancel a draft or scheduled campaign.
 */
Router.post('/:campaign_id/cancel', auth, asyncMiddleware(async (req, res) => {
    const cancelled = await campaigns.cancel(Number(req.params.campaign_id), req.user.store_id);
    if (!cancelled) {
        return res.status(400).send({ message: 'Campaign cannot be cancelled.', status: 400 });
    }
    res.send({ message: 'Campaign cancelled.', status: 200 });
}));

/**
 * GET /api/messaging/campaigns/audience/customers
 * Fetch customers from platform for audience selection.
 */
Router.get('/audience/customers', auth, asyncMiddleware(async (req, res) => {
    try {
        const result = await platformApi.get(req.user.store_id, '/customers', {
            page: req.query.page || 1,
            limit: req.query.limit || 50,
            search: req.query.search,
        });
        res.send({ message: 'Customers fetched.', data: result?.data, status: 200 });
    } catch (err) {
        res.status(502).send({ message: 'Failed to fetch customers.', status: 502 });
    }
}));

module.exports = Router;
```

- [ ] **Step 2: Mount in startup/routes.js**

Add after automations mount:

```javascript
app.use('/api/messaging/campaigns', require('../routers/campaigns'));
```

- [ ] **Step 3: Commit**

```bash
git add routers/campaigns.js startup/routes.js
git commit -m "feat: add campaigns routes (CRUD, send, cancel, audience)"
```

---

## Task 7: Update Webhook Receiver for Automations

**Files:**
- Modify: `selorax-messaging/routers/webhooks.js`

- [ ] **Step 1: Rewrite webhook receiver to use automations model instead of templates**

Replace the entire route handler for `POST /receive` in `webhooks.js`. The key changes:
- Use `automations.resolveEventKey()` instead of hardcoded STATUS_TO_EVENT_TOPIC
- Use `automations.getByEventKey()` instead of template lookup
- Support `order.created` and `customer.created`/`customer.updated` events
- Use automation's `delivery_mode` and `delay_minutes`
- Use `messaging.renderTemplate()` with automation's `template_text`

The new `STATUS_TO_EVENT_TOPIC` mapping, `verifySignature()`, phone validation, duplicate detection, variable rendering, and delay/scheduling logic all remain the same — the change is the data source (automations table instead of templates table).

Replace the `STATUS_TO_EVENT_TOPIC` constant and the route handler logic to call:
```javascript
const automations = require('../models/messaging-automations');
// ... in handler:
const eventKey = automations.resolveEventKey(eventTopic, orderStatus);
const automation = await automations.getByEventKey(store_id, eventKey);
// ... use automation.template_text, automation.delivery_mode, automation.delay_minutes
```

- [ ] **Step 2: Commit**

```bash
git add routers/webhooks.js
git commit -m "feat: webhook receiver uses automations model instead of templates"
```

---

## Task 8: Update Settings for Auto-Renewal

**Files:**
- Modify: `selorax-messaging/models/messaging.js` — add auto-renewal fields to `updateSettings`
- Modify: `selorax-messaging/services/scheduler.js` — add auto-renewal check

- [ ] **Step 1: Add auto-renewal fields to updateSettings allowed list**

In `models/messaging.js`, update the `allowed` array in `updateSettings()`:

```javascript
const allowed = [
    'is_enabled', 'use_own_provider', 'provider', 'api_key', 'sender_id',
    'provider_endpoint', 'auto_sms_enabled',
    'auto_renew_enabled', 'auto_renew_package_id', 'auto_renew_threshold',
];
```

- [ ] **Step 2: Add auto-renewal check to scheduler**

In `services/scheduler.js`, add a function that checks every 60 seconds if any store's credits are below their threshold and auto-renews:

```javascript
const payment = require('../models/messaging-payment');

async function checkAutoRenewals() {
    const [rows] = await connection.promise().query(
        `SELECT s.store_id, s.installation_id, s.sms_credits, s.auto_renew_package_id, s.auto_renew_threshold
         FROM app_messaging_settings s
         WHERE s.auto_renew_enabled = 1
           AND s.auto_renew_package_id IS NOT NULL
           AND s.sms_credits <= s.auto_renew_threshold`
    );

    for (const store of rows) {
        try {
            // Check if there's already a pending purchase (avoid double charge)
            const [pending] = await connection.promise().query(
                `SELECT 1 FROM app_messaging_purchases
                 WHERE store_id = ? AND status = 'pending'
                   AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) LIMIT 1`,
                [store.store_id]
            );
            if (pending.length > 0) continue;

            await payment.initiatePurchase(store.store_id, store.auto_renew_package_id);
            console.log(`[AutoRenew] Initiated purchase for store ${store.store_id}`);
        } catch (err) {
            console.error(`[AutoRenew] Failed for store ${store.store_id}:`, err.message);
        }
    }
}
```

Add a second interval in `start()`:
```javascript
let renewalInterval = null;
// In start():
renewalInterval = setInterval(() => checkAutoRenewals().catch(console.error), 60000);
renewalInterval.unref();
```

- [ ] **Step 3: Commit**

```bash
git add models/messaging.js services/scheduler.js
git commit -m "feat: add auto-renewal settings and background credit check"
```

---

## Task 9: Frontend — Update Tab Navigation

**Files:**
- Modify: `frontend-sms/components/MessagingTabNav.js`

- [ ] **Step 1: Update tabs to new structure**

Replace the tab config array to:

```javascript
const TABS = [
    { label: "Dashboard", href: "/" },
    { label: "Automations", href: "/automations" },
    { label: "Campaigns", href: "/campaigns" },
    { label: "History", href: "/history" },
    { label: "Billing", href: "/billing" },
    { label: "Settings", href: "/settings" },
];
```

Remove old tabs: Templates, Send, Scheduled.

- [ ] **Step 2: Commit**

```bash
cd /Volumes/Nimion/Selorax/frontend-sms
git add components/MessagingTabNav.js
git commit -m "feat: update tab nav to new structure (automations, campaigns, settings)"
```

---

## Task 10: Frontend — Automations Page

**Files:**
- Create: `frontend-sms/app/automations/page.js`
- Create: `frontend-sms/components/AutomationCard.js`

- [ ] **Step 1: Create AutomationCard component**

A card for each event showing: event label, event group badge, on/off toggle, delivery mode dropdown (instant/delayed/off), delay minutes input (if delayed), template textarea with variable badges, save button.

Props: `automation`, `variables`, `onSaved`

Key features:
- Toggle `is_active` via switch
- Select delivery_mode: instant | delayed | off
- If delayed: show delay_minutes number input
- Template editor with `{{variable}}` insertion badges
- Save calls `msgPut("/automations/{id}", updates)` and calls `onSaved()`

- [ ] **Step 2: Create automations page**

`app/automations/page.js` — fetches `GET /automations`, groups by `event_group`, renders AutomationCard for each.

Query key: `messaging-automations`

Layout:
- Header: "Automations" + description
- Group: "Order Events" — cards for order.confirmed, order.shipped, etc.
- Group: "Customer Events" — cards for customer.welcome, customer.updated

- [ ] **Step 3: Commit**

```bash
git add app/automations/page.js components/AutomationCard.js
git commit -m "feat: add automations page with per-event configuration"
```

---

## Task 11: Frontend — Campaign List Page

**Files:**
- Create: `frontend-sms/app/campaigns/page.js`
- Create: `frontend-sms/components/CampaignCard.js`

- [ ] **Step 1: Create CampaignCard component**

Shows: campaign name, status badge, audience type, total/sent/failed counts, progress bar (if sending), scheduled_at date, action buttons (Send Now, Cancel, View).

Props: `campaign`, `onAction`

- [ ] **Step 2: Create campaign list page**

`app/campaigns/page.js` — fetches `GET /campaigns`, paginated. "New Campaign" button links to `/campaigns/new`.

Query key: `messaging-campaigns`

- [ ] **Step 3: Commit**

```bash
git add app/campaigns/page.js components/CampaignCard.js
git commit -m "feat: add campaigns list page"
```

---

## Task 12: Frontend — Create Campaign Page

**Files:**
- Create: `frontend-sms/app/campaigns/new/page.js`
- Create: `frontend-sms/components/AudienceSelector.js`

- [ ] **Step 1: Create AudienceSelector component**

Two modes:
- **Manual:** textarea for pasting phone numbers (one per line), with count display and validation
- **Platform:** search customers from `GET /campaigns/audience/customers`, checkboxes to select, shows name + phone

Props: `onPhonesChange(phones[])`, `audienceType`, `onTypeChange`

Tabs to switch between "Paste Numbers" and "Select Customers"

- [ ] **Step 2: Create the campaign creation page**

`app/campaigns/new/page.js` — wizard-style form:
1. Campaign name input
2. AudienceSelector → produces phone list
3. Message textarea with character count / SMS parts
4. Schedule toggle: "Send Now" or pick date/time
5. Summary: X recipients, Y SMS credits needed
6. "Create Campaign" button → `POST /campaigns`
7. On success → redirect to `/campaigns`

- [ ] **Step 3: Commit**

```bash
git add app/campaigns/new/page.js components/AudienceSelector.js
git commit -m "feat: add create campaign page with audience selector"
```

---

## Task 13: Frontend — Campaign Detail Page

**Files:**
- Create: `frontend-sms/app/campaigns/[id]/page.js`

- [ ] **Step 1: Create campaign detail page**

Fetches `GET /campaigns/:id`. Shows:
- Campaign name, status badge, message preview
- Progress: sent_count / total_recipients with progress bar
- Stats cards: Total, Sent, Failed, Credits Used
- Recipient table (paginated) with phone, status badge, sent_at
- Action buttons: "Send Now" (if draft), "Cancel" (if draft/scheduled)

Query key: `messaging-campaign-detail`

Auto-refetch every 3 seconds while status is 'sending'.

- [ ] **Step 2: Commit**

```bash
git add app/campaigns/\\[id\\]/page.js
git commit -m "feat: add campaign detail page with live progress"
```

---

## Task 14: Frontend — Settings Page

**Files:**
- Create: `frontend-sms/app/settings/page.js`
- Create: `frontend-sms/components/HelpSection.js`

- [ ] **Step 1: Create HelpSection component**

Collapsible sections explaining:
- **Automations:** How to set up event-triggered SMS (toggle on, write template, choose instant/delayed)
- **Campaigns:** How to send bulk SMS (create campaign, select audience, schedule or send)
- **Templates:** Available variables ({{order_id}}, {{customer_name}}, etc.) with examples
- **Billing:** How packages work, auto-renewal
- **SMS Credits:** How credits are deducted (1 credit per SMS part)

- [ ] **Step 2: Create settings page**

`app/settings/page.js` — sections:

1. **Auto-SMS** — toggle `auto_sms_enabled` (existing)
2. **Auto-Renewal** — toggle `auto_renew_enabled`, select package dropdown, threshold number input
3. **SMS Provider** — toggle `use_own_provider`, fields for api_key, sender_id, provider_endpoint (shown only if own provider enabled)
4. **Help & Instructions** — HelpSection component

Fetches: `GET /settings`, `GET /payment/packages`
Saves: `PUT /settings`

- [ ] **Step 3: Commit**

```bash
git add app/settings/page.js components/HelpSection.js
git commit -m "feat: add settings page with auto-renewal, provider config, help"
```

---

## Task 15: Frontend — Update Dashboard

**Files:**
- Modify: `frontend-sms/app/page.js`

- [ ] **Step 1: Update dashboard to show new features**

Keep existing: WalletCard, stats row, recent logs.

Add:
- Active automations count badge
- Recent campaigns summary (last 3 campaigns with status)
- Quick action buttons: "New Campaign", "Manage Automations"
- Remove the old auto-SMS toggle (moved to Settings)

Fetch additional: `GET /automations` (count active), `GET /campaigns?limit=3` (recent)

- [ ] **Step 2: Commit**

```bash
git add app/page.js
git commit -m "feat: update dashboard with automations count and recent campaigns"
```

---

## Task 16: Frontend — Enhanced History Page

**Files:**
- Modify: `frontend-sms/app/history/page.js`

- [ ] **Step 1: Add event type and date range filters**

Current filters: status, phone search.

Add:
- Event type dropdown: all, order.confirmed, order.shipped, ..., campaign, manual
- Date range: from/to date inputs
- Pass as query params to `GET /logs`

- [ ] **Step 2: Commit**

```bash
git add app/history/page.js
git commit -m "feat: add event type and date range filters to history"
```

---

## Task 17: Backend — Update Logs Endpoint for New Filters

**Files:**
- Modify: `selorax-messaging/models/messaging.js`
- Modify: `selorax-messaging/routers/messaging.js`

- [ ] **Step 1: Add event_topic and date filters to getLogs**

Update `getLogs()` in `models/messaging.js` to accept `event_topic`, `from_date`, `to_date`:

```javascript
if (event_topic) {
    where += ' AND event_topic = ?';
    params.push(event_topic);
}
if (from_date) {
    where += ' AND created_at >= ?';
    params.push(from_date);
}
if (to_date) {
    where += ' AND created_at <= ?';
    params.push(to_date);
}
```

Update the `/logs` route to pass these from `req.query`.

- [ ] **Step 2: Commit**

```bash
git add models/messaging.js routers/messaging.js
git commit -m "feat: add event_topic and date range filters to logs endpoint"
```

---

## Task 18: Frontend — Update Billing with Auto-Renewal Badge

**Files:**
- Modify: `frontend-sms/components/WalletCard.js`
- Modify: `frontend-sms/app/billing/page.js`

- [ ] **Step 1: Show auto-renewal status on WalletCard**

Fetch settings data. If `auto_renew_enabled`, show a small badge: "Auto-renew: ON (Package Name, below X SMS)".

Update WalletCard props to accept `autoRenew` object.

- [ ] **Step 2: Commit**

```bash
git add components/WalletCard.js app/billing/page.js
git commit -m "feat: show auto-renewal status on billing page"
```

---

## Task 19: Integration — Wire Send Page into Campaigns

**Files:**
- Modify: `frontend-sms/app/send/page.js` (optional — redirect to campaigns/new or keep as quick-send)

- [ ] **Step 1: Keep manual send as a quick action on dashboard**

Move the SendSmsForm into the dashboard page as a collapsible "Quick Send" section. The standalone `/send` page can redirect to `/campaigns/new` for bulk, or remain as a simple single-SMS sender.

Since the existing SendSmsForm works with SMS credits, keep it functional. Just ensure the dashboard has a "Send SMS" button that expands the form inline.

- [ ] **Step 2: Commit**

```bash
git add app/page.js app/send/page.js
git commit -m "feat: integrate quick send into dashboard"
```

---

## Task 20: Final — Test Full Flow & Cleanup

- [ ] **Step 1: Run backend**

```bash
cd /Volumes/Nimion/Selorax/selorax-messaging && node index.js
```

Verify: health check, automations list, campaigns CRUD, packages list all return 200.

- [ ] **Step 2: Run frontend**

```bash
cd /Volumes/Nimion/Selorax/frontend-sms && yarn dev
```

Verify all pages render without errors: Dashboard, Automations, Campaigns, History, Billing, Settings.

- [ ] **Step 3: Final commit**

```bash
# Backend
cd /Volumes/Nimion/Selorax/selorax-messaging
git add -A && git commit -m "chore: cleanup and final wiring"

# Frontend
cd /Volumes/Nimion/Selorax/frontend-sms
git add -A && git commit -m "chore: cleanup and final wiring"
```
