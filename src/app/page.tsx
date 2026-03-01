'use client';

import { useWalletContext } from '@/contexts/WalletContext';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { WalletConnect } from '@/components/WalletConnect';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, Award, CheckCircle, ArrowRight, Wallet } from 'lucide-react';
import { getRole } from '@/lib/api';
import { Ripple } from '@/components/ui/ripple';
import TextType from '@/components/ui/TextType';
import FeatureCard from '@/components/ui/FeatureCard';
import NeoButton from '@/components/ui/NeoButton';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function HomePage() {
  const { activeAddress, isConnected } = useWalletContext();
  const router = useRouter();

  const { data: roleData, isError: isRoleError } = useQuery({
    queryKey: ['role', activeAddress],
    queryFn: () => getRole(activeAddress!),
    enabled: !!activeAddress && isConnected,
    retry: false, // Stop console spam if backend is down
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleNavigate = () => {
    if (roleData?.role === 'PLATFORM_ADMIN') {
      router.push('/admin/platform');
    } else if (roleData?.role === 'COLLEGE_ADMIN') {
      router.push('/admin/college');
    } else {
      router.push('/student');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-black text-white">
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-50">
        <div className="bg-black/60 backdrop-blur-md border border-white/20 px-8 py-3 rounded-full flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-3">
            <Image src="/logo-navbar.png?v=1" alt="AlgoVault Logo" width={180} height={45} className="object-contain" />
          </div>
          <WalletConnect />
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center container mx-auto px-4">
        {/* Hero Section */}
        <section className="relative min-h-screen w-full flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
          <Ripple />
          <div className="relative z-10 text-center">
            <TextType
              text={[
                "DECENTRALIZED ACADEMIC\nCREDENTIAL ISSUER",
                "SECURE. VERIFIABLE.\nPERMANENT.",
                "POWERED BY\nALGORAND BLOCKCHAIN"
              ]}
              className="text-white text-center outfit-bold mb-6 text-[70px] font-bold block leading-tight min-h-[180px]"
              typingSpeed={70}
              pauseDuration={2000}
              showCursor={true}
              cursorCharacter="_"
            />
            <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed text-center outfit-bold uppercase tracking-wider">
              Issue real NFT credentials on Algorand blockchain. Secure, verifiable, and permanent.
            </p>
            {!isConnected ? (
              <div className="flex justify-center">
                <WalletConnect />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 mt-4">
                {isRoleError ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-xl text-sm flex items-center gap-3 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Shield className="h-5 w-5 animate-pulse" />
                    <div className="flex flex-col">
                      <span className="font-bold uppercase tracking-wider">Offline Mode</span>
                      <span className="text-xs opacity-70">Backend server is currently unreachable</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-lg text-zinc-300">
                      Connected as: <span className="font-semibold text-white">{roleData?.role || 'Loading...'}</span>
                    </p>
                    <NeoButton
                      onClick={handleNavigate}
                      disabled={!roleData?.role}
                      hoverText="Go!"
                    >
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </NeoButton>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 w-full max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-white uppercase mb-16 text-center outfit-bold tracking-tighter"
          >
            Core Features
          </motion.h2>

          <div className="flex flex-wrap justify-center gap-12">
            <FeatureCard
              index={0}
              title="NFT Credentials"
              content="Convert your degrees and certificates into unique, tamper-proof NFTs on the blockchain."
              icon={<Award className="w-8 h-8" />}
            />
            <FeatureCard
              index={1}
              title="Algorand Security"
              content="Leverage the Pure Proof of Stake consensus for military-grade security and instant finality."
              icon={<Shield className="w-8 h-8" />}
            />
            <FeatureCard
              index={2}
              title="Instant Verdict"
              content="Institutions and employers can verify any credential instantly without manual overhead."
              icon={<CheckCircle className="w-8 h-8" />}
            />
            <FeatureCard
              index={3}
              title="Self-Sovereign"
              content="Take full ownership of your data. Your achievements, your keys, your future."
              icon={<Award className="w-8 h-8" />}
            />
            <FeatureCard
              index={4}
              title="Global Standard"
              content="Join a growing ecosystem of universities and companies adopting AlgoVault standards."
              icon={<Shield className="w-8 h-8" />}
            />
          </div>
        </section>

        {/* How to Use Section */}
        <section className="py-32 w-full max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-white uppercase mb-16 text-center outfit-bold tracking-tighter"
          >
            How it Works
          </motion.h2>

          <div className="flex flex-wrap justify-center gap-12">
            <FeatureCard
              index={0}
              title="1. Connect Wallet"
              content="Securely link your Algorand wallet to start your decentralized credential journey."
              icon={<Wallet className="w-8 h-8" />}
            />
            <FeatureCard
              index={1}
              title="2. Verify Identity"
              content="Identify as a Student or Institution to unlock specific blockchain permissions."
              icon={<Shield className="w-8 h-8" />}
            />
            <FeatureCard
              index={2}
              title="3. Issue & Request"
              content="Institutions mint NFT certificates; students request verification effortlessly."
              icon={<Award className="w-8 h-8" />}
            />
            <FeatureCard
              index={3}
              title="4. Verify Instantly"
              content="Employers and entities can verify your credentials on the ledger in real-time."
              icon={<CheckCircle className="w-8 h-8" />}
            />
          </div>
        </section>

        {/* Footer/Bottom spacing */}
        <div className="py-20 text-center text-zinc-600 text-sm">
          © 2026 AlgoVault Connect. All rights reserved.
        </div>
      </main>
    </div>
  );
}
