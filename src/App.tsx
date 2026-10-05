import React, { useState, useMemo } from 'react';
import {
  Shield, AlertTriangle, Activity, Settings, BarChart3, Database,
  FileText, Clock, Filter, Plus, Search, CheckCircle2, XCircle,
  RefreshCw, Download, ArrowUpRight, ChevronRight, Play, Eye,
  Sliders, UserCheck, Smartphone, Send, Lock, Globe, ListFilter,
  Check, X, Server, Layers, HelpCircle, AlertOctagon, Terminal
} from 'lucide-react';

// Mock Data Definitions
interface RuleItem {
  id: string;
  stage: string;
  condition: string;
  action: 'PROCEED' | 'SUSPECT' | 'BLOCK_COMPLETE' | 'QUARANTINE' | 'INLINE_WARNING';
  reason: string;
  priority: number;
  enabled: boolean;
}

interface CampaignItem {
  id: string;
  sampleText: string;
  size: number;
  uniqueSenders: number;
  network: string;
  category: string;
  status: 'UNDECIDED' | 'SPAM' | 'LEGITIMATE';
  variations: string[];
  numbers: string[];
}

interface CdrRecord {
  id: string;
  timestamp: string;
  originatingGt: string;
  senderMsisdn: string;
  recipientMsisdn: string;
  textSnippet: string;
  decision: string;
  action: string;
  category: string;
}

const initialRules: RuleItem[] = [
  { id: 'R-101', stage: 'SENDER', condition: 'SENDER_REPUTATION <= 20', action: 'BLOCK_COMPLETE', reason: 'High Risk Bad Sender Score', priority: 1, enabled: true },
  { id: 'R-102', stage: 'CONTENT', condition: 'MATCH_PATTERN("FINANCE_PHISH") AND UNIQUE_RECIPIENTS > 30', action: 'BLOCK_COMPLETE', reason: 'Bulk Bank Phishing Fingerprint', priority: 2, enabled: true },
  { id: 'R-103', stage: 'SOCIAL_GRAPH', condition: 'PAIR_EXCHANGE_COUNT >= 5 IN 24H', action: 'PROCEED', reason: 'Two-way Dialogue Whitelist', priority: 3, enabled: true },
  { id: 'R-104', stage: 'REPUTATION', condition: 'SUSPICIOUS_EVENT_WEIGHT >= 40', action: 'SUSPECT', reason: 'Anomalous Volume Deviation', priority: 4, enabled: true },
  { id: 'R-105', stage: 'URL', condition: 'URL_IN_BLACKLIST', action: 'BLOCK_COMPLETE', reason: 'Known Malware Domain Gateway', priority: 5, enabled: true },
  { id: 'R-106', stage: 'CONTENT', condition: 'HOMOGLYPH_SIMILARITY >= 0.85', action: 'INLINE_WARNING', reason: 'Cyrillic-Latin Impersonation Detected', priority: 6, enabled: true },
];

const initialCampaigns: CampaignItem[] = [
  {
    id: 'CMP-89412',
    sampleText: 'Chuc mung quy khach nhan duoc goi vay uu dai 50tr lai suat 0%. Nhan tin VAY gửi 87xx hoac truy cap http://vay-nhanh247.vip',
    size: 1420,
    uniqueSenders: 636,
    network: 'Off-net (Tesla Mobile / Roaming)',
    category: 'Fake Financial Loan',
    status: 'UNDECIDED',
    variations: [
      'Chuc mung quy khach nhan duoc goi vay uu dai 50tr lai suat 0%...',
      'Thong bao: Quy khach duoc duyet khoan vay 50tr tra gop 0%...',
      'VAY CAP TOC 50 TR TRONG NGAY, lai suat 0% thang dau...'
    ],
    numbers: ['+84912348821', '+84912348822', '+84912348823', '+84912348829', '+84988771120']
  },
  {
    id: 'CMP-77201',
    sampleText: 'Tai khoan cua ban da dang nhap tren thiet bi khac. Xac minh ngay tai http://vietcombank-xacthuc.site de tranh bi khoa the.',
    size: 890,
    uniqueSenders: 145,
    network: 'Off-net GT: +8490000012',
    category: 'Bank Brand Spoofing Phishing',
    status: 'SPAM',
    variations: [
      'Tai khoan cua ban da dang nhap tren thiet bi khac. Xac minh ngay...',
      'Canh bao: Phat hien giao dich bat thuong 15,000,000d. Xac minh tai...'
    ],
    numbers: ['+84703991201', '+84703991202', '+84703991203']
  },
  {
    id: 'CMP-55410',
    sampleText: 'Ma OTP xac thuc dang nhap cua ban la 892011. Ma co hieu luc trong 3 phut. Vui long khong chia se cho bat ky ai.',
    size: 5120,
    uniqueSenders: 1,
    network: 'On-net Brandname (SMSC Core)',
    category: 'Transactional Banking OTP',
    status: 'LEGITIMATE',
    variations: ['Ma OTP xac thuc dang nhap cua ban la [OTP]...'],
    numbers: ['BANK_OTP_GATEWAY']
  },
  {
    id: 'CMP-41092',
    sampleText: 'Shopee tang ban voucher 200k don 0d mung dai tiec sinh nhat. Click shope.ee/sale-voucher de nhan ngay hom nay!',
    size: 3410,
    uniqueSenders: 4,
    network: 'Aggregator Partner Route 4',
    category: 'E-commerce Promotion',
    status: 'LEGITIMATE',
    variations: ['Shopee tang ban voucher 200k don 0d mung dai tiec...'],
    numbers: ['SHOPEE_PROMO']
  }
];

