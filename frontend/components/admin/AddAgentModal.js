import { X } from 'lucide-react';
import { useState } from 'react';

export default function AddAgentModal({ isOpen, onClose, onSubmit }) {
    const [newAgent, setNewAgent] = useState({ fullName: '', phone: '', password: '', commissionRate: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(newAgent);
        setNewAgent({ fullName: '', phone: '', password: '', commissionRate: '' }); // Reset form
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Add New Agent</h2>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Full Name" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-pink-500" value={newAgent.fullName} onChange={e => setNewAgent({ ...newAgent, fullName: e.target.value })} required />
                    <input type="text" placeholder="Phone Number" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-pink-500" value={newAgent.phone} onChange={e => setNewAgent({ ...newAgent, phone: e.target.value })} required />
                    <input type="password" placeholder="Password" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-pink-500" value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} required />
                    <input type="number" placeholder="Commission Rate (%)" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-pink-500" value={newAgent.commissionRate} onChange={e => setNewAgent({ ...newAgent, commissionRate: e.target.value })} required />

                    <button type="submit" className="w-full bg-pink-600 text-white font-bold py-4 rounded-xl hover:bg-pink-700 transition mt-4">Create Agent</button>
                </form>
            </div>
        </div>
    );
}
