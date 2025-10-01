import React from 'react';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Brain, 
  TrendingUp, 
  Settings,
  Shield,
  Bot,
  Phone,
  Activity,
  Headphones,
  ArrowRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Workflow sections with visual hierarchy and color coding
const workflowSections = [
  {
    title: 'DATA PIPELINE',
    color: 'text-blue-400',
    items: [
      { id: 'list', label: 'Call Recordings', icon: Phone, color: 'text-blue-400', bgColor: 'bg-blue-600' },
      { id: 'conversations', label: 'Live Monitor', icon: Activity, color: 'text-green-400', bgColor: 'bg-green-600' },
      { id: 'transcripts', label: 'Analysis & Coaching', icon: Headphones, color: 'text-purple-400', bgColor: 'bg-purple-600' },
    ]
  },
  {
    title: 'INSIGHTS & MANAGEMENT',
    color: 'text-gray-400',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-gray-300' },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'text-gray-300' },
      { id: 'agents', label: 'Agents', icon: Users, color: 'text-gray-300' },
      { id: 'coaching', label: 'AI Coaching', icon: Brain, color: 'text-gray-300' },
    ]
  },
  {
    title: 'ADMINISTRATION',
    color: 'text-gray-500',
    items: [
      { id: 'users', label: 'Users', icon: Users, color: 'text-gray-400' },
      { id: 'compliance', label: 'Responsible AI', icon: Shield, color: 'text-gray-400' },
    ]
  }
];

// Legacy flat menu for backward compatibility
const menuItems = workflowSections.flatMap(section => section.items);

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-slate-900 text-white w-64 min-h-screen p-4">
      <div className="flex items-center gap-3 mb-8 p-2">
        <Bot className="text-blue-400" size={32} />
        <div>
          <h1 className="text-xl font-bold">Support-IQ</h1>
          <p className="text-slate-400 text-sm">AI Analytics Hub</p>
        </div>
      </div>
      
      <nav className="space-y-6">
        {workflowSections.map((section, sectionIndex) => (
          <div key={section.title}>
            <h3 className={`text-xs font-bold tracking-wider mb-3 ${section.color} uppercase`}>
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isWorkflowStep = sectionIndex === 0; // Data pipeline section
                
                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${
                        isActive 
                          ? `${item.bgColor || 'bg-blue-600'} text-white shadow-lg` 
                          : `text-slate-300 hover:bg-slate-800 hover:text-white hover:${item.color}`
                      }`}
                    >
                      <Icon 
                        size={20} 
                        className={isActive ? 'text-white' : item.color || 'text-slate-300'}
                      />
                      <span className="font-medium">{item.label}</span>
                      
                      {/* Workflow arrow for data pipeline */}
                      {isWorkflowStep && itemIndex < section.items.length - 1 && (
                        <ArrowRight 
                          size={12} 
                          className="ml-auto text-slate-500 group-hover:text-slate-400"
                        />
                      )}
                    </button>
                    
                    {/* Workflow progress indicator */}
                    {isWorkflowStep && itemIndex < section.items.length - 1 && (
                      <div className="absolute -bottom-0.5 left-6 w-8 h-0.5 bg-slate-700 rounded"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      <div className="mt-8 pt-4 border-t border-slate-700">
        <button className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
