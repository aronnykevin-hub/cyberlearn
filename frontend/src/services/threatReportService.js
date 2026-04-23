import { supabase } from './supabaseClient';

const REPORT_STATUSES = ['open', 'investigating', 'resolved', 'dismissed'];

function normalizeReply(reply) {
  if (!reply) return null;

  return {
    id: reply.id,
    reportId: reply.report_id,
    companyId: reply.company_id,
    authorId: reply.author_id,
    authorRole: reply.author_role,
    message: reply.message,
    createdAt: reply.created_at,
  };
}

function normalizeReport(report) {
  if (!report) return null;

  return {
    id: report.id,
    companyId: report.company_id,
    reporterId: report.reporter_id,
    reporterDepartmentId: report.reporter_department_id,
    type: report.type,
    severity: report.severity,
    title: report.title,
    description: report.description,
    affectedSystems: report.affected_systems,
    status: report.status,
    adminNotes: report.admin_notes,
    resolvedAt: report.resolved_at,
    resolvedBy: report.resolved_by,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
  };
}

async function getAuthenticatedUserId() {
  const { data: authData, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);

  const userId = authData?.user?.id;
  if (!userId) throw new Error('User not authenticated');
  return userId;
}

async function getCurrentUserProfile() {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, company_id, department_id, role, is_department_assigned, is_active')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function listRepliesByReportIds(reportIds) {
  if (!Array.isArray(reportIds) || reportIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('threat_report_replies')
    .select('id, report_id, company_id, author_id, author_role, message, created_at')
    .in('report_id', reportIds)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  const grouped = new Map();
  for (const row of data || []) {
    const normalized = normalizeReply(row);
    const reportId = normalized.reportId;
    if (!grouped.has(reportId)) grouped.set(reportId, []);
    grouped.get(reportId).push(normalized);
  }

  return grouped;
}

async function listReporterMetadata(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return new Map();
  }

  const [usersResult, profilesResult] = await Promise.all([
    supabase.from('users').select('id, email').in('id', userIds),
    supabase.from('user_profiles').select('user_id, full_name').in('user_id', userIds),
  ]);

  if (usersResult.error) throw new Error(usersResult.error.message);
  if (profilesResult.error) throw new Error(profilesResult.error.message);

  const profileMap = new Map((profilesResult.data || []).map((row) => [row.user_id, row]));
  const metadata = new Map();

  for (const userRow of usersResult.data || []) {
    const profile = profileMap.get(userRow.id);
    metadata.set(userRow.id, {
      reporterEmail: userRow.email || null,
      reporterName: profile?.full_name || userRow.email || userRow.id,
    });
  }

  return metadata;
}

async function listDepartmentNames(departmentIds) {
  if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .in('id', departmentIds);

  if (error) throw new Error(error.message);
  return new Map((data || []).map((row) => [row.id, row.name]));
}

/**
 * Employee: submit a report scoped to their assigned company/department.
 */
export async function submitThreatReport(report) {
  const payload = {
    p_type: report.type,
    p_severity: report.severity,
    p_title: report.title,
    p_description: report.description,
    p_affected_systems: report.affectedSystems || null,
  };

  const { data, error } = await supabase.rpc('submit_threat_report', payload);

  if (error) {
    if (error.code === 'PGRST202' || error.status === 404 || /could not find the function/i.test(error.message || '')) {
      const profile = await getCurrentUserProfile();
      const reporterId = await getAuthenticatedUserId();

      if (!profile.company_id) {
        throw new Error('User is not linked to a company.');
      }

      if (!profile.department_id || profile.is_department_assigned !== true) {
        throw new Error('Department assignment is required before submitting reports.');
      }

      const { data: inserted, error: insertError } = await supabase
        .from('threat_reports')
        .insert({
          company_id: profile.company_id,
          reporter_id: reporterId,
          reporter_department_id: profile.department_id,
          type: report.type,
          severity: report.severity,
          title: report.title,
          description: report.description,
          affected_systems: report.affectedSystems || null,
          status: 'open',
        })
        .select('id')
        .single();

      if (insertError) throw new Error(insertError.message);
      return inserted?.id || null;
    }

    throw new Error(error.message);
  }

  return data;
}

/**
 * Employee: fetch only own reports with admin replies.
 */
export async function getMyThreatReports() {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase
    .from('threat_reports')
    .select(
      `
      id,
      company_id,
      reporter_id,
      reporter_department_id,
      type,
      severity,
      title,
      description,
      affected_systems,
      status,
      admin_notes,
      resolved_at,
      resolved_by,
      created_at,
      updated_at
    `
    )
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const reports = (data || []).map(normalizeReport);
  const reportIds = reports.map((row) => row.id);
  const repliesMap = await listRepliesByReportIds(reportIds);

  return reports.map((reportRow) => ({
    ...reportRow,
    replies: repliesMap.get(reportRow.id) || [],
  }));
}

