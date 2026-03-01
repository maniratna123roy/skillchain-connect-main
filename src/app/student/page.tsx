'use client';

import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WalletConnect } from '@/components/WalletConnect';
import { uploadCredential, getMyRequests, getPendingClaims, claimCredential, matchResume } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Shield, Upload, CheckCircle, XCircle, Clock, ExternalLink, Gift, ArrowRight } from 'lucide-react';
import { Shield, Upload, CheckCircle, XCircle, Clock, ExternalLink, Gift, Sparkles, UserPlus } from 'lucide-react';
import algosdk from 'algosdk';
import { Ripple } from '@/components/ui/ripple';
import NeoButton from '@/components/ui/NeoButton';
import Image from 'next/image';

// Algorand testnet node for sending opt-in transactions
const algodClient = new algosdk.Algodv2(
  '',
  'https://testnet-api.algonode.cloud',
  443
);

export default function StudentPage() {
  const router = useRouter();
  const { activeAddress, isConnected, signTransactions } = useWalletContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [credentialId, setCredentialId] = useState('');
  const [degreeName, setDegreeName] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [matches, setMatches] = useState<any[]>([]);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-requests', activeAddress],
    queryFn: () => getMyRequests(activeAddress!),
    enabled: !!activeAddress && isConnected,
  });

  // Fetch MINTED credentials that need to be claimed
  const { data: pendingClaims, isLoading: claimsLoading } = useQuery({
    queryKey: ['pending-claims', activeAddress],
    queryFn: () => getPendingClaims(activeAddress!),
    enabled: !!activeAddress && isConnected,
    refetchInterval: 10000, // Poll every 10s for new minted NFTs
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !activeAddress) throw new Error('Missing data');

      const formData = new FormData();
      formData.append('credential_id', credentialId);
      formData.append('degree_name', degreeName);
      formData.append('graduation_year', graduationYear);
      formData.append('document', file);

      return uploadCredential(formData, activeAddress);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Credential request submitted!' });
      setCredentialId('');
      setDegreeName('');
      setGraduationYear('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // One-click claim: opt-in to ASA + call backend to transfer
  const claimMutation = useMutation({
    mutationFn: async ({ requestId, assetId }: { requestId: string; assetId: number }) => {
      if (!activeAddress) throw new Error('Wallet not connected');

      // Step 1: Build opt-in transaction (0-amount self-transfer)
      const suggestedParams = await algodClient.getTransactionParams().do();
      const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: activeAddress,
        to: activeAddress,
        amount: 0,
        assetIndex: assetId,
        suggestedParams,
      });

      // Step 2: Sign with Lute wallet
      const signedTxns = await signTransactions([optInTxn]);

      // Step 3: Send opt-in transaction to Algorand
      await algodClient.sendRawTransaction(signedTxns[0]).do();
      await algosdk.waitForConfirmation(algodClient, optInTxn.txID(), 4);

      // Step 4: Call backend to transfer the NFT
      return claimCredential(requestId, activeAddress);
    },
    onSuccess: (data) => {
      toast({
        title: '🎉 NFT Claimed!',
        description: `Credential NFT (Asset ID: ${data.assetId}) has been transferred to your wallet.`,
      });
      queryClient.invalidateQueries({ queryKey: ['pending-claims'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Claim Failed', description: error.message, variant: 'destructive' });
    },
  });

  const matchMutation = useMutation({
    mutationFn: async () => {
      if (!resumeFile || !activeAddress) throw new Error('Missing resume file');

      const formData = new FormData();
      formData.append('resume', resumeFile);

      return matchResume(formData, activeAddress);
    },
    onSuccess: (data) => {
      toast({ title: 'Success', description: 'Successfully analyzed resume and matched with alumni!' });
      setMatches(data.matches || []);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
        <Ripple />
        <Card className="relative z-10 w-full max-w-md bg-zinc-900 border-4 border-zinc-800 shadow-[10px_10px_0px_0px_rgba(255,255,255,0.05)] pt-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tighter outfit-bold">
              Student Access
            </CardTitle>
            <p className="text-zinc-400 mt-2">Connect your wallet to manage credentials</p>
          </CardHeader>
          <CardContent className="flex justify-center pb-10">
            <WalletConnect />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-black text-white overflow-x-hidden">
      <Ripple />
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-50">
        <div className="bg-black/60 backdrop-blur-md border border-white/20 px-8 py-3 rounded-full flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-3">
            <Image src="/logo-navbar.png?v=1" alt="AlgoVault Logo" width={180} height={45} className="object-contain" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded ml-2">
              Student
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NeoButton
              onClick={() => router.push('/')}
              hoverText="Back"
              className="scale-90"
            >
              Home
            </NeoButton>
            <NeoButton
              onClick={() => router.push('/alumni')}
              hoverText="Explore"
              className="scale-90 whitespace-nowrap"
            >
              Alumni Network
            </NeoButton>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-4 pt-40 pb-8 focus:outline-none">
        {/* Pending Claims Banner */}
        {pendingClaims?.data?.length > 0 && (
          <Card className="mb-12 border-4 border-amber-500/50 bg-zinc-900 shadow-[10px_10px_0px_0px_rgba(245,158,11,0.1)] transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[15px_15px_0px_0px_#f59e0b] hover:border-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-500 font-black uppercase tracking-tighter outfit-bold text-2xl">
                <Gift className="h-6 w-6" />
                NFT Claims Ready ({pendingClaims.data.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400 mb-6">
                Your credentials have been approved! Opt-in to the asset and claim your decentralized NFT.
              </p>
              <div className="space-y-4">
                {pendingClaims.data.map((claim: any) => (
                  <div key={claim.id} className="flex items-center justify-between p-6 bg-black/40 rounded-xl border-2 border-zinc-800 hover:border-amber-500/50 transition-colors">
                    <div>
                      <p className="font-bold text-white text-lg">{claim.degree_name}</p>
                      <p className="text-sm text-zinc-500">ID: {claim.credential_id}</p>
                      {claim.credentials?.[0] && (
                        <p className="text-xs text-zinc-600 font-mono mt-1">
                          Asset ID: {claim.credentials[0].nft_asset_id}
                        </p>
                      )}
                    </div>
                    <NeoButton
                      onClick={() => claimMutation.mutate({
                        requestId: claim.id,
                        assetId: claim.credentials?.[0]?.nft_asset_id,
                      })}
                      disabled={claimMutation.isPending}
                      hoverText="Claim!"
                      className="scale-90"
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      {claimMutation.isPending ? 'Processing...' : 'Claim NFT'}
                    </NeoButton>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Upload Form */}
          <Card className="bg-zinc-900 border-4 border-zinc-800 shadow-[10px_10px_0px_0px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[15px_15px_0px_0px_#ffffff] hover:border-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white font-black uppercase tracking-tighter outfit-bold text-2xl leading-none">
                <Upload className="h-6 w-6 text-blue-500" />
                New Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  uploadMutation.mutate();
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="credentialId" className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Credential ID</Label>
                  <Input
                    id="credentialId"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    placeholder="e.g., CRED-2024-001"
                    required
                    className="bg-black/50 border-zinc-800 focus:border-blue-500 text-white h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="degreeName" className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Degree Name</Label>
                  <Input
                    id="degreeName"
                    value={degreeName}
                    onChange={(e) => setDegreeName(e.target.value)}
                    placeholder="e.g., Bachelor of Science"
                    required
                    className="bg-black/50 border-zinc-800 focus:border-blue-500 text-white h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduationYear" className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="e.g., 2024"
                    required
                    className="bg-black/50 border-zinc-800 focus:border-blue-500 text-white h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document" className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Document (PDF)</Label>
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                    className="bg-black/50 border-zinc-800 focus:border-blue-500 text-white cursor-pointer h-12 pt-2"
                  />
                </div>

                <div className="pt-2">
                  <NeoButton
                    type="submit"
                    className="w-full"
                    disabled={uploadMutation.isPending}
                    hoverText="Send Request"
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Submit Request'}
                  </NeoButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* My Requests */}
          <Card className="bg-zinc-900 border-4 border-zinc-800 shadow-[10px_10px_0px_0px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[15px_15px_0px_0px_#ffffff] hover:border-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white font-black uppercase tracking-tighter outfit-bold text-2xl leading-none">
                <Clock className="h-6 w-6 text-yellow-500" />
                Submission History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center py-12 text-zinc-500">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                  <p>Fetching your credentials...</p>
                </div>
              ) : requests?.data?.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
                  <p className="text-zinc-500">No requests submitted yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {requests?.data?.map((req: any) => (
                    <Card key={req.id} className="bg-black/40 border-2 border-zinc-800 hover:border-zinc-600 transition-colors overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-xl font-black text-white uppercase tracking-tight outfit-bold underline decoration-blue-500 decoration-4 underline-offset-4">
                                {req.degree_name}
                              </p>
                              <p className="text-sm text-zinc-500 mt-3 font-mono">ID: {req.credential_id}</p>
                            </div>
                            <div className="flex items-center">
                              {req.status === 'PENDING' && (
                                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" /> Pending
                                </span>
                              )}
                              {req.status === 'MINTED' && (
                                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                  <Gift className="h-3 w-3" /> Ready to Claim
                                </span>
                              )}
                              {req.status === 'APPROVED' && (
                                <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                  <CheckCircle className="h-3 w-3" /> Approved
                                </span>
                              )}
                              {req.status === 'REJECTED' && (
                                <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                  <XCircle className="h-3 w-3" /> Rejected
                                </span>
                              )}
                            </div>
                          </div>

                          {req.credentials?.[0] && (
                            <div className="mt-6 border-t border-zinc-800 pt-6 space-y-4">
                              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider">
                                  <Shield className="h-4 w-4" />
                                  Algorand Asset Details
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div className="space-y-1">
                                    <p className="text-zinc-500 uppercase font-black tracking-widest">Asset ID</p>
                                    <p className="font-mono text-white text-base">{req.credentials[0].nft_asset_id}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-zinc-500 uppercase font-black tracking-widest">Status</p>
                                    <p className="text-green-500 font-bold">VERIFIED ON-CHAIN</p>
                                  </div>
                                </div>
                                {req.credentials[0].issued_tx_hash && (
                                  <div className="space-y-1 pt-2">
                                    <p className="text-zinc-500 uppercase font-black tracking-widest text-[10px]">Transaction Hash</p>
                                    <p className="font-mono text-zinc-400 truncate text-[10px]" title={req.credentials[0].issued_tx_hash}>
                                      {req.credentials[0].issued_tx_hash}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-3">
                                <a
                                  href={`https://lora.algokit.io/testnet/asset/${req.credentials[0].nft_asset_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 bg-zinc-800 hover:bg-white hover:text-black text-white text-xs font-bold uppercase py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
                                >
                                  Explorer <ExternalLink className="h-3 w-3" />
                                </a>
                                {req.credentials[0].issued_tx_hash && (
                                  <a
                                    href={`https://lora.algokit.io/testnet/tx/${req.credentials[0].issued_tx_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-zinc-800 hover:bg-white hover:text-black text-white text-xs font-bold uppercase py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
                                  >
                                    Transaction <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Mentor Matcher Section */}
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-indigo-600" />
              AI Mentor Matcher
            </h2>
            <p className="text-gray-600 mt-2">Upload your resume and let our Gemini AI find the perfect alumni mentors based on your skills and background.</p>
          </div>

          <Card className="border-2 border-indigo-100 shadow-lg">
            <CardContent className="p-6">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="col-span-1 space-y-4 lg:border-r border-gray-100 pr-4">
                  <h3 className="text-xl font-bold text-gray-800">1. Upload Resume</h3>
                  <p className="text-sm text-gray-500">Must be a PDF document containing your work experience and skills.</p>

                  <div className="mt-4">
                    <Label htmlFor="resumeDocument" className="sr-only">Resume (PDF)</Label>
                    <Input
                      id="resumeDocument"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                  </div>

                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
                    onClick={() => matchMutation.mutate()}
                    disabled={!resumeFile || matchMutation.isPending}
                  >
                    {matchMutation.isPending ? 'Analyzing with AI...' : 'Find Matches'}
                  </Button>
                </div>

                {/* Results Section */}
                <div className="col-span-2">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">2. Your AI Matches</h3>

                  {!matches || matches.length === 0 ? (
                    <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500 text-center">
                        {matchMutation.isPending ? 'Gemini AI is reading your resume...' : 'Upload your resume to see your top matches.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {matches.map((match: any, idx: number) => (
                        <div key={idx} className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">{match.alumnus?.name}</h4>
                              <p className="text-sm font-medium text-indigo-600">{match.alumnus?.status}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {match.matchPercentage && (
                                <div className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
                                  {match.matchPercentage}% Match
                                </div>
                              )}
                              <Button size="sm" variant="outline" className="gap-1 text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                                <UserPlus className="h-4 w-4" /> Connect
                              </Button>
                            </div>
                          </div>

                          <div className="bg-indigo-50/50 p-3 rounded-lg mt-3">
                            <p className="text-sm text-gray-800 flex items-start gap-2">
                              <Sparkles className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                              <span className="italic">{match.reason}</span>
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4">
                            {match.alumnus?.expertise.map((skill: string, sIdx: number) => (
                              <span key={sIdx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
