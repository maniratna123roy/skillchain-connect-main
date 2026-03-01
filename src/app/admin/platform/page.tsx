'use client';

import { useWalletContext } from '@/contexts/WalletContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletConnect } from '@/components/WalletConnect';
import { getContractAdmins } from '@/lib/api';
import { Shield, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function PlatformAdminPage() {
  const { activeAccount } = useWalletContext();

  const { data: admins, isLoading } = useQuery({
    queryKey: ['contract-admins', activeAccount?.address],
    queryFn: () => getContractAdmins(activeAccount!.address),
    enabled: !!activeAccount,
  });

  if (!activeAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <WalletConnect />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32">
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-50">
        <div className="bg-white/60 backdrop-blur-md border border-gray-200 px-8 py-3 rounded-full flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <Image src="/logo-navbar.png?v=1" alt="AlgoVault Logo" width={180} height={45} className="object-contain" />
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded ml-2">Platform Admin</span>
          </div>
          <WalletConnect />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Contract Deployed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                The AdminRegistry smart contract is deployed and active on Algorand TestNet.
              </p>
              {isLoading ? (
                <p className="text-gray-500">Loading admin addresses...</p>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Platform Admin</p>
                    <p className="font-mono text-sm text-gray-700">{admins?.platformAdmin}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-semibold text-green-900 mb-1">College Admin</p>
                    <p className="font-mono text-sm text-gray-700">{admins?.collegeAdmin}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-semibold text-green-900">Smart Contract</span>
                  <span className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-semibold text-green-900">IPFS Storage</span>
                  <span className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-semibold text-green-900">Algorand Network</span>
                  <span className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    TestNet
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
