const API_BASE = '/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/applications/stats`);
  return res.json();
}

export async function fetchApplications(params: Record<string, any> = {}) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, String(v));
    }
  }
  const res = await fetch(`${API_BASE}/applications?${query.toString()}`);
  return res.json();
}

export async function fetchApplicationDetail(id: string) {
  const res = await fetch(`${API_BASE}/applications/${id}`);
  return res.json();
}

export async function createApplication(data: any) {
  const res = await fetch(`${API_BASE}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteApplicationDraft(id: string) {
  const res = await fetch(`${API_BASE}/applications/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function uploadDocument(formData: FormData) {
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}

export async function updateExtraction(docId: string, extId: string, corrected_value: string, override_reason: string, actor_name: string) {
  const res = await fetch(`${API_BASE}/documents/${docId}/extractions/${extId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ corrected_value, override_reason, actor_name })
  });
  return res.json();
}

export async function deleteDocument(id: string) {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function recordFindingDisposition(findingId: string, disposition: string, reason: string, actor_name: string) {
  const res = await fetch(`${API_BASE}/reviewer/findings/${findingId}/disposition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ disposition, reason, actor_name })
  });
  return res.json();
}

export async function executeReviewerAction(appId: string, action_type: string, payload: any) {
  const res = await fetch(`${API_BASE}/reviewer/applications/${appId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action_type, ...payload })
  });
  return res.json();
}

export async function runFullVerification(appId: string, actor_name: string) {
  const res = await fetch(`${API_BASE}/verification/run-all/${appId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor_name })
  });
  return res.json();
}

export async function fetchComplianceRules() {
  const res = await fetch(`${API_BASE}/compliance/rules`);
  return res.json();
}

export async function toggleComplianceRule(ruleId: string, actor_name: string) {
  const res = await fetch(`${API_BASE}/compliance/rules/${ruleId}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor_name })
  });
  return res.json();
}

export async function createComplianceRule(ruleData: any) {
  const res = await fetch(`${API_BASE}/compliance/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ruleData)
  });
  return res.json();
}

export async function updateComplianceRule(ruleId: string, ruleData: any) {
  const res = await fetch(`${API_BASE}/compliance/rules/${ruleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ruleData)
  });
  return res.json();
}

export async function fetchInfrastructure(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/infrastructure?${query}`);
  return res.json();
}

export async function reviewInfrastructureItem(id: string, review_status: string, reviewer_notes: string, actor_name: string) {
  const res = await fetch(`${API_BASE}/infrastructure/${id}/review`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_status, reviewer_notes, actor_name })
  });
  return res.json();
}

export async function fetchAuditLogs(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/audit?${query}`);
  return res.json();
}

export async function fetchNotifications(role: string) {
  const res = await fetch(`${API_BASE}/notifications?role=${role}`);
  return res.json();
}

export async function markNotificationsAsRead(role: string, id?: string) {
  const res = await fetch(`${API_BASE}/notifications/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, id })
  });
  return res.json();
}

export async function fetchReportData(appId: string) {
  const res = await fetch(`${API_BASE}/reports/application/${appId}`);
  return res.json();
}

export async function fetchMockIssuerRegistry() {
  const res = await fetch(`${API_BASE}/verification/mock-registry`);
  return res.json();
}

export async function resetDemoDataset(actor_name: string) {
  const res = await fetch(`${API_BASE}/reset-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor_name })
  });
  return res.json();
}

export async function loginUser(roleOrEmail: { role?: string; email?: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roleOrEmail)
  });
  return res.json();
}
