const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

async function apiRequest(endpoint: string, options: RequestInit = {}, wallet?: string) {
  const headers = new Headers(options.headers);

  if (wallet) {
    headers.set('x-wallet-address', wallet);
  }

  if (options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json();
    throw Object.assign(new Error(body.error || 'Request failed'), body);
  }

  return response.json();
}

export async function getRole(wallet: string) {
  return apiRequest('/api/auth/role', {}, wallet);
}

export async function uploadCredential(formData: FormData, wallet: string) {
  const response = await fetch(`${API_URL}/api/credentials/upload`, {
    method: 'POST',
    headers: {
      'x-wallet-address': wallet,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

export async function getMyRequests(wallet: string) {
  return apiRequest('/api/credentials/my-requests', {}, wallet);
}

export async function getPendingRequests(wallet: string) {
  return apiRequest('/api/credentials/pending', {}, wallet);
}

export async function approveCredential(id: string, wallet: string) {
  return apiRequest(`/api/credentials/approve/${id}`, {
    method: 'POST',
  }, wallet);
}

export async function rejectCredential(id: string, reason: string, wallet: string) {
  return apiRequest(`/api/credentials/reject/${id}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }, wallet);
}

export async function getContractAdmins(wallet: string) {
  return apiRequest('/api/admin/contract-admins', {}, wallet);
}

export async function getPendingClaims(wallet: string) {
  return apiRequest('/api/credentials/pending-claims', {}, wallet);
}

export async function claimCredential(id: string, wallet: string) {
  return apiRequest(`/api/credentials/claim/${id}`, {
    method: 'POST',
  }, wallet);
}

export async function matchResume(formData: FormData, wallet: string) {
  const response = await fetch(`${API_URL}/api/match/resume`, {
    method: 'POST',
    headers: {
      'x-wallet-address': wallet,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Match failed');
  }

  return response.json();
}

export async function zkDelete(asset_id: number, proof: any, publicSignals: any, wallet: string) {
  const response = await fetch(`${API_URL}/api/integration/zk-delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wallet-address': wallet,
    },
    body: JSON.stringify({ asset_id, proof, publicSignals }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'ZK Deletion failed');
  }

  return response.json();
}
