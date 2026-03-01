'use client';

import { useWalletContext } from '@/contexts/WalletContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletConnect } from '@/components/WalletConnect';
import { getPendingRequests, approveCredential, rejectCredential } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, XCircle, ExternalLink, Clock, ListChecks } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Ripple } from '@/components/ui/ripple';
import NeoButton from '@/components/ui/NeoButton';
import { Label } from '@/components/ui/label';
import TransactionNotification from '@/components/ui/TransactionNotification';
import ErrorNotification from '@/components/ui/ErrorNotification';

export default function CollegeAdminPage() {
  const router = useRouter();
  const { activeAccount } = useWalletContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['pending-requests', activeAccount?.address],
    queryFn: () => getPendingRequests(activeAccount!.address),
    enabled: !!activeAccount,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => approveCredential(id, activeAccount!.address),
    onSuccess: (data) => {
      toast({
        title: "",
        description: (
          <TransactionNotification
            title="CREDENTIAL APPROVED"
            message={`Asset #${data.assetId} minted for student.`}
          />
        ),
      });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: "",
        description: (
          <ErrorNotification title="APPROVAL FAILED" message={error.message} />
        ),
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectCredential(id, reason, activeAccount!.address),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Request rejected' });
      setRejectingId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: "",
        description: (
          <ErrorNotification title="REJECTION FAILED" message={error.message} />
        ),
        variant: 'destructive',
      });
    },
  });

  if (!activeAccount) {
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
            <CardTitle className="text-3xl font-black uppercase tracking-tighter outfit-bold text-white">
              Admin Access
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
              College Admin
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
            <WalletConnect />
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-4 pt-40 pb-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black uppercase tracking-tighter outfit-bold text-white flex items-center gap-3">
            <ListChecks className="h-8 w-8 text-blue-500" />
            Credential Verification
          </h2>
          <p className="text-zinc-400 mt-2 font-medium">Review and validate student credential requests on the Algorand blockchain.</p>
        </div>

        <Card className="bg-zinc-900 border-4 border-zinc-800 shadow-[10px_10px_0px_0px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[15px_15px_0px_0px_#ffffff] hover:border-white">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white uppercase tracking-tight outfit-bold flex items-center gap-2">
              Pending Requests
              {requests?.data?.length > 0 && (
                <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded ml-2">
                  {requests.data.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center py-12 text-zinc-500">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                <p className="font-bold uppercase text-xs tracking-widest">Fetching requests...</p>
              </div>
            ) : requests?.data?.length === 0 ? (
              <div className="text-center py-16 border-4 border-dashed border-zinc-800 rounded-2xl group hover:border-zinc-700 transition-colors">
                <CheckCircle className="h-12 w-12 text-zinc-800 mx-auto mb-4 group-hover:text-green-500/50 transition-colors" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">All caught up! No pending requests.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {requests?.data?.map((req: any) => (
                  <Card key={req.id} className="bg-black/40 border-2 border-zinc-800 hover:border-blue-500/50 transition-all duration-300 overflow-hidden group">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Credential ID</p>
                          <p className="text-lg font-black text-white uppercase tracking-tight outfit-bold">{req.credential_id}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Degree Name</p>
                          <p className="text-lg font-black text-white uppercase tracking-tight outfit-bold underline decoration-blue-500 decoration-2 underline-offset-4">{req.degree_name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Graduation Year</p>
                          <p className="text-lg font-black text-white uppercase tracking-tight outfit-bold">{req.graduation_year}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Student Wallet</p>
                          <p className="font-mono text-xs text-blue-400 bg-blue-500/5 px-2 py-1 rounded inline-block mt-1">
                            {req.student_wallet.slice(0, 8)}...{req.student_wallet.slice(-6)}
                          </p>
                        </div>
                      </div>

                      <div className="mb-8 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 group-hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 p-2 rounded-lg">
                              <Shield className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white uppercase tracking-tight">Audit Document</p>
                              <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]" title={req.document_hash}>
                                Hash: {req.document_hash}
                              </p>
                            </div>
                          </div>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${req.document_ipfs_cid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-black text-[10px] font-black uppercase px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-all duration-300"
                          >
                            Review PDF <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      {rejectingId === req.id ? (
                        <div className="space-y-4 bg-red-500/5 p-6 rounded-2xl border-2 border-red-500/20">
                          <div className="space-y-2">
                            <Label className="text-red-400 font-bold uppercase text-[10px] tracking-widest">Reason for Rejection</Label>
                            <Input
                              placeholder="Explain why this request is being rejected..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="bg-black/50 border-red-500/20 focus:border-red-500 text-white h-12"
                            />
                          </div>
                          <div className="flex gap-3">
                            <NeoButton
                              onClick={() => rejectMutation.mutate({ id: req.id, reason: rejectReason })}
                              disabled={!rejectReason || rejectMutation.isPending}
                              hoverText="Reject Now"
                              className="bg-red-600 border-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                            </NeoButton>
                            <NeoButton
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason('');
                              }}
                              hoverText="Cancel"
                            >
                              Go Back
                            </NeoButton>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-4">
                          <NeoButton
                            onClick={() => approveMutation.mutate({ id: req.id })}
                            disabled={approveMutation.isPending}
                            hoverText="MINT NFT"
                            className="bg-green-600 border-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {approveMutation.isPending ? 'Minting NFT...' : 'Approve & Mint NFT'}
                          </NeoButton>
                          <NeoButton
                            onClick={() => setRejectingId(req.id)}
                            hoverText="Reject"
                            className="bg-zinc-800 border-zinc-700 hover:bg-red-600 hover:border-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Request
                          </NeoButton>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
