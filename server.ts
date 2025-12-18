
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/medisure_db',
});

// --- Routes ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Members
app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/members', async (req, res) => {
  const m = req.body;
  const query = `
    INSERT INTO members (
      id, first_name, middle_name, last_name, email, id_number, dob, marital_status, 
      employee_number, address, phone_number, gender, status, banking_details, dependants, agent_ids, 
      medical_history, photo_url, application_form_url, premium_payer, premium_payer_id, 
      policy_id, join_date, policy_end_date, balance
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
    RETURNING *;
  `;
  const values = [
    m.id, m.first_name, m.middle_name, m.last_name, m.email, m.id_number, m.dob, m.marital_status,
    m.employee_number, m.address, m.phone_number, m.gender, m.status, m.banking_details, JSON.stringify(m.dependants), m.agent_ids,
    JSON.stringify(m.medical_history), m.photo_url, m.application_form_url, m.premium_payer, m.premium_payer_id,
    m.policy_id, m.join_date, m.policy_end_date, m.balance
  ];
  
  try {
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/members/bulk-status', async (req, res) => {
    const { ids, status } = req.body;
    try {
        await pool.query('UPDATE members SET status = $1 WHERE id = ANY($2)', [status, ids]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Policies & Benefits
app.get('/api/policies', async (req, res) => {
    const result = await pool.query('SELECT * FROM policies');
    res.json(result.rows);
});

app.post('/api/policies', async (req, res) => {
    const p = req.body;
    const query = `
        INSERT INTO policies (id, name, type, currency, coverage_limit, copay, premium, features, benefits)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, premium = EXCLUDED.premium, benefits = EXCLUDED.benefits
        RETURNING *;
    `;
    try {
        const result = await pool.query(query, [p.id, p.name, p.type, p.currency, p.coverage_limit, p.copay, p.premium, p.features, JSON.stringify(p.benefits)]);
        res.json(result.rows[0]);
    } catch (err: any) { res.status(500).json({error: err.message}); }
});

app.get('/api/benefits', async (req, res) => {
    const result = await pool.query('SELECT * FROM benefits');
    res.json(result.rows);
});

app.post('/api/benefits', async (req, res) => {
    const b = req.body;
    const query = 'INSERT INTO benefits (id, name, description, limit_type) VALUES ($1, $2, $3, $4) ON CONFLICT(id) DO NOTHING RETURNING *';
    try {
        const result = await pool.query(query, [b.id, b.name, b.description, b.limit_type]);
        res.json(result.rows[0] || b);
    } catch (err: any) { res.status(500).json({error: err.message}); }
});

app.delete('/api/benefits/:id', async (req, res) => {
    await pool.query('DELETE FROM benefits WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

// Providers
app.get('/api/providers', async (req, res) => {
    const result = await pool.query('SELECT * FROM providers ORDER BY created_at DESC');
    res.json(result.rows);
});

app.post('/api/providers', async (req, res) => {
    const p = req.body;
    const query = `
        INSERT INTO providers (
            id, name, discipline, type, status, afhoz_number, license_number, tax_clearance_expiry, 
            tax_clearance_url, address, primary_contact_person, primary_contact_phone, email, 
            banking_details, location, accreditation_level, joined_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, status = EXCLUDED.status, email = EXCLUDED.email
        RETURNING *;
    `;
    try {
        const result = await pool.query(query, [
            p.id, p.name, p.discipline, p.type, p.status, p.afhoz_number, p.license_number, 
            p.tax_clearance_expiry, p.tax_clearance_url, p.address, p.primary_contact_person,
            p.primary_contact_phone, p.email, p.banking_details, p.location, p.accreditation_level, p.joined_date
        ]);
        res.json(result.rows[0]);
    } catch (err: any) { res.status(500).json({error: err.message}); }
});

// Claims
app.get('/api/claims', async (req, res) => {
    const providerId = req.query.provider_id;
    let query = 'SELECT * FROM claims';
    let params: any[] = [];
    
    if (providerId) {
        query += ' WHERE provider_id = $1';
        params.push(providerId);
    }
    query += ' ORDER BY submission_date DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
});

app.post('/api/claims', async (req, res) => {
    const c = req.body;
    const query = `
        INSERT INTO claims (
            id, member_id, patient_name, member_name, provider_id, provider_name, service_date, 
            submission_date, diagnosis_code, procedure_code, amount_billed, amount_approved, 
            status, description, captured_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *
    `;
    try {
        const result = await pool.query(query, [
            c.id, c.member_id, c.patient_name, c.member_name, c.provider_id, c.provider_name,
            c.service_date, c.submission_date, c.diagnosis_code, c.procedure_code, c.amount_billed,
            c.amount_approved, c.status, c.description, c.captured_by
        ]);
        res.json(result.rows[0]);
    } catch(err: any) { res.status(500).json({error: err.message}); }
});

app.put('/api/claims/:id', async (req, res) => {
    const { status, amount_approved, approved_by } = req.body;
    try {
        if (amount_approved !== undefined) {
             await pool.query('UPDATE claims SET status=$1, amount_approved=$2, approved_by=$3 WHERE id=$4', [status, amount_approved, approved_by, req.params.id]);
        } else {
             await pool.query('UPDATE claims SET status=$1, approved_by=$2 WHERE id=$3', [status, approved_by, req.params.id]);
        }
        res.json({success: true});
    } catch(err:any) { res.status(500).json({error: err.message}); }
});

// Users
app.get('/api/users', async (req, res) => {
    const result = await pool.query('SELECT * FROM app_users');
    res.json(result.rows);
});

// Payers
app.get('/api/payers', async (req, res) => {
    const result = await pool.query('SELECT * FROM premium_payers ORDER BY name');
    res.json(result.rows);
});

app.post('/api/payers', async (req, res) => {
    const p = req.body;
    const query = `
        INSERT INTO premium_payers (id, name, type, address, contact_person, phone, email, tax_id, payment_terms, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name
        RETURNING *
    `;
    try {
        const result = await pool.query(query, [p.id, p.name, p.type, p.address, p.contact_person, p.phone, p.email, p.tax_id, p.payment_terms, p.status]);
        res.json(result.rows[0]);
    } catch(err:any) { res.status(500).json({error: err.message}); }
});

// Invoices & Payments
app.get('/api/invoices', async (req, res) => {
    const payerId = req.query.payer_id;
    let result;
    if (payerId) {
        result = await pool.query('SELECT * FROM invoices WHERE payer_id = $1 ORDER BY invoice_date DESC', [payerId]);
    } else {
        result = await pool.query('SELECT * FROM invoices ORDER BY invoice_date DESC');
    }
    res.json(result.rows);
});

app.post('/api/invoices', async (req, res) => {
    const i = req.body;
    const query = `INSERT INTO invoices (id, payer_id, invoice_date, due_date, period, total_amount, paid_amount, status, billing_run_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
    try {
        const result = await pool.query(query, [i.id, i.payer_id, i.invoice_date, i.due_date, i.period, i.total_amount, i.paid_amount, i.status, i.billing_run_id]);
        res.json(result.rows[0]);
    } catch(err:any) { res.status(500).json({error: err.message}); }
});

// Agents & Commissions
app.get('/api/agents', async (req, res) => {
    const result = await pool.query('SELECT * FROM agents');
    res.json(result.rows);
});

app.post('/api/agents', async (req, res) => {
    const a = req.body;
    const query = `INSERT INTO agents (id, name, type, nrc_id, email, phone, address, status, date_onboarded, commission_balance, bank_details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
    try {
        const result = await pool.query(query, [a.id, a.name, a.type, a.nrcId, a.email, a.phone, a.address, a.status, a.dateOnboarded, a.commissionBalance, a.bankDetails]);
        res.json(result.rows[0]);
    } catch(err:any) { res.status(500).json({error: err.message}); }
});

app.get('/api/commissions', async (req, res) => {
    const result = await pool.query('SELECT * FROM commissions ORDER BY calculation_date DESC');
    res.json(result.rows);
});

// --- Settings & Metadata Routes ---

app.get('/api/medical-codes', async (req, res) => {
    const result = await pool.query('SELECT * FROM medical_codes');
    res.json(result.rows);
});

app.post('/api/medical-codes', async (req, res) => {
    const c = req.body;
    const query = `INSERT INTO medical_codes (id, code, description, type, price, effective_date, status, category, discipline_id, benefit_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
    try {
        const result = await pool.query(query, [c.id, c.code, c.description, c.type, c.price, c.effectiveDate, c.status, c.category, c.disciplineId, c.benefitId]);
        res.json(result.rows[0]);
    } catch(err:any) { res.status(500).json({error: err.message}); }
});

app.get('/api/disciplines', async (req, res) => {
    const result = await pool.query('SELECT * FROM provider_disciplines');
    res.json(result.rows);
});

app.post('/api/disciplines', async (req, res) => {
    const d = req.body;
    const query = `INSERT INTO provider_disciplines (id, code, name, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    try {
        const result = await pool.query(query, [d.id, d.code, d.name, d.description, d.status]);
        res.json(result.rows[0]);
    } catch(err:any) { res.status(500).json({error: err.message}); }
});

// --- Accounting Routes ---

app.get('/api/accounts', async (req, res) => {
    const result = await pool.query('SELECT * FROM accounts ORDER BY code');
    res.json(result.rows);
});

app.get('/api/journals', async (req, res) => {
    const result = await pool.query('SELECT * FROM journal_entries ORDER BY transaction_date DESC LIMIT 50');
    res.json(result.rows);
});

// --- Automation & Billing Operations ---

app.get('/api/billing-runs', async (req, res) => {
    const result = await pool.query('SELECT * FROM billing_runs ORDER BY created_at DESC');
    res.json(result.rows);
});

app.get('/api/automation-runs', async (req, res) => {
    const result = await pool.query('SELECT * FROM automation_runs ORDER BY executed_at DESC');
    res.json(result.rows);
});

// --- Static Frontend Serving ---
const clientPath = path.join(__dirname, '../client');

app.use(express.static(clientPath));

// Handle client-side routing, return all requests to the app
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientPath, 'index.html'));
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
