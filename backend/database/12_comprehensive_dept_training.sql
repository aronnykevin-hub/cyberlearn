-- ===========================================
-- Comprehensive Department Training Modules
-- Clean Supabase-ready seed script
-- Customer Care, Marketing, HR, IT, Operations
-- ===========================================

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
  'Customer Impersonation Detection & Response' AS title,
  'Train staff to verify identity, resist pressure, and escalate suspicious requests.' AS description,
  'social_engineering' AS category,
  'intermediate' AS difficulty,
  55 AS estimated_minutes,
  jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Threat Patterns',
        'content', $$Fraudsters use urgency, authority, empathy, and confusion to push workers off process. The goal is to make you skip verification and act quickly.$$,
        'duration_minutes', 10
      ),
      jsonb_build_object(
        'title', 'Verification Workflow',
        'content', $$Use only official contact data, ask system-based questions, require extra checks for sensitive actions, and document anything unusual.$$,
        'duration_minutes', 15
      ),
      jsonb_build_object(
        'title', 'Role Play Drill',
        'content', $$A caller says they are locked out and need immediate help. Slow the interaction, verify through known channels, and escalate if the story changes.$$,
        'activity_type', 'role_play_call',
        'duration_minutes', 15
      )
    ),
    'learning_objectives', jsonb_build_array(
      'Recognize social engineering tactics specific to customer care',
      'Implement multi-factor identity verification procedures',
      'Resist emotional and psychological pressure while remaining professional',
      'Identify impersonation red flags during customer interactions',
      'Know when and how to escalate suspicious calls',
      'Protect customer data while maintaining service quality'
    ),
    'key_takeaways', jsonb_build_array(
      'Verification procedures are not negotiable because they protect customers',
      'Emotional pressure signals possible fraud',
      'Always verify through official company channels, not caller-provided information',
      'Security questions in your system cannot be socially engineered',
      'Escalation is a sign of good security judgment, not poor service'
    )
  ) AS content,
  true AS is_active,
  70.0 AS passing_score,
  c.created_by AS created_by
FROM public.companies c
JOIN public.departments d ON c.id = d.company_id
WHERE d.name = 'Customer Care'
ON CONFLICT DO NOTHING;

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
  'Phishing & Social Media Safety for Marketing Teams' AS title,
  'Train marketing teams to spot phishing, protect brand accounts, and pause before clicking.' AS description,
  'phishing' AS category,
  'intermediate' AS difficulty,
  50 AS estimated_minutes,
  jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Why Marketing Teams Are Targeted',
        'content', $$Marketing teams control brand accounts, ad budgets, vendor relationships, and customer data. That makes them a high value target for phishing and account takeover.$$,
        'duration_minutes', 7
      ),
      jsonb_build_object(
        'title', 'How to Spot a Phish',
        'content', $$Look for urgency, odd sender domains, requests to re-enter credentials, unexpected payment requests, and links that do not match the real company site.$$,
        'duration_minutes', 12
      ),
      jsonb_build_object(
        'title', 'Click Pause Drill',
        'content', $$Before clicking, stop and verify independently. Type the URL yourself, check the sender, and report suspicious messages before deleting them.$$,
        'activity_type', 'interactive_email_analysis',
        'duration_minutes', 12
      )
    ),
    'learning_objectives', jsonb_build_array(
      'Identify phishing emails targeting marketing teams',
      'Recognize urgency and psychological manipulation tactics',
      'Verify sender legitimacy without clicking suspicious links',
      'Understand real impact of credential compromise',
      'Develop discipline to pause before impulsive clicks',
      'Report phishing attempts to security team'
    ),
    'key_takeaways', jsonb_build_array(
      'Urgency is a manipulation tactic; account security can wait 30 seconds',
      'Legitimate companies never ask for credentials via email links',
      'Always verify through independent channels such as the official website or phone',
      'Hover over sender names to see the actual email address',
      'Screenshot and report suspicious messages before deleting'
    )
  ) AS content,
  true AS is_active,
  70.0 AS passing_score,
  c.created_by AS created_by
FROM public.companies c
JOIN public.departments d ON c.id = d.company_id
WHERE d.name = 'Marketing'
ON CONFLICT DO NOTHING;

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
  'Data Privacy & Insider Risk Management' AS title,
  'Train HR teams to protect employee data and manage onboarding and offboarding securely.' AS description,
  'data_protection' AS category,
  'intermediate' AS difficulty,
  60 AS estimated_minutes,
  jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Why HR Data Matters',
        'content', $$HR systems contain sensitive identity, payroll, health, and compensation data. A leak can create identity theft, fraud, or legal exposure.$$,
        'duration_minutes', 6
      ),
      jsonb_build_object(
        'title', 'Secure Handling Rules',
        'content', $$Classify data by sensitivity, use encrypted storage and transfer, and limit access to the minimum required set of people.$$,
        'duration_minutes', 14
      ),
      jsonb_build_object(
        'title', 'PII Handling Drill',
        'content', $$Practice scenarios where someone asks for salary data, W-2s, or personal files. The safe answer is to verify, pause, and follow policy.$$,
        'activity_type', 'interactive_scenario_drill',
        'duration_minutes', 10
      )
    ),
    'learning_objectives', jsonb_build_array(
      'Classify different types of employee data by sensitivity level',
      'Apply appropriate handling procedures for each data classification',
      'Implement secure onboarding that protects new hire information',
      'Execute secure offboarding to prevent data theft',
      'Recognize insider risk indicators and report them',
      'Respond correctly to PII handling violations'
    ),
    'key_takeaways', jsonb_build_array(
      'Never email or instant message sensitive data such as SSNs or bank info',
      'Encrypt sensitive data in transit and at rest',
      'Restrict access to need-to-know basis only',
      'Offboarding is the highest-risk period for data theft',
      'Violations are reportable security incidents, not personal failures'
    )
  ) AS content,
  true AS is_active,
  70.0 AS passing_score,
  c.created_by AS created_by
