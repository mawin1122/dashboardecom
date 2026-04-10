const connection = require('../config/db');

const TAX_PERCENT_DEFAULT = 2.3;
const GIFT_URL_RE = /^https:\/\/gift\.truemoney\.com\/campaign\/?\?v=([a-zA-Z0-9]+)$/i;
const HASH_RE = /^[a-zA-Z0-9]+$/;

const query = (sql, params = []) => new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
        if (err) return reject(err);
        return resolve(results);
    });
});

const ensureTopupTables = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS topup_settings (
            id TINYINT PRIMARY KEY,
            recipient_mobile VARCHAR(20) DEFAULT NULL,
            tax_enabled TINYINT(1) NOT NULL DEFAULT 1,
            tax_percent DECIMAL(5,2) NOT NULL DEFAULT 2.30,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS topup_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            voucher_hash VARCHAR(128) NOT NULL UNIQUE,
            amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            tax_percent_applied DECIMAL(5,2) NOT NULL DEFAULT 0,
            tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            net_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'success',
            provider_response LONGTEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_topup_transactions_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await query(
        `INSERT INTO topup_settings (id, recipient_mobile, tax_enabled, tax_percent)
         VALUES (1, NULL, 1, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [TAX_PERCENT_DEFAULT]
    );
};

const normalizeMobile = (value) => String(value || '').replace(/\D+/g, '').trim();

const parseVoucherHash = (giftLink) => {
    const input = String(giftLink || '').trim();

    // Support direct hash input by user.
    if (HASH_RE.test(input)) {
        return input;
    }

    const strict = input.match(GIFT_URL_RE);
    if (strict) {
        return strict[1];
    }

    // Primary parser: accept a valid TrueMoney campaign URL and read query param `v`.
    try {
        const parsed = new URL(input);
        const isTargetHost = String(parsed.hostname || '').toLowerCase() === 'gift.truemoney.com';
        const isTargetPath = String(parsed.pathname || '').replace(/\/+$/, '') === '/campaign';
        const rawHash = String(parsed.searchParams.get('v') || '').trim();

        if (isTargetHost && isTargetPath && HASH_RE.test(rawHash)) {
            return rawHash;
        }
    } catch {
        // fallback regex below
    }

    // Fallback parser: still support direct/pasted text that matches known shape.
    const match = input.match(/https:\/\/gift\.truemoney\.com\/campaign\/?\?v=([a-zA-Z0-9]+)/i);
    return match ? match[1] : null;
};

const readSettingRow = async () => {
    const rows = await query('SELECT id, recipient_mobile, tax_enabled, tax_percent FROM topup_settings WHERE id = 1 LIMIT 1');
    return rows[0] || {
        id: 1,
        recipient_mobile: null,
        tax_enabled: 1,
        tax_percent: TAX_PERCENT_DEFAULT,
    };
};

const extractNumbersDeep = (node, out = []) => {
    if (node == null) return out;

    if (typeof node === 'number' && Number.isFinite(node)) {
        out.push(node);
        return out;
    }

    if (typeof node === 'string') {
        const numeric = Number(node.replace(/,/g, ''));
        if (Number.isFinite(numeric)) {
            out.push(numeric);
        }
        return out;
    }

    if (Array.isArray(node)) {
        node.forEach((item) => extractNumbersDeep(item, out));
        return out;
    }

    if (typeof node === 'object') {
        Object.entries(node).forEach(([key, value]) => {
            const normalizedKey = String(key || '').toLowerCase();
            if (normalizedKey.includes('amount') || normalizedKey.includes('baht') || normalizedKey.includes('redeem')) {
                extractNumbersDeep(value, out);
            } else if (typeof value === 'object') {
                extractNumbersDeep(value, out);
            }
        });
    }

    return out;
};

const extractAmountFromProvider = (payload) => {
    if (!payload || typeof payload !== 'object') return 0;

    const knownPaths = [
        payload?.data?.voucher?.amount_baht,
        payload?.data?.my_ticket?.amount_baht,
        payload?.data?.amount_baht,
        payload?.voucher?.amount_baht,
        payload?.amount_baht,
        payload?.data?.amount,
        payload?.amount,
    ];

    for (const value of knownPaths) {
        const num = Number(String(value ?? '').replace(/,/g, ''));
        if (Number.isFinite(num) && num > 0) {
            return num;
        }
    }

    const numbers = extractNumbersDeep(payload, []).filter((n) => Number.isFinite(n) && n > 0);
    return numbers.length > 0 ? Math.max(...numbers) : 0;
};

const isProviderSuccess = (statusCode, payload) => {
    const code = String(payload?.status?.code || payload?.code || '').toLowerCase();
    const message = String(payload?.status?.message || payload?.message || '').toLowerCase();
    if (code.includes('success') || message.includes('success')) {
        return true;
    }
    if (code.includes('fail') || code.includes('error') || message.includes('fail') || message.includes('error')) {
        return false;
    }
    return statusCode >= 200 && statusCode < 300;
};

const extractProviderReason = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return '';
    }

    const candidates = [
        payload?.status?.message,
        payload?.status?.reason,
        payload?.message,
        payload?.reason,
        payload?.error?.message,
        payload?.error,
    ];

    for (const value of candidates) {
        const text = String(value || '').trim();
        if (text) {
            return text;
        }
    }

    return '';
};

exports.getTopupSettingsPublic = async (req, res) => {
    try {
        await ensureTopupTables();
        const setting = await readSettingRow();

        return res.json({
            tax_enabled: Number(setting.tax_enabled) === 1,
            tax_percent: Number(setting.tax_percent || TAX_PERCENT_DEFAULT),
        });
    } catch (err) {
        console.error('Error getting topup public settings:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getTopupSettingsAdmin = async (req, res) => {
    try {
        await ensureTopupTables();
        const setting = await readSettingRow();

        return res.json({
            recipient_mobile: setting.recipient_mobile || '',
            tax_enabled: Number(setting.tax_enabled) === 1,
            tax_percent: Number(setting.tax_percent || TAX_PERCENT_DEFAULT),
        });
    } catch (err) {
        console.error('Error getting topup admin settings:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateTopupSettingsAdmin = async (req, res) => {
    const { recipient_mobile, tax_enabled } = req.body || {};
    const mobile = normalizeMobile(recipient_mobile);

    if (!mobile || mobile.length < 9 || mobile.length > 15) {
        return res.status(400).json({ error: 'recipient_mobile is invalid' });
    }

    const taxEnabledFlag = Boolean(tax_enabled) ? 1 : 0;

    try {
        await ensureTopupTables();

        await query(
            `UPDATE topup_settings
             SET recipient_mobile = ?, tax_enabled = ?, tax_percent = ?
             WHERE id = 1`,
            [mobile, taxEnabledFlag, TAX_PERCENT_DEFAULT]
        );

        return res.json({
            message: 'Topup settings updated successfully',
            recipient_mobile: mobile,
            tax_enabled: taxEnabledFlag === 1,
            tax_percent: TAX_PERCENT_DEFAULT,
        });
    } catch (err) {
        console.error('Error updating topup settings:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.redeemVoucher = async (req, res) => {
    const userId = Number(req.user?.id || req.session?.userId);
    const giftLink = String(req.body?.gift_link || '').trim();

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const voucherHash = parseVoucherHash(giftLink);
    if (!voucherHash) {
        return res.status(400).json({
            error: 'URL ซองอั่งเปาไม่ถูกต้อง',
            reason: 'รูปแบบที่ถูกต้อง: https://gift.truemoney.com/campaign/?v=xxxxxxxx',
        });
    }

    try {
        await ensureTopupTables();
        const setting = await readSettingRow();
        const recipientMobile = normalizeMobile(setting.recipient_mobile);

        if (!recipientMobile || !/^\d+$/.test(recipientMobile)) {
            return res.status(400).json({
                error: 'ยังไม่ได้ตั้งค่าเบอร์รับซองในหลังบ้าน',
                reason: 'เบอร์โทรยังไม่ถูกตั้งค่า หรือรูปแบบไม่ถูกต้อง',
            });
        }

        const existing = await query("SELECT id, status FROM topup_transactions WHERE voucher_hash = ? AND status = 'success' LIMIT 1", [voucherHash]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'ซองนี้ถูกใช้งานไปแล้ว' });
        }

        const redeemUrl = `https://gift.truemoney.com/campaign/vouchers/${voucherHash}/redeem`;
        const providerResponse = await fetch(redeemUrl, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                origin: 'https://gift.truemoney.com',
                referer: 'https://gift.truemoney.com/campaign/card',
                'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1 Edg/146.0.0.0',
                'accept-language': 'th-TH,th;q=0.9,en;q=0.8',
            },
            body: JSON.stringify({
                mobile: recipientMobile,
                voucher_hash: voucherHash,
            }),
        });

        const rawText = await providerResponse.text();
        let payload = null;
        try {
            payload = JSON.parse(rawText);
        } catch {
            const isForbidden = providerResponse.status === 403;
            return res.status(400).json({
                error: 'Redeem ไม่สำเร็จ',
                reason: isForbidden
                    ? 'ผู้ให้บริการปฏิเสธคำขอ (HTTP 403) จากระบบป้องกันความปลอดภัย/anti-bot'
                    : `ไม่สามารถอ่าน JSON จากผู้ให้บริการได้ (HTTP ${providerResponse.status})`,
                hint: isForbidden
                    ? 'ลิงก์อาจถูกต้อง แต่คำขอจากเซิร์ฟเวอร์นี้ถูกบล็อกโดยผู้ให้บริการ'
                    : undefined,
                provider_status: providerResponse.status,
                provider_response: rawText,
            });
        }

        const providerCode = String(payload?.status?.code || payload?.code || '').toUpperCase();
        const success = providerResponse.status === 200 && providerCode === 'SUCCESS';
        const amount = Number(payload?.data?.my_ticket?.amount_baht) || extractAmountFromProvider(payload);

        if (!success || amount <= 0) {
            const providerReason = extractProviderReason(payload);
            const reason = providerReason || (amount <= 0 ? 'ไม่สามารถอ่านยอดเงินจากซองได้' : 'ผู้ให้บริการปฏิเสธการ Redeem');

            return res.status(400).json({
                error: 'Redeem ไม่สำเร็จ',
                reason,
                provider_status: providerResponse.status,
                provider_response: payload,
            });
        }

        const taxEnabled = Number(setting.tax_enabled) === 1;
        const taxPercent = taxEnabled ? Number(setting.tax_percent || TAX_PERCENT_DEFAULT) : 0;
        const taxAmount = Number((amount * (taxPercent / 100)).toFixed(2));
        const netAmount = Number((amount - taxAmount).toFixed(2));
        const pointsToAdd = Math.max(0, Math.floor(netAmount));

        await query('UPDATE users SET point = COALESCE(point, 0) + ? WHERE id = ?', [pointsToAdd, userId]);

        await query(
            `INSERT INTO topup_transactions
            (user_id, voucher_hash, amount, tax_percent_applied, tax_amount, net_amount, status, provider_response)
            VALUES (?, ?, ?, ?, ?, ?, 'success', ?)`,
            [
                userId,
                voucherHash,
                amount,
                taxPercent,
                taxAmount,
                netAmount,
                JSON.stringify(payload),
            ]
        );

        return res.json({
            message: 'เติมเงินสำเร็จ',
            voucher_hash: voucherHash,
            amount,
            tax_enabled: taxEnabled,
            tax_percent: taxPercent,
            tax_amount: taxAmount,
            net_amount: netAmount,
            points_added: pointsToAdd,
        });
    } catch (err) {
        if (err && err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'ซองนี้ถูกใช้งานไปแล้ว' });
        }

        console.error('Error redeeming voucher:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
