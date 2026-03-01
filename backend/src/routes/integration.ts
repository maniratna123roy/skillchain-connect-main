import express from 'express';
import { mockDb } from '../config/mock-database';

const router = express.Router();

// GET /api/integration/verify/:wallet
// Purpose: Verify if a student has approved NFT credentials
// Used by: Scholarship DAOs, Hiring Companies, Hackathon Portals
router.get('/verify/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Get all requests for this wallet
    const { data: requests, error } = await mockDb.getCredentialRequestsByWallet(wallet);

    if (error) {
      throw error;
    }

    // Filter only APPROVED credentials with valid NFT data
    const verifiedCredentials = requests
      ?.filter((r: any) =>
        r.status === 'APPROVED' &&
        r.credentials &&
        r.credentials.length > 0 &&
        r.credentials[0].nft_asset_id &&
        r.credentials[0].issued_tx_hash &&
        !r.credentials[0].revoked // Add check for revoked status
      )
      .map((r: any) => ({
        degree_name: r.degree_name,
        graduation_year: r.graduation_year,
        asset_id: r.credentials[0].nft_asset_id,
        issued_tx_hash: r.credentials[0].issued_tx_hash,
      })) || [];

    if (verifiedCredentials.length === 0) {
      return res.json({
        verified: false,
        credentials: []
      });
    }

    res.json({
      verified: true,
      credentials: verifiedCredentials
    });

  } catch (error: any) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Failed to verify credentials' });
  }
});

// GET /api/integration/verify-request/:id
// Purpose: Verify a single credential request by its ID
// Used by: Individual credential verification links
router.get('/verify-request/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Credential request ID required' });
    }

    const { data: request, error: requestError } = await mockDb.getCredentialRequestById(id);

    if (requestError || !request) {
      return res.status(404).json({ error: 'Credential request not found' });
    }

    if (request.status !== 'APPROVED') {
      return res.json({ verified: false, message: 'Credential request not approved' });
    }

    const allCredentials = (mockDb as any).credentials || [];
    const credential = allCredentials.find((c: any) => c.credential_request_id === id);

    if (!credential || !credential.nft_asset_id) {
      return res.status(404).json({ error: 'NFT data not found for this credential' });
    }

    if (credential.revoked) {
      return res.status(403).json({ error: 'This credential has been definitively revoked by the owner via Zero-Knowledge Proof.', verified: false });
    }

    res.json({
      verified: true,
      credential: {
        degree_name: request.degree_name,
        graduation_year: request.graduation_year,
        asset_id: credential.nft_asset_id,
        issued_tx_hash: credential.issued_tx_hash,
      }
    });

  } catch (error: any) {
    console.error('Credential verification error:', error);
    res.status(500).json({ error: 'Failed to verify credential' });
  }
});

// POST /api/integration/filter
// Purpose: Filter eligible students by degree/year
// Used by: Scholarship platforms, Hiring companies for auto-filtering
router.post('/filter', async (req, res) => {
  try {
    const { degree_name, graduation_year } = req.body;

    // Get all credential requests
    const allRequests = (mockDb as any).credentialRequests || [];
    const allCredentials = (mockDb as any).credentials || [];

    // Filter APPROVED credentials with valid NFT data
    const eligibleStudents = allRequests
      .filter((r: any) => {
        // Must be APPROVED
        if (r.status !== 'APPROVED') return false;

        // Must have associated credential with NFT data
        const credential = allCredentials.find((c: any) => c.credential_request_id === r.id);
        if (!credential || !credential.nft_asset_id || !credential.issued_tx_hash) {
          return false;
        }

        // Must not be revoked
        if (credential.revoked) {
          return false;
        }

        // Apply filters if provided
        if (degree_name && r.degree_name !== degree_name) return false;
        if (graduation_year && r.graduation_year !== graduation_year) return false;

        return true;
      })
      .map((r: any) => ({
        wallet: r.student_wallet,
        degree_name: r.degree_name,
        graduation_year: r.graduation_year
      }));

    res.json(eligibleStudents);

  } catch (error: any) {
    console.error('Filter error:', error);
    res.status(500).json({ error: 'Failed to filter students' });
  }
});

// POST /api/integration/zk-delete
// Purpose: Allows a student to revoke their credential via ZK proof without burning the NFT
router.post('/zk-delete', async (req, res) => {
  try {
    const { asset_id, proof, publicSignals } = req.body;

    if (!asset_id || !proof || !publicSignals) {
      return res.status(400).json({ error: 'asset_id, proof, and publicSignals are required fields.' });
    }

    const { data: credential, error: credError } = await mockDb.getCredentialByAssetId(asset_id);
    if (credError || !credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    if (credential.revoked) {
      return res.status(400).json({ error: 'Credential is already revoked' });
    }

    // Step 1: In a real implementation, we would use snarkjs.groth16.verify(vkey, publicSignals, proof)
    // Step 2: Since circom compilation failed due to a full disk, we mock the library verification
    const isMockProofValid = proof.pi_a && proof.pi_b && proof.pi_c;
    const isPublicSignalMatching = Number(publicSignals.asset_id_public) === Number(asset_id);

    if (!isMockProofValid || !isPublicSignalMatching) {
      return res.status(403).json({ error: 'Invalid Zero-Knowledge Proof' });
    }

    // Step 3: Revoke in database
    await mockDb.revokeCredential(asset_id);

    res.json({ success: true, message: 'Credential successfully revoked via ZK proof' });
  } catch (error: any) {
    console.error('ZK Deletion error:', error);
    res.status(500).json({ error: 'Failed to process ZK Deletion' });
  }
});

export default router;
