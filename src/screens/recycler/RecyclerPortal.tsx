import React, { useState } from 'react';
import { Transaction, Language, UserProfile, WasteCategoryInfo, Recycler } from '../../types';
import { RecyclerBottomNav, RecyclerNavTab } from '../../components/RecyclerBottomNav';
import { RecyclerHomeScreen } from './RecyclerHomeScreen';
import { RecyclerRateManagerScreen } from './RecyclerRateManagerScreen';
import { RecyclerHandoverScreen } from './RecyclerHandoverScreen';
import { RecyclerEprLedgerScreen } from './RecyclerEprLedgerScreen';
import { RecyclerProfileScreen } from './RecyclerProfileScreen';
import { IncomingRequestModal } from './IncomingRequestModal';
import { saveTransactions } from '../../utils/storage';
import { playChime } from '../../utils/audioSpeech';

interface RecyclerPortalProps {
  transactions: Transaction[];
  onUpdateTransactions: (updated: Transaction[]) => void;
  currentUser: UserProfile | null;
  language: Language;
  onSwitchToCollector: () => void;
  onLogout: () => void;
  categories?: WasteCategoryInfo[];
  onCategoriesUpdated?: (cats: WasteCategoryInfo[]) => void;
  recyclers?: Recycler[];
  onRecyclersUpdated?: (recs: Recycler[]) => void;
}

export const RecyclerPortal: React.FC<RecyclerPortalProps> = ({
  transactions,
  onUpdateTransactions,
  currentUser,
  language,
  onSwitchToCollector,
  onLogout,
  categories = [],
  onCategoriesUpdated,
  recyclers = [],
  onRecyclersUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<RecyclerNavTab>('requests');
  const [inspectingTxn, setInspectingTxn] = useState<Transaction | null>(null);
  const [targetHandoverTxnId, setTargetHandoverTxnId] = useState<string | undefined>(undefined);

  // Find active recycler profile (matching ownerUid or first available)
  const currentRecycler = recyclers.find(
    (r) => r.ownerUid === currentUser?.id || r.id === (currentUser as any)?.facilityId
  ) || recyclers[0] || null;

  // Accept a collector's pickup request
  const handleAcceptRequest = (transactionId: string) => {
    const updated = transactions.map((t) => {
      if (t.id === transactionId) {
        return {
          ...t,
          status: 'accepted' as const,
        };
      }
      return t;
    });
    onUpdateTransactions(updated);
    saveTransactions(updated);
    setInspectingTxn(null);
  };

  // Reject a collector's pickup request
  const handleRejectRequest = (transactionId: string, reason?: string) => {
    const updated = transactions.map((t) => {
      if (t.id === transactionId) {
        return {
          ...t,
          status: 'rejected' as const,
        };
      }
      return t;
    });
    onUpdateTransactions(updated);
    saveTransactions(updated);
    setInspectingTxn(null);
  };

  // Counter-offer
  const handleCounterOffer = (
    transactionId: string,
    counterPricePerKg: number,
    note: string
  ) => {
    const updated = transactions.map((t) => {
      if (t.id === transactionId) {
        const weight = t.payload?.weightKg || 1;
        const total = Math.round(counterPricePerKg * weight);
        return {
          ...t,
          counterOffer: {
            counterPrice: total,
            counterPricePerKg,
            note,
            status: 'pending' as const,
            createdAt: Date.now(),
          },
        };
      }
      return t;
    });
    onUpdateTransactions(updated);
    saveTransactions(updated);
    setInspectingTxn(null);
  };

  // Confirm Handover
  const handleConfirmHandover = (
    transactionId: string,
    verifiedWeightKg: number,
    finalAmount: number,
    notes?: string
  ) => {
    const updated = transactions.map((t) => {
      if (t.id === transactionId) {
        return {
          ...t,
          status: 'completed' as const,
          payload: {
            ...t.payload,
            weightKg: verifiedWeightKg,
            totalEstimatedPrice: finalAmount,
          },
          payment: {
            ...t.payment,
            amount: finalAmount,
            status: 'completed' as const,
            utrNumber: `UTR-SBIN-${Date.now().toString().slice(-6)}-REC`,
          },
          ledgerBlock: {
            ...t.ledgerBlock,
            currentBlockHash: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
            eprCreditUnits: verifiedWeightKg,
          },
        };
      }
      return t;
    });
    onUpdateTransactions(updated);
    saveTransactions(updated);
  };

  // Navigate directly to handover tab with a specific transaction ID
  const handleNavigateToHandover = (transactionId?: string) => {
    setTargetHandoverTxnId(transactionId);
    setInspectingTxn(null);
    setActiveTab('handover');
  };

  const pendingRequestsCount = transactions.filter(
    (t) => t.status === 'pending_pickup' || t.status === 'draft'
  ).length;

  return (
    <div id="recycler-portal-root" className="min-h-screen bg-[#F7F9F8] flex flex-col justify-between">
      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {activeTab === 'requests' && (
          <RecyclerHomeScreen
            transactions={transactions}
            currentUser={currentUser}
            language={language}
            onSelectRequest={(txn) => setInspectingTxn(txn)}
            onNavigateToHandover={handleNavigateToHandover}
            onNavigateToLedger={() => setActiveTab('compliance')}
            onNavigateToRates={() => setActiveTab('rates')}
            onSwitchToCollector={onSwitchToCollector}
          />
        )}

        {activeTab === 'rates' && (
          <RecyclerRateManagerScreen
            categories={categories}
            currentRecycler={currentRecycler}
            language={language}
            onCategoriesUpdated={onCategoriesUpdated}
            onRecyclerUpdated={(updatedRec) => {
              if (onRecyclersUpdated) {
                const nextRecs = recyclers.map((r) => r.id === updatedRec.id ? updatedRec : r);
                onRecyclersUpdated(nextRecs);
              }
            }}
          />
        )}

        {activeTab === 'handover' && (
          <RecyclerHandoverScreen
            transactions={transactions}
            initialTransactionId={targetHandoverTxnId}
            currentUser={currentUser}
            language={language}
            onConfirmHandover={handleConfirmHandover}
            onBackToDashboard={() => setActiveTab('requests')}
          />
        )}

        {activeTab === 'compliance' && (
          <RecyclerEprLedgerScreen
            transactions={transactions}
            currentUser={currentUser}
            language={language}
          />
        )}

        {(activeTab === 'profile' || activeTab === 'settings') && (
          <RecyclerProfileScreen
            currentUser={currentUser}
            language={language}
            onSwitchToCollector={onSwitchToCollector}
            onLogout={onLogout}
          />
        )}
      </main>

      {/* Inspecting Request Modal */}
      {inspectingTxn && (
        <IncomingRequestModal
          transaction={inspectingTxn}
          language={language}
          onClose={() => setInspectingTxn(null)}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
          onCounterOffer={handleCounterOffer}
          onVerifyHandoverDirect={handleNavigateToHandover}
        />
      )}

      {/* Recycler Bottom Navigation Bar */}
      <RecyclerBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          playChime('click');
          setActiveTab(tab);
        }}
        pendingCount={pendingRequestsCount}
        language={language}
      />
    </div>
  );
};