const mockCdrs: CdrRecord[] = [
  { id: 'CDR-991823', timestamp: '2026-10-05 13:42:10', originatingGt: '+8490000012', senderMsisdn: '+84912348821', recipientMsisdn: '+84988771234', textSnippet: 'Chuc mung quy khach nhan duoc goi vay uu dai 50tr...', decision: 'SUSPECT_CAMPAIGN', action: 'BLOCK_COMPLETE', category: 'Fake Loan' },
  { id: 'CDR-991824', timestamp: '2026-10-05 13:42:11', originatingGt: '+8490000012', senderMsisdn: '+84912348822', recipientMsisdn: '+84988775566', textSnippet: 'Thong bao: Quy khach duoc duyet khoan vay 50tr tra gop...', decision: 'SUSPECT_CAMPAIGN', action: 'BLOCK_COMPLETE', category: 'Fake Loan' },
  { id: 'CDR-991825', timestamp: '2026-10-05 13:42:15', originatingGt: '+8491000099', senderMsisdn: 'BANK_OTP_GATEWAY', recipientMsisdn: '+84903112233', textSnippet: 'Ma OTP xac thuc dang nhap la 441029...', decision: 'WHITELIST_RULE', action: 'PROCEED', category: 'Bank OTP' },
  { id: 'CDR-991826', timestamp: '2026-10-05 13:42:18', originatingGt: '+8498000004', senderMsisdn: '+84703991201', recipientMsisdn: '+84912889900', textSnippet: 'Tai khoan cua ban da dang nhap tren thiet bi khac...', decision: 'HOMOGLYPH_MATCH', action: 'BLOCK_COMPLETE', category: 'Phishing' },
  { id: 'CDR-991827', timestamp: '2026-10-05 13:42:22', originatingGt: '+8490123999', senderMsisdn: '+84933556677', recipientMsisdn: '+84977443322', textSnippet: 'Toi dang ve nha nhe, ti an com.', decision: 'SOCIAL_GRAPH_OK', action: 'PROCEED', category: 'P2P Normal' },
  { id: 'CDR-991828', timestamp: '2026-10-05 13:42:26', originatingGt: '+8490000012', senderMsisdn: '+84912348829', recipientMsisdn: '+84944556677', textSnippet: 'VAY CAP TOC 50 TR TRONG NGAY, lai suat 0%...', decision: 'SUSPECT_CAMPAIGN', action: 'BLOCK_COMPLETE', category: 'Fake Loan' },
];

