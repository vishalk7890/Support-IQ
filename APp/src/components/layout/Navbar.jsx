import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">GenAI Support Coach</div>
          <ul className="flex space-x-8">
            <li><Link to="/" className="hover:text-blue-500 font-medium">Dashboard</Link></li>
            <li><Link to="/my-feedback" className="hover:text-blue-500 font-medium">My Feedback</Link></li>
            <li><Link to="/team-overview" className="hover:text-blue-500 font-medium">Team Overview</Link></li>
            <li><a href="#" className="hover:text-blue-500 font-medium">Integrations</a></li>
            <li><a href="#" className="hover:text-blue-500 font-medium">Compliance</a></li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
