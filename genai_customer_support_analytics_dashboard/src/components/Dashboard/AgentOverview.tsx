// import React from 'react';
// import { Agent } from '../../types';
// import { Clock, MessageSquare, TrendingUp, AlertTriangle, Star } from 'lucide-react';

// interface AgentOverviewProps {
//   agents: Agent[];
// }

// const AgentOverview: React.FC<AgentOverviewProps> = ({ agents }) => {
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active': return 'bg-green-500';
//       case 'break': return 'bg-yellow-500';
//       case 'offline': return 'bg-gray-500';
//       default: return 'bg-gray-500';
//     }
//   };

//   const getSentimentColor = (sentiment: number) => {
//     if (sentiment > 0.3) return 'text-green-600';
//     if (sentiment > -0.3) return 'text-yellow-600';
//     return 'text-red-600';
//   };

//   const renderStars = (rating: number) => {
//     return Array.from({ length: 5 }, (_, i) => (
//       <Star
//         key={i}
//         size={10}
//         className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
//       />
//     ));
//   };

//   const topPerformers = agents
//     .filter(agent => agent.status === 'active')
//     .sort((a, b) => b.performanceScore - a.performanceScore)
//     .slice(0, 6);

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//       <div className="flex items-center justify-between mb-6">
//         <h3 className="text-lg font-semibold text-gray-900">Top Performing Agents</h3>
//         <span className="text-sm text-gray-500">{agents.filter(a => a.status === 'active').length} active</span>
//       </div>
      
//       <div className="space-y-4">
//         {topPerformers.map((agent) => (
//           <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
//             <div className="flex items-center gap-3">
//               <div className="relative">
//                 <img 
//                   src={agent.avatar} 
//                   alt={agent.name}
//                   className="w-10 h-10 rounded-full"
//                 />
//                 <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(agent.status)} rounded-full border-2 border-white`}></div>
//               </div>
//               <div>
//                 <h4 className="font-medium text-gray-900">{agent.name}</h4>
//                 <div className="flex items-center gap-2">
//                   <span className="text-sm text-gray-500">Score: {agent.performanceScore}/5.0</span>
//                   <div className="flex items-center gap-1">
//                     {renderStars(agent.avgCustomerRating)}
//                     <span className="text-xs text-gray-500 ml-1">({agent.totalRatings})</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
            
//             <div className="flex items-center gap-4 text-sm">
//               <div className="flex items-center gap-1">
//                 <MessageSquare size={16} className="text-blue-500" />
//                 <span>{agent.activeConversations}</span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <Clock size={16} className="text-orange-500" />
//                 <span>{agent.avgResponseTime}s</span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <TrendingUp size={16} className={getSentimentColor(agent.sentiment)} />
//                 <span className={getSentimentColor(agent.sentiment)}>{agent.sentiment.toFixed(2)}</span>
//               </div>
//               {agent.escalationRate > 0.1 && (
//                 <AlertTriangle size={16} className="text-red-500" />
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default AgentOverview;



import React, { useEffect, useState } from 'react';
import { Agent } from '../../types';
import { Clock, MessageSquare, TrendingUp, AlertTriangle, Star } from 'lucide-react';

const AgentOverview: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeAgents: 0,
    // ...other metrics
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/agents`)
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          activeAgents: data.filter(agent => agent.status === 'active').length,
        }));
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'break': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600';
    if (sentiment > -0.3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={10}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const topPerformers = agents
    .filter(agent => agent.status === 'active')
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 6);

  if (loading) return <div>Loading agents...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Performing Agents</h3>
        <span className="text-sm text-gray-500">{metrics.activeAgents} active</span>
      </div>
      
      <div className="space-y-4">
        {topPerformers.map((agent) => (
          <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={agent.avatar} 
                  alt={agent.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(agent.status)} rounded-full border-2 border-white`}></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{agent.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Score: {agent.performanceScore}/5.0</span>
                  <div className="flex items-center gap-1">
                    {renderStars(agent.avgCustomerRating)}
                    <span className="text-xs text-gray-500 ml-1">({agent.totalRatings})</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MessageSquare size={16} className="text-blue-500" />
                <span>{agent.activeConversations}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} className="text-orange-500" />
                <span>{agent.avgResponseTime}s</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp size={16} className={getSentimentColor(agent.sentiment)} />
                <span className={getSentimentColor(agent.sentiment)}>{agent.sentiment.toFixed(2)}</span>
              </div>
              {agent.escalationRate > 0.1 && (
                <AlertTriangle size={16} className="text-red-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentOverview;