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
  FileText,
  Mic
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare },
  { id: 'transcripts', label: 'Transcripts', icon: FileText },
  { id: 'coaching', label: 'AI Coaching', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'compliance', label: 'Responsible AI', icon: Shield },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-slate-900 text-white w-64 min-h-screen p-4">
      <div className="flex items-center gap-3 mb-8 p-2">
        <Bot className="text-blue-400" size={32} />
        <div>
          <h1 className="text-xl font-bold">Support Coach</h1>
          <p className="text-slate-400 text-sm">AI Analytics Hub</p>
        </div>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
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