FROM public.companies c
JOIN public.departments d ON c.id = d.company_id
WHERE d.name = 'HR'
ON CONFLICT DO NOTHING;

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
  'Infrastructure & Network Defense: Real-Time Threat Detection' AS title,
  'Train IT teams to detect threats quickly, respond to incidents, and harden infrastructure.' AS description,
  'incident_response' AS category,
  'advanced' AS difficulty,
  75 AS estimated_minutes,
  jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Common Attack Vectors',
        'content', $$Unpatched systems, weak credentials, exposed management interfaces, malware, and insider threats are common ways attackers get in.$$,
        'duration_minutes', 12
      ),
      jsonb_build_object(
        'title', 'Detection Methods',
        'content', $$Use logs, network traffic, endpoint tooling, and vulnerability scans to spot anomalies and contain compromise fast.$$,
        'duration_minutes', 15
      ),
      jsonb_build_object(
        'title', 'Incident Response Lab',
        'content', $$You discover unusual traffic from an internal server to an external IP. Isolate the host, preserve evidence, and build an incident timeline.$$,
        'activity_type', 'hands_on_lab',
        'duration_minutes', 20
      )
    ),
    'learning_objectives', jsonb_build_array(
      'Understand common infrastructure attack vectors',
      'Deploy real-time threat detection tools',
      'Analyze logs and network traffic for indicators of compromise',
      'Respond rapidly to detected threats',
      'Audit infrastructure for security misconfigurations',
      'Implement defense-in-depth strategy'
    ),
    'key_takeaways', jsonb_build_array(
      'Patch management is your first defense',
      'Monitor logs and network traffic for anomalies',
      'Rapid isolation of compromised systems minimizes damage',
      'Forensic evidence collection must happen immediately',
      'Incident response speed directly impacts business impact'
    )
  ) AS content,
  true AS is_active,
  70.0 AS passing_score,
  c.created_by AS created_by
FROM public.companies c
JOIN public.departments d ON c.id = d.company_id
WHERE d.name = 'IT'
ON CONFLICT DO NOTHING;

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
  'Supply Chain & Vendor Security: Fraud Detection' AS title,
  'Train operations teams to verify vendors, detect fraud, and protect the supply chain.' AS description,
  'incident_response' AS category,
  'intermediate' AS difficulty,
  65 AS estimated_minutes,
  jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Why Operations Is Targeted',
        'content', $$Large transactions, time pressure, and complex handoffs make supply chains attractive to fraudsters and impersonators.$$,
        'duration_minutes', 8
      ),
      jsonb_build_object(
        'title', 'Verification and Controls',
        'content', $$Use official purchase orders, verify payment changes independently, and enforce three-way matching between PO, invoice, and receiving.$$,
        'duration_minutes', 15
      ),
      jsonb_build_object(
        'title', 'Workflow Pressure Drill',
        'content', $$An executive asks you to skip approval or a supplier pressures you to pay today. Pause, verify, and follow policy rather than rushing.$$,
        'activity_type', 'pressure_response_training',
        'duration_minutes', 12
      )
    ),
    'learning_objectives', jsonb_build_array(
      'Identify common supply chain fraud schemes',
      'Recognize fraud indicators in procurement transactions',
      'Implement verification procedures for suppliers',
      'Detect workflow manipulation and pressure tactics',
      'Protect supply chain integrity and continuity',
      'Balance security with operational efficiency'
    ),
    'key_takeaways', jsonb_build_array(
      'Significant price discounts warrant additional verification',
      'Always verify through official channels, not provided contacts',
      'Three-way matching detects many fraud attempts',
      'Rushing procedures enables fraud',
      'Document discrepancies immediately for investigation'
    )
  ) AS content,
  true AS is_active,
  70.0 AS passing_score,
  c.created_by AS created_by
FROM public.companies c
JOIN public.departments d ON c.id = d.company_id
WHERE d.name = 'Operations'
ON CONFLICT DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON public.training_modules TO authenticated, service_role;

SELECT
  d.name AS department,
  COUNT(tm.id) AS module_count,
  STRING_AGG(tm.title, ', ' ORDER BY tm.title) AS modules
FROM public.training_modules tm
JOIN public.departments d ON tm.target_department_id = d.id
WHERE d.name IN ('Customer Care', 'Marketing', 'HR', 'IT', 'Operations')
GROUP BY d.name
ORDER BY d.name;
