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
      ?.filter(r =>
        r.status === 'APPROVED' &&
        r.credentials &&
        r.credentials.length > 0 &&
        r.credentials[0].nft_asset_id &&
        r.credentials[0].issued_tx_hash
      )
      .map(r => ({
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

export default router;
