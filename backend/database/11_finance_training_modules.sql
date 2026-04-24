-- ===========================================
-- Finance Department Security Training Modules
-- Goal: Detect subtle fraud and resist authority pressure
-- ===========================================

-- Module 1: Business Email Compromise (BEC)
INSERT INTO public.training_modules (
  company_id,
  target_department_id,
  title,
  description,
  category,
  difficulty,
  estimated_minutes,
  content,
  is_active,
  passing_score,
  created_by
)
SELECT
  c.id AS company_id,
  d.id AS target_department_id,
  'Business Email Compromise (BEC) Detection' AS title,
  'Learn to identify and respond to Business Email Compromise attacks targeting finance departments. Recognize CEO impersonation, authority pressure tactics, and payment diversion schemes.' AS description,
  'social_engineering' AS category,
  'intermediate' AS difficulty,
  45 AS estimated_minutes,
  jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'What is Business Email Compromise (BEC)?',
        'content', 'Business Email Compromise is a sophisticated social engineering attack where fraudsters impersonate executives, often the CEO or CFO, to pressure employees into transferring funds or disclosing sensitive information. Unlike phishing, BEC targets specific financial processes and authority structures.',
        'duration_minutes', 8
      ),
      jsonb_build_object(
        'title', 'Common BEC Attack Patterns in Finance',
        'content', jsonb_build_array(
          jsonb_build_object(
            'pattern', 'Urgent Payment Requests',
            'description', 'Fake CEO emails requesting immediate wire transfers for "confidential deals" or "emergency acquisitions"',
            'red_flags', jsonb_build_array(
              'Unusual urgency or time pressure',
              'Request to bypass normal approval process',
              'Request to use unusual payment methods',
              'Threatening tone about secrecy'
            )
          ),
          jsonb_build_object(
            'pattern', 'Authority Impersonation',
            'description', 'Attacker assumes identity of company executive with access to financial systems',
            'red_flags', jsonb_build_array(
              'Email from look-alike domain (e.g., ceo@company.co instead of ceo@company.com)',
              'Unusual email behavior or formatting',
              'Requests sent outside business hours',
              'Generic greetings like "Hi there" instead of names'
            )
          ),
          jsonb_build_object(
            'pattern', 'Account Takeover',
            'description', 'Actual compromise of executive email account through phishing or credential theft',
            'red_flags', jsonb_build_array(
              'Verified sender but unusual content/requests',
              'Email metadata shows unusual access locations',
              'Requests for sensitive financial information'
            )
          )
        ),
        'duration_minutes', 10
      ),
      jsonb_build_object(
        'title', 'High-Pressure Tactics Recognition',
        'content', 'BEC attackers use psychological manipulation to override normal procedures. Recognize and resist these tactics.',
        'tactics', jsonb_build_array(
          jsonb_build_object(
            'tactic', 'Time Pressure',
            'example', '"Wire $50,000 to this account immediately. Deal closes at 5 PM today. Do NOT tell anyone about this."',
            'resistance_strategy', 'Pause and verify through established channels. Real executives understand the need for verification.'
          ),
          jsonb_build_object(
            'tactic', 'Confidentiality Demands',
            'example', '"This is highly confidential. Do not discuss with anyone in accounting or compliance."',
            'resistance_strategy', 'This is a RED FLAG. Legitimate business always involves proper authorization and documentation.'
          ),
          jsonb_build_object(
            'tactic', 'Threat/Intimidation',
            'example', '"If you cannot handle this, I''ll find someone who can. Your job depends on your discretion."',
            'resistance_strategy', 'Report immediately to compliance and management. No legitimate executive threatens employees for following proper procedures.'
          ),
          jsonb_build_object(
            'tactic', 'False Legitimacy',
            'example', 'Includes company logos, recent business information, accurate employee names',
            'resistance_strategy', 'Always independently verify using known contact information, not details from the suspicious email.'
          )
        ),
        'duration_minutes', 12
      ),
      jsonb_build_object(
        'title', 'Live Email Analysis Activity',
        'content', 'You will receive 5 email samples (3 fake BEC attempts, 2 legitimate emails). Analyze each for:
1. Sender verification (domain, email metadata)
2. Content for pressure tactics
3. Request legitimacy against standard procedures
4. Recommended action',
        'activity_type', 'interactive_analysis',
        'samples_count', 5,
        'duration_minutes', 10
      ),
      jsonb_build_object(
        'title', 'CEO Impersonation Role-Play',
        'content', 'Interactive role-play scenario where you receive a high-pressure email from someone claiming to be the CEO requesting an urgent wire transfer. You must:
1. Identify red flags
2. Ask verification questions
3. Follow proper escalation procedures
4. Document the incident',
        'activity_type', 'role_play',
        'scenario_type', 'ceo_impersonation',
        'duration_minutes', 5
      )
    ),
    'learning_objectives', jsonb_build_array(
      'Identify psychological pressure tactics used in BEC attacks',
      'Recognize common BEC patterns targeting finance departments',
      'Implement verification procedures that overcome pressure',
      'Understand proper escalation and reporting channels',
      'Resist authority pressure while maintaining professional relationships'
    ),
    'key_takeaways', jsonb_build_array(
      'Real executives understand proper procedures and verification needs',
      'Requests to bypass controls are NOT legitimate business practices',
      'Time pressure is a manipulative tactic; pause and verify',
      'Confidentiality claims used to hide fraud; legitimate deals have documentation',
      'Your role in fraud prevention is valued and protected'
    )
  ) AS content
