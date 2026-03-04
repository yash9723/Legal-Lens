import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Check, X, Shield, Zap, Globe, Building, CheckCircle2, HelpCircle, ArrowRight, Briefcase, Users, Crown } from 'lucide-react';
import { logger } from '../services/loggerService';

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: "0",
    description: "For individuals needing a quick status check.",
    icon: <Zap className="w-5 h-5 text-slate-500" />,
    features: [
      "1 Contract / month",
      "Basic Summary",
      "Standard Risk Tags",
      "Privacy Shield"
    ],
    cta: "Start Analysis"
  },
  {
    name: "Starter",
    price: "299",
    description: "For freelancers with occasional paperwork.",
    icon: <Briefcase className="w-5 h-5 text-blue-500" />,
    features: [
      "10 Contracts / month",
      "Up to 20 pages/doc",
      "PDF Reports",
      "Email Support"
    ],
    cta: "Get Starter"
  },
  {
    name: "Professional",
    price: "1,499",
    description: "For power users & small businesses.",
    highlight: true,
    icon: <Shield className="w-5 h-5 text-white" />,
    features: [
      "Unlimited Contracts",
      "Deep Risk Scan (Hidden Clauses)",
      "India Legal Stack (Stamp Duty)",
      "Missing Clause Detection",
      "Priority Processing"
    ],
    cta: "Go Professional"
  },
  {
    name: "Team",
    price: "4,999",
    description: "For small legal teams and agencies.",
    icon: <Users className="w-5 h-5 text-indigo-500" />,
    features: [
      "5 User Seats",
      "Shared Workspace",
      "Admin Dashboard",
      "Everything in Pro",
      "Priority Email Support"
    ],
    cta: "Get Team"
  }
];

interface PricingViewProps {
  user: UserProfile | null;
  onUpgrade: (plan: string) => Promise<void>;
}

const PricingView: React.FC<PricingViewProps> = ({ user, onUpgrade }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleUpgrade = async (tier: PricingTier) => {
    if (!user) {
      alert("Please log in to upgrade.");
      return;
    }
    try {
      await onUpgrade(tier.name);
      alert(`Upgraded to ${tier.name}!`);
    } catch (e) {
      console.error(e);
      alert("Upgrade failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-transparent py-20 px-4 sm:px-6 transition-colors duration-500 font-sans page-enter">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Plans for every stage of your journey.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Transparent pricing. No hidden fees. Cancel anytime.
          </p>

          {/* Toggle - Pill Style */}
          <div className="inline-flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mt-8 border border-slate-200 dark:border-slate-700/50">
            {(['monthly', 'yearly'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${billingCycle === cycle
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-200/50 dark:ring-slate-600/50'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
              >
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                {cycle === 'yearly' && <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-wide">-20%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-24 stagger-children">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 hover-lift ${tier.highlight
                ? 'bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 border-slate-700 text-white shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/50 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 backdrop-blur-sm'
                }`}
            >
              {/* Popular Badge */}
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-wide shadow-lg shadow-blue-500/30">
                    <Crown className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${tier.highlight ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-800/50'
                  }`}>
                  {tier.icon}
                </div>
                <h3 className={`text-lg font-bold mb-2 ${tier.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{tier.name}</h3>
                <p className={`text-sm leading-relaxed min-h-[40px] ${tier.highlight ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {tier.description}
                </p>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className={`text-4xl font-extrabold ${tier.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  ₹{tier.price}
                </span>
                <span className={`text-sm ${tier.highlight ? 'text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>/mo</span>
              </div>

              <div className="space-y-3 flex-1 mb-8">
                {tier.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-blue-400' : 'text-blue-600 dark:text-blue-500'}`} />
                    <span className={`text-sm ${tier.highlight ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>{feat}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(tier)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:outline-none hover:scale-[1.02] active:scale-[0.98] ${tier.highlight
                  ? 'bg-white text-slate-900 hover:bg-slate-50 focus:ring-white shadow-lg'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 focus:ring-slate-900 hover:shadow-lg'
                  }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-10 text-center">Compare Features</h3>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/50 rounded-2xl bg-white dark:bg-slate-900/30 shadow-sm backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800/50">
                  <th className="py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white w-1/4">Feature</th>
                  <th className="py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white text-center w-1/6">Free</th>
                  <th className="py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white text-center w-1/6">Starter</th>
                  <th className="py-4 px-6 text-sm font-semibold text-blue-600 dark:text-blue-400 text-center w-1/6">Professional</th>
                  <th className="py-4 px-6 text-sm font-semibold text-indigo-600 dark:text-indigo-400 text-center w-1/6">Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                <ComparisonRow feature="Monthly Analysis" free="1" starter="10" professional="Unlimited" team="Unlimited" />
                <ComparisonRow feature="Pages per Doc" free="5" starter="20" professional="100" team="Unlimited" />
                <ComparisonRow feature="Deep Risk Scan" free={false} starter="Standard" professional="Advanced" team="Advanced" />
                <ComparisonRow feature="India Legal Stack" free={false} starter={false} professional={true} team={true} />
                <ComparisonRow feature="Stamp Duty Check" free={false} starter={false} professional={true} team={true} />
                <ComparisonRow feature="Export to PDF" free={false} starter={true} professional={true} team={true} />
                <ComparisonRow feature="User Seats" free="1" starter="1" professional="1" team="5" />
                <ComparisonRow feature="Admin Controls" free={false} starter={false} professional={false} team={true} />
              </tbody>
            </table>
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Need an enterprise custom solution?</p>
            <button className="text-slate-900 dark:text-white font-semibold underline underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact Sales Team</button>
          </div>
        </div>

      </div>
    </div>
  );
};

const ComparisonRow = ({ feature, free, starter, professional, team }: { feature: string, free: string | boolean, starter: string | boolean, professional: string | boolean, team: string | boolean }) => {
  const renderValue = (val: string | boolean) => {
    if (typeof val === 'boolean') {
      return val ? <Check className="w-5 h-5 mx-auto text-slate-900 dark:text-white" /> : <span className="block w-4 h-0.5 bg-slate-200 dark:bg-slate-700 mx-auto rounded-full"></span>;
    }
    return <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">{val}</span>;
  };

  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200">
      <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-200 text-sm">{feature}</td>
      <td className="py-4 px-6 text-center border-l border-slate-100 dark:border-slate-800/50">{renderValue(free)}</td>
      <td className="py-4 px-6 text-center border-l border-slate-100 dark:border-slate-800/50">{renderValue(starter)}</td>
      <td className="py-4 px-6 text-center border-l border-slate-100 dark:border-slate-800/50 bg-blue-50/10 dark:bg-blue-900/5">{renderValue(professional)}</td>
      <td className="py-4 px-6 text-center border-l border-slate-100 dark:border-slate-800/50">{renderValue(team)}</td>
    </tr>
  );
};

export default PricingView;
