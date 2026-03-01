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
import { Shield, Upload, CheckCircle, XCircle, Clock, ExternalLink, Gift, ArrowRight, Sparkles, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import algosdk from 'algosdk';
import { Ripple } from '@/components/ui/ripple';
import NeoButton from '@/components/ui/NeoButton';
import Image from 'next/image';
import TransactionNotification from '@/components/ui/TransactionNotification';
import ErrorNotification from '@/components/ui/ErrorNotification';

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
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

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
      toast({
        title: "",
        description: (
          <TransactionNotification
            title="REQUEST SUBMITTED"
            message="Your credential verify request is on its way."
          />
        ),
      });
      setCredentialId('');
      setDegreeName('');
      setGraduationYear('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: "",
        description: (
          <ErrorNotification title="SUBMISSION FAILED" message={error.message} />
        ),
        variant: 'destructive',
      });
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
        title: "",
        description: (
          <TransactionNotification
            title="NFT CLAIMED"
            message={`Asset #${data.assetId} transferred to your wallet.`}
          />
        ),
      });
      queryClient.invalidateQueries({ queryKey: ['pending-claims'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: "",
        description: (
          <ErrorNotification title="CLAIM FAILED" message={error.message} />
        ),
        variant: 'destructive',
      });
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
      toast({
        title: "",
        description: (
          <ErrorNotification title="MATCHING FAILED" message={error.message} />
        ),
        variant: 'destructive',
      });
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
                      {claimMutation.isPending && claimMutation.variables?.requestId === claim.id ? 'Processing...' : 'Claim NFT'}
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
                <div className="space-y-4">
                  {requests?.data?.map((req: any, idx: number) => (
                    <Card
                      key={req.id}
                      className={`bg-zinc-900/50 border-2 transition-all duration-300 overflow-hidden ${expandedRequestId === req.id ? 'border-blue-500 shadow-[5px_5px_0px_0px_rgba(59,130,246,0.2)]' : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                    >
                      <CardContent className="p-0">
                        {/* Accordion Header */}
                        <button
                          onClick={() => setExpandedRequestId(expandedRequestId === req.id ? null : req.id)}
                          className="w-full flex items-center justify-between p-5 text-left group transition-colors hover:bg-white/5"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg transition-colors ${expandedRequestId === req.id ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'
                              }`}>
                              <Shield className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-black text-lg text-white uppercase tracking-tight outfit-bold">
                                Document {idx + 1}
                              </p>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                                {new Date(req.created_at || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="hidden sm:block">
                              {req.status === 'PENDING' && (
                                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" /> Pending
                                </span>
                              )}
                              {req.status === 'MINTED' && (
                                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                  <Gift className="h-3 w-3" /> Ready
                                </span>
                              )}
                              {req.status === 'APPROVED' && (
                                <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                  <CheckCircle className="h-3 w-3" /> Minted
                                </span>
                              )}
                              {req.status === 'REJECTED' && (
                                <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                  <XCircle className="h-3 w-3" /> Rejected
                                </span>
                              )}
                            </div>
                            {expandedRequestId === req.id ? (
                              <ChevronUp className="h-5 w-5 text-zinc-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-zinc-500" />
                            )}
                          </div>
                        </button>

                        {/* Accordion Content */}
                        {expandedRequestId === req.id && (
                          <div className="px-6 pb-6 border-t border-zinc-800 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Degree Title</p>
                                <p className="text-xl font-black text-white uppercase tracking-tight outfit-bold underline decoration-blue-500 decoration-2 underline-offset-4">
                                  {req.degree_name}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Credential ID</p>
                                <p className="font-mono text-blue-400 text-sm bg-blue-500/5 px-2 py-0.5 rounded inline-block">
                                  {req.credential_id}
                                </p>
                              </div>
                            </div>

                            {req.credentials?.[0] && (
                              <div className="space-y-4 pt-4 border-t border-zinc-800">
                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-5 space-y-4">
                                  <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest">
                                    <Shield className="h-4 w-4" />
                                    Blockchain Identity
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <p className="text-zinc-500 uppercase font-black tracking-widest text-[9px]">Asset ID</p>
                                      <p className="font-mono text-white text-lg">{req.credentials[0].nft_asset_id}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-zinc-500 uppercase font-black tracking-widest text-[9px]">Network Status</p>
                                      <p className="text-green-500 font-black text-xs">MINTED & VERIFIED</p>
                                    </div>
                                  </div>
                                  {req.credentials[0].issued_tx_hash && (
                                    <div className="space-y-1">
                                      <p className="text-zinc-500 uppercase font-black tracking-widest text-[9px]">Last Transaction</p>
                                      <p className="font-mono text-zinc-400 truncate text-[9px]" title={req.credentials[0].issued_tx_hash}>
                                        {req.credentials[0].issued_tx_hash}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-3 mt-4">
                                  <a
                                    href={`https://lora.algokit.io/testnet/asset/${req.credentials[0].nft_asset_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-zinc-800 hover:bg-white hover:text-black text-white text-[10px] font-black uppercase py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 border border-zinc-700"
                                  >
                                    Explorer <ExternalLink className="h-3 w-3" />
                                  </a>
                                  {req.credentials[0].issued_tx_hash && (
                                    <a
                                      href={`https://lora.algokit.io/testnet/tx/${req.credentials[0].issued_tx_hash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 bg-zinc-800 hover:bg-white hover:text-black text-white text-[10px] font-black uppercase py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 border border-zinc-700"
                                    >
                                      Details <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Mentor Matcher Section */}
        <div className="mt-20">
          <div className="mb-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter outfit-bold text-white flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-blue-500" />
              AI Mentor Matcher
            </h2>
            <p className="text-zinc-400 mt-2 font-medium">Upload your resume and let our Gemini AI find the perfect alumni mentors based on your skills and background.</p>
          </div>

          <Card className="bg-zinc-900 border-4 border-zinc-800 shadow-[10px_10px_0px_0px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[15px_15px_0px_0px_#ffffff] hover:border-white">
            <CardContent className="p-8">
              <div className="grid lg:grid-cols-3 gap-12">
                {/* Upload Section */}
                <div className="col-span-1 space-y-6 lg:border-r-2 border-zinc-800 lg:pr-8">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight outfit-bold flex items-center gap-2">
                      <span className="bg-blue-500 text-white w-7 h-7 rounded-sm flex items-center justify-center text-sm">1</span>
                      Upload Resume
                    </h3>
                    <p className="text-sm text-zinc-500 mt-2 font-medium">Must be a PDF document containing your work experience and skills.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resumeDocument" className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Resume (PDF)</Label>
                    <Input
                      id="resumeDocument"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="bg-black/50 border-zinc-800 focus:border-blue-500 text-white cursor-pointer h-12 pt-2"
                    />
                  </div>

                  <NeoButton
                    className="w-full"
                    onClick={() => matchMutation.mutate()}
                    disabled={!resumeFile || matchMutation.isPending}
                    hoverText="Find Matches"
                  >
                    {matchMutation.isPending ? 'Analyzing with AI...' : 'Find Matches'}
                  </NeoButton>
                </div>

                {/* Results Section */}
                <div className="col-span-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight outfit-bold mb-6 flex items-center gap-2">
                    <span className="bg-blue-500 text-white w-7 h-7 rounded-sm flex items-center justify-center text-sm">2</span>
                    Your AI Matches
                  </h3>

                  {!matches || matches.length === 0 ? (
                    <div className="h-64 flex items-center justify-center bg-black/40 rounded-2xl border-4 border-dashed border-zinc-800 group hover:border-zinc-700 transition-colors">
                      <div className="text-center px-4">
                        <Sparkles className="h-10 w-10 text-zinc-700 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                          {matchMutation.isPending ? 'Gemini AI is reading your resume...' : 'Upload your resume to see your top matches.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {matches.map((match: any, idx: number) => (
                        <div key={idx} className="bg-black/60 p-6 rounded-2xl border-2 border-zinc-800 hover:border-blue-500/50 transition-all duration-300 shadow-xl group">
                          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-black text-xl text-white uppercase tracking-tight outfit-bold">{match.alumnus?.name}</h4>
                                {match.matchPercentage && (
                                  <div className="bg-green-500/10 text-green-500 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-green-500/20 tracking-tighter">
                                    {match.matchPercentage}% Match
                                  </div>
                                )}
                              </div>
                              <p className="text-sm font-bold text-blue-400 uppercase tracking-widest leading-none">{match.alumnus?.status}</p>
                            </div>
                            <NeoButton
                              onClick={() => { }}
                              hoverText="Connect"
                              className="scale-90"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Connect
                            </NeoButton>
                          </div>

                          <div className="bg-blue-500/5 border-l-4 border-blue-500 p-4 mt-6 rounded-r-xl">
                            <div className="flex items-start gap-3">
                              <Sparkles className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                              <p className="text-sm text-zinc-300 leading-relaxed italic font-medium">
                                {match.reason}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-6">
                            {match.alumnus?.expertise.map((skill: string, sIdx: number) => (
                              <span key={sIdx} className="bg-zinc-800 text-zinc-400 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-zinc-700 group-hover:border-zinc-600 transition-colors">
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
