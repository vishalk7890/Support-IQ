import React from 'react';
import { Shield, Eye, Lock, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const ResponsibleAI: React.FC = () => {
  const complianceMetrics = [
    {
      title: 'PII Protection',
      status: 'active',
      description: 'Customer personally identifiable information is automatically anonymized',
      icon: Lock,
      value: '100%'
    },
    {
      title: 'Bias Detection',
      status: 'monitoring',
      description: 'AI models are continuously monitored for bias in scoring and recommendations',
      icon: Eye,
      value: '98.7%'
    },
    {
      title: 'Data Anonymization',
      status: 'active',
      description: 'Voice and text data is processed through anonymization pipeline',
      icon: Shield,
      value: '100%'
    },
    {
      title: 'Audit Trail',
      status: 'active',
      description: 'All AI decisions and recommendations are logged for compliance',
      icon: CheckCircle,
      value: '100%'
    }
  ];

  const safeguards = [
    'Customer PII is never included in AI prompt context',
    'Bias detection algorithms monitor scoring fairness across demographics',
    'Voice and text anonymization ensures privacy compliance',
    'Regular audits ensure AI recommendations meet ethical standards',
    'Human oversight required for high-impact coaching decisions',
    'Transparent AI decision-making with explainable recommendations'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'monitoring': return 'text-yellow-600 bg-yellow-100';
      case 'warning': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-blue-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Responsible AI Compliance</h3>
            <p className="text-sm text-gray-500">Privacy protection and bias monitoring safeguards</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {complianceMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-blue-600" />
                    <h4 className="font-medium text-gray-900">{metric.title}</h4>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(metric.status)}`}>
                    {metric.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{metric.description}</p>
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Info className="text-blue-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Active Safeguards</h3>
            <p className="text-sm text-gray-500">Built-in protections for ethical AI deployment</p>
          </div>
        </div>

        <div className="space-y-3">
          {safeguards.map((safeguard, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{safeguard}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="text-yellow-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Compliance Alerts</h3>
            <p className="text-sm text-gray-500">Real-time monitoring for compliance issues</p>
          </div>
        </div>

        <div className="text-center py-8">
          <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
          <h4 className="text-green-600 font-medium mb-2">All Systems Compliant</h4>
          <p className="text-gray-500 text-sm">No compliance issues detected in the last 24 hours</p>
        </div>
      </div>
    </div>
  );
};

export default ResponsibleAI;
