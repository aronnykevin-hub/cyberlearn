import { supabase } from './supabaseClient';

const DEPARTMENT_LEARNING_BLUEPRINTS = [
  {
    departmentName: 'IT / Cybersecurity',
    departmentCode: 'ITSEC',
    aliases: ['IT', 'Cybersecurity'],
    title: 'IT / Cybersecurity: Incident Response Essentials',
    description: 'Handle incidents quickly, contain impact, and preserve evidence for investigation.',
    category: 'incident_response',
    difficulty: 'advanced',
    estimatedMinutes: 20,
    passingScore: 75,
    content: [
      {
        type: 'text',
        title: 'Detect, Triage, Contain',
        body: 'For IT teams, speed and structure matter.\nIdentify suspicious activity, classify severity, isolate affected systems, and document every action.',
      },
      {
        type: 'quiz',
        title: 'Incident Response Quiz',
        body: 'A workstation shows ransomware behavior. What is the best first action?',
        options: [
          'Restart the workstation immediately.',
          'Disconnect the endpoint from the network and escalate incident response.',
          'Ignore it until multiple users report the same issue.',
          'Post details in a public chat channel.',
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    departmentName: 'Finance',
    departmentCode: 'FIN',
    aliases: [],
    title: 'Finance: Payment and Invoice Fraud Defense',
    description: 'Reduce business email compromise and payment fraud risks in financial workflows.',
    category: 'phishing',
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    passingScore: 70,
    content: [
      {
        type: 'text',
        title: 'Verification Before Payment',
        body: 'Never rely on email alone for payment changes.\nUse approved callback procedures and verify vendor bank changes through trusted channels.',
      },
      {
        type: 'quiz',
        title: 'Finance Fraud Quiz',
        body: 'An urgent CEO email asks for a same-day wire transfer to a new account. What should you do first?',
        options: [
          'Process it quickly to avoid delay.',
          'Reply asking for confirmation in the same email thread.',
          'Use the approved out-of-band verification process before any transfer.',
          'Forward it to all staff for awareness.',
        ],
        correctAnswer: 2,
      },
    ],
  },
  {
    departmentName: 'Customer Care',
    departmentCode: 'CC',
    aliases: ['Customer Support', 'Support'],
    title: 'Customer Care: Social Engineering Resistance',
    description: 'Protect customer data by validating identity and blocking manipulation tactics.',
    category: 'social_engineering',
    difficulty: 'beginner',
    estimatedMinutes: 12,
    passingScore: 70,
    content: [
      {
        type: 'text',
        title: 'Trust Process, Not Pressure',
        body: 'Attackers may impersonate customers or internal teams.\nAlways follow identity checks before account changes, password resets, or data sharing.',
      },
      {
        type: 'quiz',
        title: 'Customer Care Quiz',
        body: 'A caller is angry and demands immediate account changes without verification. What is the correct response?',
        options: [
          'Complete the request to calm the caller.',
          'Politely insist on required verification steps before any account action.',
          'Share partial account data as a compromise.',
          'Ask another agent to handle it without notes.',
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    departmentName: 'Human Resources (HR)',
    departmentCode: 'HR',
    aliases: ['Human Resources'],
    title: 'HR: Identity and Access Security',
    description: 'Secure employee records and access requests with controlled workflows.',
    category: 'password',
    difficulty: 'intermediate',
    estimatedMinutes: 14,
    passingScore: 70,
    content: [
      {
        type: 'text',
        title: 'Protect Employee Data',
        body: 'HR systems store highly sensitive information.\nUse strong authentication, least privilege, and approval workflows for access and profile changes.',
      },
      {
        type: 'quiz',
        title: 'HR Security Quiz',
        body: 'Which practice best protects HR accounts and employee records?',
        options: [
          'Shared credentials for onboarding speed.',
          'Single-factor login with frequent password reuse.',
          'Unique credentials plus multi-factor authentication and approval controls.',
          'Posting temporary credentials in internal channels.',
        ],
        correctAnswer: 2,
      },
    ],
  },
  {
    departmentName: 'Marketing',
    departmentCode: 'MKT',
    aliases: [],
    title: 'Marketing: Campaign and Brand Protection',
    description: 'Defend brand channels from phishing, spoofing, and malicious links.',
    category: 'phishing',
    difficulty: 'beginner',
    estimatedMinutes: 12,
    passingScore: 70,
    content: [
      {
        type: 'text',
        title: 'Protect Public Channels',
        body: 'Marketing handles public-facing accounts and links.\nValidate campaign links, protect credentials, and review unusual account activity quickly.',
      },
      {
        type: 'quiz',
        title: 'Marketing Security Quiz',
        body: 'Before posting a campaign link, what should the team do?',
        options: [
          'Post immediately and test later.',
          'Verify destination URLs and tracking parameters through approved checks.',
          'Use shortened links from unknown tools for convenience.',
          'Reuse old links from prior campaigns without validation.',
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    departmentName: 'Operations',
    departmentCode: 'OPS',
    aliases: [],
    title: 'Operations: Malware and Process Continuity',
    description: 'Reduce disruption by spotting malware signals and following continuity procedures.',
    category: 'malware',
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    passingScore: 70,
    content: [
      {
        type: 'text',
        title: 'Keep Core Processes Safe',
        body: 'Operations teams depend on reliable systems.\nReport suspicious files immediately, avoid untrusted media, and follow downtime escalation playbooks.',
      },
      {
        type: 'quiz',
        title: 'Operations Security Quiz',
        body: 'You receive an unexpected file from an unknown sender related to production schedules. What should you do?',
        options: [
          'Open it quickly to check schedule impact.',
          'Forward it to teammates for review.',
          'Report it to security and avoid opening until validated.',
          'Upload it to a public scanner with internal details.',
        ],
        correctAnswer: 2,
      },
    ],
  },
  {
    departmentName: 'IT / Cybersecurity',
    departmentCode: 'ITSEC',
    aliases: ['IT', 'Cybersecurity'],
    title: 'IT / Cybersecurity: Threat Hunting and Log Review',
    description: 'Build a repeatable workflow for anomaly detection and evidence-based escalation.',
    category: 'data_protection',
    difficulty: 'advanced',
    estimatedMinutes: 18,
    passingScore: 75,
    content: [
      {
        type: 'text',
        title: 'Structured Threat Hunting',
        body: 'Use baseline behavior, triage anomalies, and correlate logs across endpoints, identity, and network telemetry.',
      },
      {
        type: 'quiz',
        title: 'Threat Hunting Quiz',
        body: 'What is the strongest first step in an internal threat hunt?',
        options: [
          'Delete logs to reduce storage usage.',
          'Collect and correlate recent privileged activity against known baselines.',
          'Wait for anti-virus alerts only.',
          'Investigate only incidents reported by customers.',
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    departmentName: 'Finance',
    departmentCode: 'FIN',
    aliases: [],
    title: 'Finance: Payroll and Vendor Verification Controls',
    description: 'Prevent payroll diversion and vendor account takeover through layered controls.',
    category: 'data_protection',
    difficulty: 'intermediate',
    estimatedMinutes: 14,
    passingScore: 72,
    content: [
      {
        type: 'text',
        title: 'Verification Is Mandatory',
        body: 'For payroll and vendor updates, require independent verification and dual approval before any transaction.',
      },
      {
        type: 'quiz',
        title: 'Payroll Security Quiz',
        body: 'Which control most reduces payroll fraud risk?',
        options: [
          'Single reviewer approves all account changes.',
          'Accepting any email with a familiar signature.',
          'Dual-control approvals plus out-of-band identity verification.',
          'Processing urgent changes immediately.',
        ],
        correctAnswer: 2,
      },
    ],
  },
  {
    departmentName: 'Customer Care',
    departmentCode: 'CC',
    aliases: ['Customer Support', 'Support'],
    title: 'Customer Care: Account Takeover Prevention',
    description: 'Stop social-engineering attempts targeting customer account recovery flows.',
    category: 'incident_response',
    difficulty: 'beginner',
    estimatedMinutes: 13,
    passingScore: 70,
    content: [
      {
        type: 'text',
        title: 'Defend Recovery Flows',
        body: 'Attackers often target password reset and profile update workflows. Follow verification steps every time.',
      },
      {
        type: 'quiz',
        title: 'Account Recovery Quiz',
        body: 'A customer insists they cannot access verification channels and asks for a manual reset. Best action?',
        options: [
          'Reset immediately to help quickly.',
          'Bypass policy because the caller sounds legitimate.',
          'Use approved exception handling and security escalation procedure.',
          'Share partial account data as proof of support.',
        ],
        correctAnswer: 2,
      },
    ],
  },
  {
    departmentName: 'Human Resources (HR)',
    departmentCode: 'HR',
    aliases: ['Human Resources'],
    title: 'HR: Secure Onboarding and Offboarding',
    description: 'Reduce identity risk with strict joiner-mover-leaver workflows.',
    category: 'incident_response',
    difficulty: 'intermediate',
    estimatedMinutes: 16,
    passingScore: 72,
    content: [
      {
        type: 'text',
        title: 'Access Lifecycle Discipline',
        body: 'Provision minimum access on start date and revoke all non-required access immediately during offboarding.',
      },
      {
        type: 'quiz',
        title: 'Access Lifecycle Quiz',
        body: 'What is the most critical offboarding step?',
        options: [
          'Keep former employee accounts active for convenience.',
          'Disable credentials and tokens immediately after departure.',
          'Wait until monthly access review cycle.',
          'Transfer account ownership without audit.',
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    departmentName: 'Marketing',
    departmentCode: 'MKT',
    aliases: [],
    title: 'Marketing: Safe Content and Link Governance',
    description: 'Prevent malicious redirects and brand abuse in campaign operations.',
    category: 'data_protection',
    difficulty: 'beginner',
    estimatedMinutes: 11,
    passingScore: 70,
    content: [
      {
        type: 'text',
        title: 'Link and Asset Hygiene',
        body: 'Use approved domains, validate redirect chains, and review publication permissions before launch.',
      },
      {
        type: 'quiz',
        title: 'Campaign Safety Quiz',
        body: 'What is the safest link publication practice?',
        options: [
          'Use any shortener found online.',
          'Publish first, validate later.',
          'Approve only links validated through team governance checks.',
          'Copy links from old campaigns without review.',
        ],
        correctAnswer: 2,
      },
    ],
  },
  {
    departmentName: 'Operations',
    departmentCode: 'OPS',
    aliases: [],
    title: 'Operations: Business Continuity Response Drills',
    description: 'Keep services running by following tested incident and fallback procedures.',
    category: 'incident_response',
    difficulty: 'intermediate',
    estimatedMinutes: 17,
    passingScore: 72,
    content: [
      {
        type: 'text',
        title: 'Continuity First',
        body: 'When disruptions occur, follow documented fallback paths, maintain communication cadence, and log every key action.',
      },
      {
        type: 'quiz',
        title: 'Continuity Quiz',
        body: 'Which response improves continuity during a production security outage?',
        options: [
          'Allow untracked workaround changes.',
          'Pause all communication until fully resolved.',
          'Activate fallback procedures and maintain structured incident updates.',
          'Ignore recovery runbooks for speed.',
        ],
        correctAnswer: 2,
      },
    ],
  },
];

function ensureModuleHasQuiz(content, moduleTitle = 'this module') {
  const baseSlides = Array.isArray(content) ? [...content] : [];
  const hasQuiz = baseSlides.some((slide) => slide?.type === 'quiz');

  if (hasQuiz) {
    return baseSlides;
  }

  if (baseSlides.length === 0) {
    baseSlides.push({
      type: 'text',
      title: 'Module Overview',
      body: 'Review the key security practices for this module, then complete the quiz to finish.',
    });
  }

  baseSlides.push({
    type: 'quiz',
    title: 'Knowledge Check',
    body: `Have you completed and understood the key lessons in ${moduleTitle}?`,
    options: [
      'Yes, I can apply these security practices.',
      'Not yet, I need to review again.',
    ],
    correctAnswer: 0,
  });

  return baseSlides;
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function buildDepartmentAliasSet(blueprint) {
  const aliases = [blueprint.departmentName, ...(blueprint.aliases || [])];
  return new Set(aliases.map(normalizeName));
}

function normalizeTrainingModule(module) {
  if (!module) return null;

  const normalizedContent = ensureModuleHasQuiz(
    Array.isArray(module.content) ? module.content : module.content ?? [],
    module.title,
  );

  return {
    ...module,
    estimatedMinutes: module.estimated_minutes ?? module.estimatedMinutes ?? 0,
    passingScore: module.passing_score ?? module.passingScore ?? 70,
    requiredForRoles: module.required_for_roles ?? module.requiredForRoles ?? [],
    isActive: module.is_active ?? module.isActive ?? true,
    content: normalizedContent,
  };
}

/**
 * Get all training modules
 */
export async function getTrainingModules(filters = {}) {
  let query = supabase.from('training_modules').select('*').eq('is_active', true);

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeTrainingModule);
}

/**
 * Get a specific training module with full content
 */
export async function getTrainingModule(moduleId) {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeTrainingModule(data);
}

/**
 * Create a new training module (admin only)
 */
export async function createTrainingModule(module) {
  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData?.user?.id;
  const companyId = module.companyId ?? module.company_id;

  if (!currentUserId) {
    throw new Error('Sign in required to create training modules.');
  }

  if (!companyId) {
    throw new Error('companyId is required to create training modules.');
  }

  const { data, error } = await supabase
    .from('training_modules')
    .insert({
      company_id: companyId,
      target_department_id: module.targetDepartmentId ?? module.target_department_id ?? null,
      title: module.title,
      description: module.description,
      category: module.category,
      difficulty: module.difficulty,
      estimated_minutes: module.estimatedMinutes,
      content: ensureModuleHasQuiz(module.content || [], module.title),
      is_active: module.isActive !== undefined ? module.isActive : true,
      passing_score: module.passingScore || 70,
      created_by: currentUserId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeTrainingModule(data);
}

/**
 * Update a training module (admin only)
 */
export async function updateTrainingModule(moduleId, updates) {
  const updateData = {};

  if (updates.title) updateData.title = updates.title;
  if (updates.description) updateData.description = updates.description;
  if (updates.category) updateData.category = updates.category;
  if (updates.difficulty) updateData.difficulty = updates.difficulty;
  if (updates.estimatedMinutes) updateData.estimated_minutes = updates.estimatedMinutes;
  if (updates.targetDepartmentId !== undefined) updateData.target_department_id = updates.targetDepartmentId;
  if (updates.content) {
    updateData.content = ensureModuleHasQuiz(updates.content, updates.title || 'this module');
  }
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  if (updates.passingScore) updateData.passing_score = updates.passingScore;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('training_modules')
    .update(updateData)
    .eq('id', moduleId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeTrainingModule(data);
}

/**
 * Delete a training module (admin only)
 */
export async function deleteTrainingModule(moduleId) {
  const { error } = await supabase.from('training_modules').delete().eq('id', moduleId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Search training modules
 */
export async function searchTrainingModules(searchTerm) {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .eq('is_active', true)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeTrainingModule);
}

export async function ensureDepartmentLearningModules(companyId) {
  if (!companyId) {
    throw new Error('companyId is required to initialize learning modules.');
  }

  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData?.user?.id;
  if (!currentUserId) {
    throw new Error('Sign in required to initialize learning modules.');
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, role, company_id, department_id, is_department_assigned, is_active')
    .eq('user_id', currentUserId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const needsProfilePatch =
    !currentProfile ||
    currentProfile.company_id !== companyId ||
    currentProfile.role !== 'admin' ||
    currentProfile.is_active !== true;

  if (needsProfilePatch) {
    const profilePatch = {
      company_id: companyId,
      role: 'admin',
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { error: patchError } = currentProfile
      ? await supabase.from('user_profiles').update(profilePatch).eq('user_id', currentUserId)
      : await supabase.from('user_profiles').insert({
          user_id: currentUserId,
          company_id: companyId,
          role: 'admin',
          is_active: true,
        });

    if (patchError) {
      throw new Error(patchError.message);
    }
  }

  const { data: existingDepartments, error: deptError } = await supabase
    .from('departments')
    .select('id, name, company_id')
    .eq('company_id', companyId);

  if (deptError) {
    throw new Error(deptError.message);
  }

  const departmentMap = new Map();
  const existingDeptRows = Array.isArray(existingDepartments) ? existingDepartments : [];

  for (const blueprint of DEPARTMENT_LEARNING_BLUEPRINTS) {
    const aliasSet = buildDepartmentAliasSet(blueprint);
    const matched = existingDeptRows.find((dept) => aliasSet.has(normalizeName(dept.name)));
    if (matched) {
      departmentMap.set(blueprint.departmentName, matched);
    }
  }

  const departmentsToCreate = DEPARTMENT_LEARNING_BLUEPRINTS
    .filter((blueprint) => !departmentMap.has(blueprint.departmentName))
    .map((blueprint) => ({
      company_id: companyId,
      name: blueprint.departmentName,
      code: blueprint.departmentCode,
    }));

  let createdDepartments = 0;

  if (departmentsToCreate.length > 0) {
    const { data: insertedDepartments, error: insertDeptError } = await supabase
      .from('departments')
      .insert(departmentsToCreate)
      .select('id, name, company_id');

    if (insertDeptError) {
      throw new Error(insertDeptError.message);
    }

    const insertedRows = Array.isArray(insertedDepartments) ? insertedDepartments : [];
    createdDepartments = insertedRows.length;

    for (const row of insertedRows) {
      departmentMap.set(row.name, row);
    }
  }

  const preferredDepartment =
    departmentMap.get('IT / Cybersecurity') ||
    Array.from(departmentMap.values())[0] ||
    null;

  if (preferredDepartment?.id) {
    const { data: refreshedProfile, error: refreshedProfileError } = await supabase
      .from('user_profiles')
      .select('department_id, is_department_assigned')
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (refreshedProfileError) {
      throw new Error(refreshedProfileError.message);
    }

    if (!refreshedProfile?.department_id) {
      const { error: deptAssignError } = await supabase
        .from('user_profiles')
        .update({
          department_id: preferredDepartment.id,
          is_department_assigned: true,
          assigned_at: new Date().toISOString(),
          assigned_by: currentUserId,
          company_id: companyId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUserId);

      if (deptAssignError) {
        throw new Error(deptAssignError.message);
      }
    }
  }

  const { data: existingModules, error: moduleError } = await supabase
    .from('training_modules')
    .select('id, title, target_department_id')
    .eq('company_id', companyId);

  if (moduleError) {
    throw new Error(moduleError.message);
  }

  const existingKeys = new Set(
    (existingModules || []).map((row) => `${row.target_department_id || 'global'}:${String(row.title || '').toLowerCase()}`),
  );

  const modulesToCreate = [];

  for (const blueprint of DEPARTMENT_LEARNING_BLUEPRINTS) {
    const department = departmentMap.get(blueprint.departmentName);
    if (!department?.id) {
      continue;
    }

    const key = `${department.id}:${blueprint.title.toLowerCase()}`;
    if (existingKeys.has(key)) {
      continue;
    }

    modulesToCreate.push({
      company_id: companyId,
      target_department_id: department.id,
      title: blueprint.title,
      description: blueprint.description,
      category: blueprint.category,
      difficulty: blueprint.difficulty,
      estimated_minutes: blueprint.estimatedMinutes,
      content: ensureModuleHasQuiz(blueprint.content, blueprint.title),
      is_active: true,
      passing_score: blueprint.passingScore,
      created_by: currentUserId,
    });
  }

  let createdModules = 0;
  if (modulesToCreate.length > 0) {
    const { data: insertedModules, error: insertModuleError } = await supabase
      .from('training_modules')
      .insert(modulesToCreate)
      .select('id');

    if (insertModuleError) {
      throw new Error(insertModuleError.message);
    }

    createdModules = Array.isArray(insertedModules) ? insertedModules.length : 0;
  }

  return {
    createdDepartments,
    createdModules,
    totalBlueprints: DEPARTMENT_LEARNING_BLUEPRINTS.length,
  };
}

export { normalizeTrainingModule };