export default function App() {
  const [activeMenu, setActiveMenu] = useState<'monitoring' | 'rules' | 'patterns' | 'senderModule' | 'overview' | 'campaigns' | 'discovery' | 'learning'>('campaigns');
  const [rules, setRules] = useState<RuleItem[]>(initialRules);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(initialCampaigns);
  const [cdrs, setCdrs] = useState<CdrRecord[]>(mockCdrs);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(initialCampaigns[0]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Feedback
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // New Rule Form State
  const [newRuleStage, setNewRuleStage] = useState('CONTENT');
  const [newRuleCondition, setNewRuleCondition] = useState('');
  const [newRuleAction, setNewRuleAction] = useState<'PROCEED' | 'SUSPECT' | 'BLOCK_COMPLETE' | 'QUARANTINE' | 'INLINE_WARNING'>('BLOCK_COMPLETE');
  const [newRuleReason, setNewRuleReason] = useState('');

  // New Pattern Form State
  const [newPatternText, setNewPatternText] = useState('');
  const [newPatternType, setNewPatternType] = useState('EXACT');
  const [newPatternGroup, setNewPatternGroup] = useState('FINANCE_PHISH');
  const [newPatternExpiry, setNewPatternExpiry] = useState('6_MONTHS');

  // Reputation Weights State (Learning Module)
  const [repWeights, setRepWeights] = useState({
    badContent: 85,
    highVolume: 45,
    uniqueRecipients: 70,
    twoWayDialogueDiscount: -60,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Rule Creation Handler
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleCondition.trim() || !newRuleReason.trim()) {
      showToast('Vui lòng nhập đầy đủ Điều kiện và Lý do chặn (Required fields)', 'error');
      return;
    }
    setLoadingAction('Đang biên dịch và áp dụng Rule vào Filtering Engine...');
    setTimeout(() => {
      const createdRule: RuleItem = {
        id: `R-${Math.floor(100 + Math.random() * 900)}`,
        stage: newRuleStage,
        condition: newRuleCondition,
        action: newRuleAction,
        reason: newRuleReason,
        priority: rules.length + 1,
        enabled: true,
      };
      setRules([createdRule, ...rules]);
      setLoadingAction(null);
      setIsRuleModalOpen(false);
      setNewRuleCondition('');
      setNewRuleReason('');
      showToast(`Rule ${createdRule.id} đã được kích hoạt thành công trên SpamShield Core!`, 'success');
    }, 1200);
  };

  // Pattern Creation Handler
  const handleSavePattern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatternText.trim()) {
      showToast('Vui lòng nhập từ khóa hoặc biểu thức Pattern!', 'error');
      return;
    }
    setLoadingAction('Đang cập nhật từ khóa và đồng bộ với Fuzzy Match Engine...');
    setTimeout(() => {
      setLoadingAction(null);
      setIsPatternModalOpen(false);
      setNewPatternText('');
      showToast(`Pattern "${newPatternText}" đã thêm vào Group ${newPatternGroup}!`, 'success');
    }, 1200);
  };

  // Campaign Action Handlers
  const handleCampaignAction = (campaignId: string, actionType: 'SPAM' | 'LEGITIMATE' | 'REVERT') => {
    setLoadingAction(`Đang xử lý phân loại chiến dịch ${campaignId}...`);
    setTimeout(() => {
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId) {
          return { ...c, status: actionType === 'REVERT' ? 'UNDECIDED' : actionType };
        }
        return c;
      }));
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(prev => prev ? { ...prev, status: actionType === 'REVERT' ? 'UNDECIDED' : actionType } : null);
      }
      setLoadingAction(null);
      if (actionType === 'SPAM') {
        showToast(`Chiến dịch ${campaignId} đã được đánh dấu SPAM. Fingerprint đã được đưa vào Blacklist tự động!`, 'success');
      } else if (actionType === 'LEGITIMATE') {
        showToast(`Chiến dịch ${campaignId} đã được duyệt HỢP LỆ (Whitelist). Lưu lượng sẽ được Forward bình thường.`, 'info');
      } else {
        showToast(`Đã thu hồi quyết định cho chiến dịch ${campaignId}. Trở về trạng thái chờ phân tích.`, 'info');
      }
    }, 1000);
  };

  // HLR / HSS API Integration Simulation
  const handleTriggerHlrHss = (senderNumber: string) => {
    setLoadingAction(`Đang kích hoạt API REST tới HLR/HSS chặn thuê bao ${senderNumber}...`);
    setTimeout(() => {
      setLoadingAction(null);
      showToast(`Khóa dịch vụ SMS thành công trên HLR/HSS cho thuê bao ${senderNumber} (HTTP 200 OK)!`, 'success');
    }, 1500);
  };

  // Filtered Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sampleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [campaigns, searchQuery, statusFilter]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased">
      {/* Loading Overlay */}
      {loadingAction && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="flex flex-col items-center rounded-xl bg-white p-6 shadow-2xl">
            <RefreshCw className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="mt-4 font-semibold text-slate-700">{loadingAction}</p>
            <p className="mt-1 text-xs text-slate-400">Hệ thống đang đồng bộ dữ liệu vào Core SpamShield...</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4"
          style={{
            backgroundColor: toast.type === 'success' ? '#ECFDF5' : toast.type === 'error' ? '#FEF2F2' : '#EFF6FF',
            borderColor: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#3B82F6',
            color: toast.type === 'success' ? '#065F46' : toast.type === 'error' ? '#991B1B' : '#1E40AF',
          }}
        >
          {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          {toast.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-600" />}
          {toast.type === 'info' && <Shield className="h-5 w-5 text-blue-600" />}
          <div className="text-sm font-medium">{toast.message}</div>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* LEFT SIDEBAR (Dark Navy/Slate as in Video: #1e2530) */}
      <aside className="flex w-64 flex-col bg-[#1e2530] text-slate-300 border-r border-slate-700 select-none shrink-0">
        {/* Logo Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-700/60 px-5 bg-[#171e27]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white font-black text-xl shadow-md">
            M
          </div>
          <div>
            <div className="font-bold text-base tracking-wider text-white">MAVENIR</div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">SpamShield Core</div>
          </div>
        </div>

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
          {/* SECTION: MONITORING */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Monitoring
            </div>
            <button
              onClick={() => setActiveMenu('monitoring')}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-medium transition ${activeMenu === 'monitoring' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <Activity className="h-4 w-4" />
              <span>Management Station</span>
            </button>
          </div>

          {/* SECTION: CONFIGURATION */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Configuration
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveMenu('rules')}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-medium transition ${activeMenu === 'rules' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'}`}
              >
                <Sliders className="h-4 w-4" />
                <span>Filtering Rules Engine</span>
              </button>
              <button
                onClick={() => setActiveMenu('patterns')}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-medium transition ${activeMenu === 'patterns' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'}`}
              >
                <Filter className="h-4 w-4" />
                <span>Pattern Match / Fuzzy</span>
              </button>
              <button
                onClick={() => setActiveMenu('senderModule')}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-medium transition ${activeMenu === 'senderModule' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'}`}
              >
                <Smartphone className="h-4 w-4" />
                <span>Sender & GT Modules</span>
              </button>
              <button
                onClick={() => setActiveMenu('learning')}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-medium transition ${activeMenu === 'learning' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'}`}
              >
                <Shield className="h-4 w-4" />
                <span>Reputation & Learning</span>
              </button>
            </div>
          </div>

          {/* SECTION: ANALYTICS */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Analytics & Intelligence
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveMenu('overview')}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-medium transition ${activeMenu === 'overview' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'}`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Traffic Overview</span>
              </button>
              <button
                onClick={() => setActiveMenu('campaigns')}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-medium transition ${activeMenu === 'campaigns' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'}`}
              >
                <Layers className="h-4 w-4" />
                <span>Campaign Browser</span>
              </button>
              <button
                onClick={() => setActiveMenu('discovery')}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-medium transition ${activeMenu === 'discovery' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'}`}
              >
                <Database className="h-4 w-4" />
                <span>Discovery View (CDRs)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-700/60 p-3 text-[11px] text-slate-400 bg-[#171e27]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Core STP/DRA Online
            </span>
            <span className="text-[10px] text-slate-400">v14.2-SP6</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-xs">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <span>SPAMSHIELD Monitoring & Policy Station</span>
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Training Sandbox
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export Report</span>
            </button>

            <button
              onClick={() => {
                setLoadingAction('Đang làm mới dữ liệu thời gian thực từ Signaling Firewall...');
                setTimeout(() => {
                  setLoadingAction(null);
                  showToast('Đã làm mới dữ liệu thống kê!', 'info');
                }, 800);
              }}
              className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Core</span>
            </button>

            <div className="ml-3 flex items-center gap-2 border-l pl-3 border-slate-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-white font-bold text-xs">
                PS
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold text-slate-800">Peter S.</div>
                <div className="text-[10px] text-slate-400">Senior Telco SecOps</div>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100">
          {/* TAB 1: CAMPAIGN BROWSER (Main feature showcased in video at 29:00 - 37:00) */}
          {activeMenu === 'campaigns' && (
            <div className="space-y-6">
              {/* Top Banner KPI */}
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="text-xs font-medium text-slate-500">Active Spam Campaigns</div>
                  <div className="mt-1 text-2xl font-bold text-red-600">23</div>
                  <div className="mt-1 text-[11px] text-slate-400">Automatically clustered by AI</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="text-xs font-medium text-slate-500">Total Filtered Messages</div>
                  <div className="mt-1 text-2xl font-bold text-slate-800">20,061</div>
                  <div className="mt-1 text-[11px] text-emerald-600 font-medium">99.88% Accuracy</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="text-xs font-medium text-slate-500">Identified Rogue SIM Farms</div>
                  <div className="mt-1 text-2xl font-bold text-amber-600">14</div>
                  <div className="mt-1 text-[11px] text-slate-400">High-volume burst detected</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="text-xs font-medium text-slate-500">Active Firewall Block Rate</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-600">100%</div>
                  <div className="mt-1 text-[11px] text-slate-400">Zero legitimate SMS dropped</div>
                </div>
              </div>

              {/* Action Toolbar & Filters */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm ID, từ khóa tin nhắn, category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="UNDECIDED">Chờ quyết định (Undecided)</option>
                    <option value="SPAM">Đã xác nhận SPAM</option>
                    <option value="LEGITIMATE">Hợp lệ (Legitimate)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Hiển thị {filteredCampaigns.length} chiến dịch</span>
                </div>
              </div>

              {/* Master-Detail Split View (Video style: Table + Detailed inspection below/beside) */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left Table: Campaigns List */}
                <div className="col-span-7 rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-xs text-slate-700 flex justify-between items-center">
                    <span>Danh sách Chiến dịch phát hiện (AI Campaign Clustering)</span>
                    <span className="text-[11px] text-slate-400">Click dòng để xem chi tiết</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">ID Chiến dịch</th>
                          <th className="px-4 py-3">Mẫu nội dung (Sample Text)</th>
                          <th className="px-4 py-3 text-right">Lưu lượng</th>
                          <th className="px-4 py-3 text-right">Số SIM</th>
                          <th className="px-4 py-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCampaigns.map((camp) => (
                          <tr
                            key={camp.id}
                            onClick={() => setSelectedCampaign(camp)}
                            className={`cursor-pointer transition hover:bg-slate-50 ${selectedCampaign?.id === camp.id ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : ''}`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                              {camp.id}
                            </td>
                            <td className="px-4 py-3 max-w-xs truncate text-slate-600">
                              {camp.sampleText}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                              {camp.size.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600">
                              {camp.uniqueSenders}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {camp.status === 'SPAM' && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                  SPAM
                                </span>
                              )}
                              {camp.status === 'LEGITIMATE' && (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                  LEGITIMATE
                                </span>
                              )}
                              {camp.status === 'UNDECIDED' && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                  UNDECIDED
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Panel: Campaign Detail & Decision Actions */}
                <div className="col-span-5 rounded-lg border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                  {selectedCampaign ? (
                    <div className="space-y-4">
                      {/* Header & Status */}
                      <div className="flex items-start justify-between border-b pb-3 border-slate-200">
                        <div>
                          <div className="text-xs text-slate-400">Chi tiết chiến dịch</div>
                          <div className="text-base font-bold text-slate-800">{selectedCampaign.id}</div>
                          <div className="text-xs font-medium text-emerald-700">{selectedCampaign.category}</div>
                        </div>
                        <div>
                          {selectedCampaign.status === 'SPAM' && (
                            <span className="rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                              SPAM (BLOCKED)
                            </span>
                          )}
                          {selectedCampaign.status === 'LEGITIMATE' && (
                            <span className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                              LEGITIMATE (PASSED)
                            </span>
                          )}
                          {selectedCampaign.status === 'UNDECIDED' && (
                            <span className="rounded-md bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-xs">
                              AWAITING REVIEW
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Originating Network & Metrics */}
                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-md">
                        <div>
                          <span className="text-slate-400 block">Nguồn phát (Origin):</span>
                          <span className="font-semibold text-slate-700">{selectedCampaign.network}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Số lượng gửi:</span>
                          <span className="font-mono font-bold text-slate-800">{selectedCampaign.size} tin nhắn</span>
                        </div>
                      </div>

                      {/* Content Variations (AI Generation / Permutation Detection) */}
                      <div>
                        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                          <span>Các biến thể văn bản (Permutations / Template Variants):</span>
                          <span className="text-[10px] text-slate-400">{selectedCampaign.variations.length} biến thể</span>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {selectedCampaign.variations.map((v, i) => (
                            <div key={i} className="rounded-md border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-700 italic">
                              "{v}"
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SIM Farm Numbers list */}
                      <div>
                        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                          <span>Danh sách MSISDN gửi nhiều nhất (Top Senders):</span>
                          <span className="text-[10px] text-slate-400">{selectedCampaign.uniqueSenders} thuê bao</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {selectedCampaign.numbers.map((num, i) => (
                            <div key={i} className="flex items-center gap-1.5 rounded-sm bg-slate-100 px-2 py-1 text-[11px] font-mono text-slate-700 border border-slate-200">
                              <span>{num}</span>
                              <button
                                onClick={() => handleTriggerHlrHss(num)}
                                title="Gửi lệnh API tới HLR/HSS chặn thuê bao"
                                className="text-red-500 hover:text-red-700 ml-1"
                              >
                                <Lock className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* OPERATOR ACTION BUTTONS (As demonstrated in Video at 35:20) */}
                      <div className="pt-4 border-t border-slate-200 space-y-2">
                        <div className="text-xs font-semibold text-slate-600">Thao tác Quyết định của Operator:</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleCampaignAction(selectedCampaign.id, 'SPAM')}
                            className="flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm transition"
                          >
                            <AlertOctagon className="h-4 w-4" />
                            <span>Xác nhận SPAM (Blacklist)</span>
                          </button>
                          <button
                            onClick={() => handleCampaignAction(selectedCampaign.id, 'LEGITIMATE')}
                            className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
                          >
                            <Check className="h-4 w-4" />
                            <span>Duyệt Hợp Lệ (Whitelist)</span>
                          </button>
                        </div>
                        {selectedCampaign.status !== 'UNDECIDED' && (
                          <button
                            onClick={() => handleCampaignAction(selectedCampaign.id, 'REVERT')}
                            className="w-full text-center text-xs text-slate-500 hover:text-slate-800 underline py-1"
                          >
                            Thu hồi quyết định (Revert to Undecided)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-400 text-xs">
                      <Layers className="h-10 w-10 text-slate-300 mb-2" />
                      <span>Chọn một chiến dịch để thẩm định chi tiết</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FILTERING RULES ENGINE (Showcased in Video at 09:50 - 14:00) */}
          {activeMenu === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">SpamShield Central Rule Engine</h2>
                  <p className="text-xs text-slate-500">Cơ chế xử lý luồng báo hiệu IF-THEN-ELSE theo từng Stage (Sender, Content, Social Graph, Reputation).</p>
                </div>
                <button
                  onClick={() => setIsRuleModalOpen(true)}
                  className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tạo Rule Mới (Add Rule)</span>
                </button>
              </div>

              {/* Rules Table */}
              <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Ưu tiên</th>
                      <th className="px-4 py-3">Mã Rule</th>
                      <th className="px-4 py-3">Giai đoạn (Stage)</th>
                      <th className="px-4 py-3">Điều kiện logic (Condition)</th>
                      <th className="px-4 py-3">Hành động (Action)</th>
                      <th className="px-4 py-3">Lý do kỹ thuật (Reason)</th>
                      <th className="px-4 py-3 text-center">Bật/Tắt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.map((rule, idx) => (
                      <tr key={rule.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">#{rule.priority}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">{rule.id}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border">
                            {rule.stage}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-800 bg-emerald-50/40 rounded-sm">
                          {rule.condition}
                        </td>
                        <td className="px-4 py-3">
                          {rule.action === 'BLOCK_COMPLETE' && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                              BLOCK_COMPLETE
                            </span>
                          )}
                          {rule.action === 'PROCEED' && (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              PROCEED
                            </span>
                          )}
                          {rule.action === 'SUSPECT' && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                              SUSPECT
                            </span>
                          )}
                          {rule.action === 'INLINE_WARNING' && (
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                              INLINE_WARNING
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{rule.reason}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => {
                              setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
                              showToast(`Đã thay đổi trạng thái ${rule.id}`, 'info');
                            }}
                            className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PATTERN MATCH & HOMOGLYPH (Showcased in Video at 05:20 - 08:30) */}
          {activeMenu === 'patterns' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Cơ chế Nhận diện Mẫu (Pattern Match Engine)</h2>
                  <p className="text-xs text-slate-500">Hỗ trợ đối soát Khớp chính xác (Exact), Biểu thức chính quy (Regex), và Thuật toán đối sánh ký tự đồng hình (Homoglyph Attack Prevention).</p>
                </div>
                <button
                  onClick={() => setIsPatternModalOpen(true)}
                  className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm Pattern / Từ khóa</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Exact & Regex Matching</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Nhận diện trực tiếp các URL độc hại, cú pháp gọi vay, hoặc link phishing cố định.
                  </p>
                  <div className="space-y-2">
                    <div className="rounded-md bg-slate-50 p-2 font-mono text-xs text-slate-700 border">vay-nhanh247\.vip</div>
                    <div className="rounded-md bg-slate-50 p-2 font-mono text-xs text-slate-700 border">(0%|lai suat|giai ngan)</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-2">
                    <Eye className="h-4 w-4 text-purple-600" />
                    <span>Visual Homoglyph Match</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Chống tấn công lừa đảo dùng ký tự Cyrillic/Unicode trông giống hệt chữ cái Latin (ví dụ chữ 'a', 'o', 'e' giả).
                  </p>
                  <div className="rounded-md bg-purple-50 p-3 text-xs text-purple-900 border border-purple-200">
                    <span className="font-semibold block mb-1">Thuật toán Cosine Similarity</span>
                    <span>Tự động phát hiện khi kẻ xấu thay chữ 'o' bằng chữ Cyrillic 'о' để lọt lưới lọc thông thường.</span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-2">
                    <Sliders className="h-4 w-4 text-blue-600" />
                    <span>Levenshtein Near Match</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Khoảng cách chỉnh sửa chuỗi (String edit distance) bắt các biến thể cố tình chèn dấu cách, dấu gạch ngang.
                  </p>
                  <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-900 border border-blue-200">
                    <span className="font-semibold block mb-1">Edit Distance Threshold: 2</span>
                    <span>Khớp các chuỗi: "V-A-Y 5-0-T-R", "V.A.Y", "v a y" tương đương "VAY".</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SENDER & GT MODULE (Showcased in Video at 03:00 - 05:00) */}
          {activeMenu === 'senderModule' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">Sender & Global Title (GT) Provisioning</h2>
                <p className="text-xs text-slate-500">Quản lý danh sách Blacklist/Whitelist tự động hết hạn (Auto-expiring Timers) cho MSISDN và Signaling STP/DRA Gateway.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase">Sender Blacklist (Tự động hết hạn)</h3>
                    <span className="text-[11px] text-red-600 font-semibold">12 mục đang hoạt động</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-md border">
                      <div>
                        <span className="font-mono font-bold text-slate-800">+84912348821</span>
                        <span className="text-slate-400 block text-[10px]">Tự động thêm do vi phạm Campaign CMP-89412</span>
                      </div>
                      <span className="text-slate-500 text-[11px] font-mono">Hết hạn: 30 ngày</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-md border">
                      <div>
                        <span className="font-mono font-bold text-slate-800">+84703991201</span>
                        <span className="text-slate-400 block text-[10px]">Vietcombank Phishing Sender</span>
                      </div>
                      <span className="text-slate-500 text-[11px] font-mono">Hết hạn: 1 năm</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase">Sender Whitelist (Priority Pass)</h3>
                    <span className="text-[11px] text-emerald-600 font-semibold">5 đối tác được phê duyệt</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-md border">
                      <div>
                        <span className="font-mono font-bold text-slate-800">BANK_OTP_GATEWAY</span>
                        <span className="text-slate-400 block text-[10px]">Xác thực SMSC On-net đối soát trực tiếp</span>
                      </div>
                      <span className="text-emerald-600 font-semibold text-[11px]">Vĩnh viễn (Forever)</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-md border">
                      <div>
                        <span className="font-mono font-bold text-slate-800">SHOPEE_PROMO</span>
                        <span className="text-slate-400 block text-[10px]">Brandname Aggregator Route 4</span>
                      </div>
                      <span className="text-emerald-600 font-semibold text-[11px]">Vĩnh viễn (Forever)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REPUTATION & LEARNING WEIGHTS (Showcased in Video at 20:00 - 24:00) */}
          {activeMenu === 'learning' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">Reputation & Machine Learning Weights Configuration</h2>
                <p className="text-xs text-slate-500">Điều chỉnh trọng số phạt điểm uy tín (Penalty Contribution Weights) khi phát hiện dấu hiệu bất thường trên lưu lượng mạng.</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs max-w-2xl space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Trọng số Nội dung Độc hại (Bad Content Weight):</span>
                    <span className="font-mono text-emerald-600 font-bold">{repWeights.badContent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={repWeights.badContent}
                    onChange={(e) => setRepWeights({ ...repWeights, badContent: Number(e.target.value) })}
                    className="w-full accent-emerald-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Phạt điểm nặng nhất khi tin nhắn chứa từ khóa lừa đảo hoặc URL độc hại đã xác thực.</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Trọng số Tăng trưởng Lưu lượng Đột biến (High Volume Burst):</span>
                    <span className="font-mono text-emerald-600 font-bold">{repWeights.highVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={repWeights.highVolume}
                    onChange={(e) => setRepWeights({ ...repWeights, highVolume: Number(e.target.value) })}
                    className="w-full accent-emerald-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Phát hiện khi một thuê bao gửi vượt quá 30 tin nhắn trong vòng 5 phút.</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Trọng số Thuê bao Nhận Đơn lẻ (Unique Recipients Ratio):</span>
                    <span className="font-mono text-emerald-600 font-bold">{repWeights.uniqueRecipients}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={repWeights.uniqueRecipients}
                    onChange={(e) => setRepWeights({ ...repWeights, uniqueRecipients: Number(e.target.value) })}
                    className="w-full accent-emerald-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Phân biệt giữa gửi quảng cáo spam (gửi tới hàng trăm người khác nhau) và nhắn tin cá nhân bình thường.</p>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setLoadingAction('Đang cập nhật ma trận trọng số Machine Learning...');
                      setTimeout(() => {
                        setLoadingAction(null);
                        showToast('Đã lưu cấu hình trọng số Reputation thành công!', 'success');
                      }, 1000);
                    }}
                    className="rounded-md bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                  >
                    Lưu cấu hình ML Weights
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TRAFFIC OVERVIEW DASHBOARD (Showcased in Video at 24:30 - 28:00) */}
          {activeMenu === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Traffic Overview Analytics Dashboard</h2>
                  <p className="text-xs text-slate-500">Biểu đồ phân tích thời gian thực tổng lưu lượng, tỉ lệ chặn và phân bố lưu lượng theo giờ.</p>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Cập nhật: 2026-10-05 13:45:00 UTC
                </div>
              </div>

              {/* Graphic Visual Representation replicated from video */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-4">Lưu lượng tin nhắn theo giờ (Hourly Messages)</h3>
                  {/* Mock Bar Chart */}
                  <div className="flex h-56 items-end gap-4 pt-6 pb-2 border-b border-slate-200">
                    {[35, 45, 60, 80, 100, 95, 75, 50, 40, 65, 85, 90].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full rounded-t-sm bg-emerald-500 group-hover:bg-emerald-600 transition"
                          style={{ height: `${val * 1.8}px` }}
                        ></div>
                        <span className="text-[10px] text-slate-400">{i + 1}h</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 rounded-lg border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">Tỉ lệ Phân loại Trạng thái</h3>
                  {/* Donut representation */}
                  <div className="flex flex-col items-center justify-center my-auto">
                    <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-12 border-emerald-500 border-t-red-600 border-r-amber-500">
                      <div className="text-center">
                        <span className="text-xs text-slate-400 block">Blocked</span>
                        <span className="text-xl font-bold text-slate-800">23</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                        <span>Legitimate (99.88%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-600"></span>
                        <span>Blocked Spam (0.11%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                        <span>Quarantine / Suspect (0.01%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DISCOVERY VIEW (RAW CDRs) (Showcased in Video at 44:00 - 46:00) */}
          {activeMenu === 'discovery' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Discovery View: Call Detail Records (CDRs)</h2>
                  <p className="text-xs text-slate-500">Truy vấn chi tiết từng bản tin báo hiệu SS7 MAP / Diameter S6a / SIP IMS và quyết định của SpamShield.</p>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CDRs</span>
                </button>
              </div>

              {/* CDR Table */}
              <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Originating GT</th>
                      <th className="px-4 py-3">Sender MSISDN</th>
                      <th className="px-4 py-3">Recipient MSISDN</th>
                      <th className="px-4 py-3">Nội dung tin</th>
                      <th className="px-4 py-3">Lý do thẩm định</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {cdrs.map((cdr) => (
                      <tr key={cdr.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{cdr.timestamp}</td>
                        <td className="px-4 py-3 text-slate-700">{cdr.originatingGt}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{cdr.senderMsisdn}</td>
                        <td className="px-4 py-3 text-slate-600">{cdr.recipientMsisdn}</td>
                        <td className="px-4 py-3 font-sans max-w-xs truncate text-slate-700">{cdr.textSnippet}</td>
                        <td className="px-4 py-3 font-sans text-slate-500">{cdr.decision}</td>
                        <td className="px-4 py-3 text-center">
                          {cdr.action === 'BLOCK_COMPLETE' ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 font-sans">
                              BLOCKED
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 font-sans">
                              PASSED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: MANAGEMENT STATION (Processes, Events, Alarms) */}
          {activeMenu === 'monitoring' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">SpamShield Management Station</h2>
                <p className="text-xs text-slate-500">Giám sát trạng thái hoạt động của các tiến trình Core (Process Management & Node Clustering).</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {[
                  { name: 'SpamShield Rule Engine (Worker 1)', status: 'RUNNING', cpu: '14%', ram: '2.1 GB', uptime: '48d 12h' },
                  { name: 'SpamShield Rule Engine (Worker 2)', status: 'RUNNING', cpu: '16%', ram: '2.3 GB', uptime: '48d 12h' },
                  { name: 'AI Clustering & Campaign Service', status: 'RUNNING', cpu: '22%', ram: '4.8 GB', uptime: '12d 04h' },
                  { name: 'SS7 M3UA/SCCP Signaling Adapter', status: 'RUNNING', cpu: '8%', ram: '1.2 GB', uptime: '180d 00h' },
                  { name: 'Diameter S6a/Gx Inspection Node', status: 'RUNNING', cpu: '11%', ram: '1.6 GB', uptime: '180d 00h' },
                  { name: 'Analytics BigData Database Store', status: 'RUNNING', cpu: '19%', ram: '8.4 GB', uptime: '90d 18h' },
                ].map((proc, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-800">{proc.name}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Check className="h-3 w-3" />
                        {proc.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 mt-3 pt-3 border-t">
                      <div>
                        <span className="text-[10px] block text-slate-400">CPU</span>
                        <span className="font-mono font-bold text-slate-700">{proc.cpu}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block text-slate-400">RAM</span>
                        <span className="font-mono font-bold text-slate-700">{proc.ram}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block text-slate-400">Uptime</span>
                        <span className="font-mono text-slate-700">{proc.uptime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: ADD NEW RULE */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-600" />
                <span>Thêm Filtering Rule mới</span>
              </h3>
              <button onClick={() => setIsRuleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giai đoạn kiểm tra (Stage):</label>
                <select
                  value={newRuleStage}
                  onChange={(e) => setNewRuleStage(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="SENDER">SENDER (MSISDN & GT Address)</option>
                  <option value="CONTENT">CONTENT (Pattern & Keyword)</option>
                  <option value="SOCIAL_GRAPH">SOCIAL_GRAPH (Two-way dialogue threshold)</option>
                  <option value="REPUTATION">REPUTATION (Machine Learning Score)</option>
                  <option value="URL">URL (Domain & IP blacklist)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biểu thức điều kiện (Condition Syntax):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: SENDER_REPUTATION < 30 OR MATCH_PATTERN('LOAN')"
                  value={newRuleCondition}
                  onChange={(e) => setNewRuleCondition(e.target.value)}
                  className="w-full font-mono rounded-md border border-slate-300 p-2 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hành động áp dụng (Action):</label>
                <select
                  value={newRuleAction}
                  onChange={(e) => setNewRuleAction(e.target.value as any)}
                  className="w-full rounded-md border border-slate-300 p-2 focus:border-emerald-500 focus:outline-hidden font-semibold"
                >
                  <option value="BLOCK_COMPLETE">BLOCK_COMPLETE (Chặn âm thầm, gửi phản hồi giả lập thành công)</option>
                  <option value="SUSPECT">SUSPECT (Gắn cờ nghi ngờ và ghi log chi tiết)</option>
                  <option value="PROCEED">PROCEED (Chấp thuận chuyển tiếp tin nhắn)</option>
                  <option value="INLINE_WARNING">INLINE_WARNING (Chèn thông báo cảnh báo vào đầu tin nhắn)</option>
                  <option value="QUARANTINE">QUARANTINE (Đưa vào vùng cách ly chờ duyệt)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do thẩm định (Audit Reason):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phat hien spam tai chinh theo tieu chuan FS.34"
                  value={newRuleReason}
                  onChange={(e) => setNewRuleReason(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="rounded-md border px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Lưu & Áp Dụng Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD PATTERN */}
      {isPatternModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-600" />
                <span>Thêm Mẫu Nhận Diện (Pattern Dictionary)</span>
              </h3>
              <button onClick={() => setIsPatternModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePattern} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Từ khóa hoặc Biểu thức (Pattern Text / Regex):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: vay nong 0% hoac http://.*\.vip"
                  value={newPatternText}
                  onChange={(e) => setNewPatternText(e.target.value)}
                  className="w-full font-mono rounded-md border border-slate-300 p-2 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại đối khớp (Match Type):</label>
                  <select
                    value={newPatternType}
                    onChange={(e) => setNewPatternType(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="EXACT">Khớp chính xác (Exact Match)</option>
                    <option value="REGEX">Regular Expression (Regex)</option>
                    <option value="VISUAL_HOMOGLYPH">Ký tự đồng hình (Homoglyph Attack)</option>
                    <option value="LEVENSHTEIN">Khoảng cách tương đương (Near-Match)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhóm (Group Category):</label>
                  <select
                    value={newPatternGroup}
                    onChange={(e) => setNewPatternGroup(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="FINANCE_PHISH">FINANCE_PHISH</option>
                    <option value="GAMBLING_BET">GAMBLING_BET</option>
                    <option value="MALICIOUS_URL">MALICIOUS_URL</option>
                    <option value="BRAND_SPOOF">BRAND_SPOOF</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thời gian hiệu lực (Auto-expiry):</label>
                <select
                  value={newPatternExpiry}
                  onChange={(e) => setNewPatternExpiry(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="1_MONTH">1 Tháng (30 ngày)</option>
                  <option value="6_MONTHS">6 Tháng</option>
                  <option value="1_YEAR">1 Năm</option>
                  <option value="FOREVER">Vĩnh viễn (Forever)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsPatternModalOpen(false)}
                  className="rounded-md border px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Thêm Pattern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EXPORT REPORT */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Download className="h-4 w-4 text-emerald-600" />
                <span>Xuất Báo Cáo Thẩm Định (Export Audit Report)</span>
              </h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Định dạng xuất:</label>
                <div className="grid grid-cols-4 gap-2">
                  {['CSV', 'JSON', 'Excel', 'PDF'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      className="rounded-md border border-slate-300 py-2 font-semibold text-center hover:bg-slate-50 focus:border-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khoảng thời gian:</label>
                <select className="w-full rounded-md border border-slate-300 p-2">
                  <option>24 Giờ qua (Last 24 Hours)</option>
                  <option>7 Ngày qua (Last 7 Days)</option>
                  <option>Tháng hiện tại (Current Month)</option>
                </select>
              </div>

              <div className="rounded-md bg-slate-50 p-3 text-slate-600 text-[11px] border">
                Báo cáo sẽ bao gồm toàn bộ danh mục chiến dịch, các thuê bao gửi spam và nhật ký quyết định theo chuẩn GSMA FS.34.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="rounded-md border px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoadingAction('Đang khởi tạo tệp báo cáo an ninh viễn thông...');
                    setTimeout(() => {
                      setLoadingAction(null);
                      setIsExportModalOpen(false);
                      showToast('Báo cáo đã được xuất thành công!', 'success');
                    }, 1200);
                  }}
                  className="rounded-md bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Tải Xuống Báo Cáo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
