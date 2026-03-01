// Mock in-memory database for demo purposes
interface CredentialRequest {
  id: string;
  credential_id: string;
  student_wallet: string;
  degree_name: string;
  graduation_year: number;
  document_ipfs_cid: string;
  document_hash: string;
  status: 'PENDING' | 'MINTED' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
}

interface Credential {
  id: string;
  credential_request_id: string;
  nft_asset_id: number;
  metadata_ipfs_cid: string;
  metadata_hash: string;
  issued_tx_hash: string;
  created_at: string;
  revoked?: boolean;
}

class MockDatabase {
  private credentialRequests: CredentialRequest[] = [];
  private credentials: Credential[] = [];
  private idCounter = 1;

  async insertCredentialRequest(data: Omit<CredentialRequest, 'id' | 'created_at'>) {
    const request: CredentialRequest = {
      ...data,
      id: String(this.idCounter++),
      created_at: new Date().toISOString(),
    };
    this.credentialRequests.push(request);
    return { data: request, error: null };
  }

  async getCredentialRequestsByWallet(wallet: string) {
    const requests = this.credentialRequests.filter(r => r.student_wallet === wallet);

    // Attach minted credentials where available
    const requestsWithCredentials = requests.map(req => {
      const creds = this.credentials.filter(c => c.credential_request_id === req.id);
      return { ...req, credentials: creds };
    });

    // Filter out revoked credentials so they no longer show in history
    const activeRequests = requestsWithCredentials.filter(req => {
      if (req.credentials && req.credentials.length > 0) {
        return !req.credentials[0].revoked;
      }
      return true;
    });

    return { data: activeRequests, error: null };
  }

  async getCredentialByAssetId(asset_id: number) {
    const credential = this.credentials.find(c => c.nft_asset_id === asset_id);
    if (!credential) return { data: null, error: { message: 'Credential not found' } };
    return { data: credential, error: null };
  }

  async revokeCredential(asset_id: number) {
    const credential = this.credentials.find(c => c.nft_asset_id === asset_id);
    if (!credential) return { error: { message: 'Credential not found' } };
    if (credential.revoked) return { error: { message: 'Credential already revoked' } };

    credential.revoked = true;
    return { data: credential, error: null };
  }

  async getPendingRequests() {
    const requests = this.credentialRequests.filter(r => r.status === 'PENDING');
    return { data: requests, error: null };
  }

  async getCredentialRequestById(id: string) {
    const request = this.credentialRequests.find(r => r.id === id);
    return { data: request || null, error: request ? null : { message: 'Not found' } };
  }

  async updateCredentialRequest(id: string, updates: Partial<CredentialRequest>) {
    const index = this.credentialRequests.findIndex(r => r.id === id);
    if (index === -1) return { error: { message: 'Not found' } };

    this.credentialRequests[index] = { ...this.credentialRequests[index], ...updates };
    return { error: null };
  }

  async insertCredential(data: Omit<Credential, 'id' | 'created_at'>) {
    const credential: Credential = {
      ...data,
      id: String(this.idCounter++),
      created_at: new Date().toISOString(),
    };
    this.credentials.push(credential);
    return { error: null };
  }

  async checkDuplicateCredentialId(credentialId: string) {
    const existing = this.credentialRequests.find(r => r.credential_id === credentialId);
    return { data: existing || null, error: null };
  }

  async getMintedRequestsByWallet(wallet: string) {
    const requests = this.credentialRequests
      .filter(r => r.student_wallet === wallet && r.status === 'MINTED')
      .map(r => ({
        ...r,
        credentials: this.credentials.filter(c => c.credential_request_id === r.id)
      }));
    return { data: requests, error: null };
  }
}

export const mockDb = new MockDatabase();