/**
 * Admin: fetch all reports for own company with reporter metadata and replies.
 */
export async function getAdminCompanyThreatReports(companyId) {
  let resolvedCompanyId = companyId;
  if (!resolvedCompanyId) {
    const profile = await getCurrentUserProfile();
    resolvedCompanyId = profile.company_id;
  }

  if (!resolvedCompanyId) {
    throw new Error('Company context is required to fetch reports.');
  }

  const { data, error } = await supabase
    .from('threat_reports')
    .select(
      `
      id,
      company_id,
      reporter_id,
      reporter_department_id,
      type,
      severity,
      title,
      description,
      affected_systems,
      status,
      admin_notes,
      resolved_at,
      resolved_by,
      created_at,
      updated_at
    `
    )
    .eq('company_id', resolvedCompanyId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const reports = (data || []).map(normalizeReport);
  const reportIds = reports.map((row) => row.id);
  const reporterIds = [...new Set(reports.map((row) => row.reporterId).filter(Boolean))];
  const departmentIds = [...new Set(reports.map((row) => row.reporterDepartmentId).filter(Boolean))];

  const [repliesMap, reporterMap, departmentMap] = await Promise.all([
    listRepliesByReportIds(reportIds),
    listReporterMetadata(reporterIds),
    listDepartmentNames(departmentIds),
  ]);

  return reports.map((reportRow) => {
    const reporterMetadata = reporterMap.get(reportRow.reporterId) || {};
    return {
      ...reportRow,
      reporterEmail: reporterMetadata.reporterEmail || null,
      reporterName: reporterMetadata.reporterName || reportRow.reporterId,
      reporterDepartmentName: departmentMap.get(reportRow.reporterDepartmentId) || null,
      replies: repliesMap.get(reportRow.id) || [],
    };
  });
}

/**
 * Admin: reply to report and optionally move report status.
 */
export async function replyToThreatReport(reportId, message, nextStatus = null) {
  const trimmedMessage = String(message || '').trim();
  if (!trimmedMessage) {
    throw new Error('Reply message is required');
  }

  const payload = {
    p_report_id: reportId,
    p_message: trimmedMessage,
    p_status: nextStatus || null,
  };

  const { data, error } = await supabase.rpc('reply_to_threat_report', payload);
  if (error) {
    if (error.code === 'PGRST202' || error.status === 404 || /could not find the function/i.test(error.message || '')) {
      const userId = await getAuthenticatedUserId();
      const { data: reportRow, error: reportError } = await supabase
        .from('threat_reports')
        .select('id, company_id, status, admin_notes')
        .eq('id', reportId)
        .single();

      if (reportError) throw new Error(reportError.message);

      const { error: insertReplyError } = await supabase
        .from('threat_report_replies')
        .insert({
          report_id: reportId,
          company_id: reportRow.company_id,
          author_id: userId,
          author_role: 'admin',
          message: trimmedMessage,
        });

      if (insertReplyError) throw new Error(insertReplyError.message);

      const updates = {
        admin_notes: reportRow.admin_notes
          ? `${reportRow.admin_notes}\n\n${trimmedMessage}`
          : trimmedMessage,
        updated_at: new Date().toISOString(),
      };

      if (REPORT_STATUSES.includes(nextStatus)) {
        updates.status = nextStatus;
        if (nextStatus === 'resolved') {
          updates.resolved_at = new Date().toISOString();
          updates.resolved_by = userId;
        } else {
          updates.resolved_at = null;
          updates.resolved_by = null;
        }
      }

      const { error: updateError } = await supabase
        .from('threat_reports')
        .update(updates)
        .eq('id', reportId);

      if (updateError) throw new Error(updateError.message);

      return null;
    }

    throw new Error(error.message);
  }

  return data;
}

/**
 * Admin: update report status without reply message.
 */
export async function updateThreatReportStatus(reportId, status) {
  if (!REPORT_STATUSES.includes(status)) {
    throw new Error('Invalid report status');
  }

  const userId = await getAuthenticatedUserId();
  const updates = {
    status,
    updated_at: new Date().toISOString(),
    resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    resolved_by: status === 'resolved' ? userId : null,
  };

  const { error } = await supabase
    .from('threat_reports')
    .update(updates)
    .eq('id', reportId);

  if (error) throw new Error(error.message);
  return true;
}

/**
 * Admin/employee: list report stats in current scope.
 */
export async function getThreatReportStatistics(companyId = null) {
  const reports = companyId
    ? await getAdminCompanyThreatReports(companyId)
    : await getMyThreatReports();

  const stats = {
    total: reports.length,
    open: 0,
    investigating: 0,
    resolved: 0,
    dismissed: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const report of reports) {
    if (REPORT_STATUSES.includes(report.status)) stats[report.status] += 1;
    if (['critical', 'high', 'medium', 'low'].includes(report.severity)) stats[report.severity] += 1;
  }

  return stats;
}