FROM public.companies c
JOIN public.departments d ON c.id = d.company_id
WHERE d.name = 'Finance'
ON CONFLICT DO NOTHING;

-- Module 2: Invoice & Vendor Fraud
INSERT INTO public.training_modules (
  company_id,
  target_department_id,
  title,
  description,
  category,
  difficulty,
  estimated_minutes,
  content,
  is_active,
  passing_score,
  created_by
)
SELECT
  c.id AS company_id,
  d.id AS target_department_id,
  'Invoice & Vendor Fraud Prevention' AS title,
  'Master vendor verification procedures and invoice validation techniques. Learn to detect invoice manipulation, vendor impersonation, and account takeover schemes targeting payment processes.' AS description,
  'incident_response' AS category,
  'intermediate' AS difficulty,
  50 AS estimated_minutes,
  jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Types of Invoice & Vendor Fraud',
        'content', 'Attackers target vendors and invoicing processes through multiple vectors. Understanding each type helps you spot anomalies.',
        'fraud_types', jsonb_build_array(
          jsonb_build_object(
            'type', 'Invoice Manipulation',
            'description', 'Legitimate vendor accounts compromised or legitimate invoices altered to redirect payment',
            'indicators', jsonb_build_array(
              'Invoice amounts significantly higher than historical average',
              'Different payment instructions than previously established',
              'Rush processing requests with threats of project delays',
              'Unusual invoice numbering or formatting'
            )
          ),
          jsonb_build_object(
            'type', 'Vendor Impersonation',
            'description', 'Fraudsters create fake vendors or use lookalike company details to intercept legitimate payments',
            'indicators', jsonb_build_array(
              'New vendor requiring immediate payment (no vetting period)',
              'Slight misspelling in vendor name (ACME Inc vs ACME, Inc.)',
              'Domain email addresses instead of company domain',
              'Banking details different from company website/prior invoices'
            )
          ),
          jsonb_build_object(
            'type', 'Wire Instruction Changes',
            'description', 'Attacker gains access to vendor communication channels and sends payment detail changes',
            'indicators', jsonb_build_array(
              'Payment instructions sent outside normal vendor communication channels',
              'Unusual urgency about updating bank account information',
              'Request to wire smaller test amounts before "final" transfer',
              'Different contact person for payment instructions'
            )
          ),
          jsonb_build_object(
            'type', 'Account Takeover',
            'description', 'Vendor email account compromised through phishing or credential theft',
            'indicators', jsonb_build_array(
              'Vendor sending duplicate/corrected invoices after original was paid',
              'Invoices with unusual timing or outside business hours',
              'Vendor unaware of "invoices" they supposedly sent'
            )
          )
        ),
        'duration_minutes', 12
      ),
      jsonb_build_object(
        'title', 'Strict Vendor Verification Procedures',
        'content', 'Implement these verification steps for EVERY payment, especially new vendors or changed details.',
        'verification_steps', jsonb_build_array(
          jsonb_build_object(
            'step', '1. Vendor Database Check',
            'action', 'Verify vendor exists in your system with matching:
- Official company name (check registration documents)
- Tax ID / Registration number
- Physical business address
- Historical payment information',
            'risk_level', 'CRITICAL'
          ),
          jsonb_build_object(
            'step', '2. Domain Verification',
            'action', 'Never trust email alone:
- Verify domain matches official company website
- Check WHOIS records for domain registration
- Be alert to similar-sounding domains (accnt vs account)
- Confirm email address is in official company contact list',
            'risk_level', 'CRITICAL'
          ),
          jsonb_build_object(
            'step', '3. Banking Detail Verification',
            'action', 'For new or changed banking details:
- Call vendor using KNOWN phone number (from website, past invoices, business cards)
- Verify new account information verbally with authorized vendor representative
- Request official letterhead with banking details
- Never trust banking info sent via email or document alone',
            'risk_level', 'CRITICAL'
          ),
          jsonb_build_object(
            'step', '4. Invoice Content Validation',
            'action', 'Review invoice for:
- Match between PO and invoice amount, date, and items
- Invoice date within 30 days of service delivery
- Invoice number follows vendor''s normal sequence
- Proper invoice format with tax/registration details',
            'risk_level', 'HIGH'
          ),
          jsonb_build_object(
            'step', '5. Authorization Chain',
            'action', 'Ensure proper approvers:
- Amount matches approval authority levels
- PO signed by authorized buyer
- Invoice approved by project manager/supervisor before payment
- No approval from payment requester themselves',
            'risk_level', 'HIGH'
          ),
          jsonb_build_object(
            'step', '6. Three-Way Match',
            'action', 'Confirm match between:
- Purchase Order (what was approved to buy)
- Invoice (what vendor claims to deliver)
- Receiving documentation (what was actually received)',
            'risk_level', 'CRITICAL'
          )
        ),
        'duration_minutes', 15
      ),
      jsonb_build_object(
        'title', 'Vendor Verification Simulation Activity',
        'content', 'You will process 6 payment requests with various fraud indicators. For each request, you must:
1. Check vendor in system
2. Verify banking details through independent channels
3. Validate invoice against PO
4. Identify fraud indicators or confirm legitimacy
5. Recommend APPROVE, VERIFY FURTHER, or REJECT',
        'activity_type', 'interactive_simulation',
        'scenarios', jsonb_build_array(
          'Legitimate vendor with new payment bank account',
          'Invoice with amount 300% higher than normal order',
          'Similar-domain vendor impersonating existing vendor',
          'Invoice lacking tax ID and company registration details',
          'Legitimate vendor with standard payment request',
          'Account takeover scenario with duplicate invoice submission'
        ),
        'duration_minutes', 18
      ),
      jsonb_build_object(
        'title', 'Red Flags Checklist',
        'content', 'Quick reference guide for payment processing:
        
🚨 STOP PAYMENT IF:
- Banking details differ from prior payments or company website
- Invoice amount 20%+ higher than budgeted/typical
- Urgency/pressure to bypass normal approval process
- Invoice from similar but not identical vendor name
- New vendor requiring immediate/large payment without vetting
- Vendor unaware of invoices claimed to be from them
- Payment instruction changes sent via email without phone confirmation

⚠️ VERIFY BEFORE PAYMENT:
- New vendor details through business registration database
- Banking changes by calling vendor at known phone number
- Large or unusual payments with project manager
- Invoices outside vendor''s normal pattern or timing

✅ NORMAL PROCEDURES:
- Invoice matches PO for amount and items
- Receiving documentation confirms delivery
- Payment within standard terms (30/60/90 days)
- Clear authorization chain
- Vendor details match historical records',
        'duration_minutes', 5
      )
    ),
    'learning_objectives', jsonb_build_array(
      'Identify common invoice and vendor fraud schemes',
      'Implement strict verification procedures for vendor payments',
      'Detect anomalies in vendor communication and payment details',
      'Apply three-way matching to prevent fraudulent payments',
      'Understand psychological tactics used to rush approval'
    ),
    'key_takeaways', jsonb_build_array(
      'Verify EVERY payment, especially new vendors and changed details',
      'Always verify banking changes by calling vendor at known number',
      'Time pressure and confidentiality demands are fraud indicators',
      'Three-way match (PO, Invoice, Receiving) is your primary defense',
      'Your vigilance directly protects company assets and your employment'
    ),
    'real_impact', jsonb_build_object(
      'stat1', 'Average BEC fraud loss: $140,000+ per incident',
      'stat2', '13,000+ organizations attacked quarterly via BEC',
      'stat3', 'Finance teams are #1 targeted departments',
      'stat4', 'Strict procedures prevent 95%+ of fraud attempts'
    )
  ) AS content
FROM public.companies c
JOIN public.departments d ON c.id = d.company_id
WHERE d.name = 'Finance'
ON CONFLICT DO NOTHING;

-- ===========================================
-- Grant execute permissions for training module functions
-- ===========================================
GRANT SELECT, INSERT, UPDATE ON public.training_modules TO authenticated, service_role;

-- ===========================================
-- Verification: Check Finance modules created
-- ===========================================
SELECT
  tm.id,
  tm.title,
  tm.category,
  tm.difficulty,
  tm.estimated_minutes,
  d.name AS target_department
FROM public.training_modules tm
LEFT JOIN public.departments d ON tm.target_department_id = d.id
WHERE d.name = 'Finance'
  AND tm.title LIKE 'Business Email Compromise%'
  OR tm.title LIKE 'Invoice%'
ORDER BY tm.created_at;
