import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';
import { Send, Image as ImageIcon, CheckCircle2, MapPin, CheckSquare } from 'lucide-react';

export function ChatScreen({ job, artisan }) {
  const { currentUser, navigateTo, showToast } = useApp();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const matchId = job ? `${job.job_id}_${artisan?.uid}` : 'demo_match_id';
  const isClient = currentUser?.role !== 'artisan';

  useEffect(() => {
    let pollInterval;
    
    const fetchMessages = async () => {
      try {
        const fetchedMessages = await ApiService.getChatMessages(matchId);
        setMessages(fetchedMessages || []);
        setLoading(false);
      } catch (error) {
        console.warn("API Chat Fetch Error (using fallback):", error);
        if (messages.length === 0) {
          setMessages([
            {
              id: 'm1',
              sender_uid: artisan?.uid || 'artisan',
              text: `Hello ${currentUser?.first_name || 'there'}! I received your job request. How can I help?`,
              created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            }
          ]);
        }
        setLoading(false);
      }
    };

    fetchMessages();
    
    // Poll every 5 seconds since we are moving away from direct Firebase snapshot
    pollInterval = setInterval(fetchMessages, 5000);

    return () => clearInterval(pollInterval);
  }, [matchId, artisan?.uid, currentUser?.first_name]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    
    // Optimistic UI update
    const tempId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender_uid: currentUser?.uid || 'user_demo_client',
        text: messageText,
        created_at: new Date().toISOString(),
      }
    ]);

    try {
      await ApiService.sendChatMessage(matchId, messageText);
    } catch (err) {
      console.error("Send message error:", err);
      showToast('Message sending failed. Check connection.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8] flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <Header title={artisan ? `${artisan.first_name} ${artisan.last_name}` : 'Chat'} backTo={isClient ? "client_dash" : "artisan_dash"} />
        
        {artisan && (
          <div className="flex items-center justify-between px-4 pb-3 bg-white border-t border-slate-50 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#16858F] bg-[#E8F5F6] px-2 py-0.5 rounded-md uppercase tracking-wider">
                {artisan.trade}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span className="font-bold uppercase tracking-wider">Verified</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => navigateTo('live_tracking')}
                className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-200 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                Track
              </button>
              {isClient && (
                <button 
                  onClick={() => navigateTo('complete_rating', { job })}
                  className="flex items-center gap-1 bg-[#16858F] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-[#0E5C63] transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <main className="flex-1 px-4 py-4 overflow-y-auto space-y-4">
        <div className="text-center pb-4">
          <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            ₦{job?.match_fee || 500} Match Fee Held in Escrow
          </span>
        </div>

        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-[#16858F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_uid === (currentUser?.uid || 'user_demo_client');
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    isMe
                      ? 'bg-[#16858F] text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-[#0E3B40] rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content || msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                </span>
              </div>
            );
          })
        )}
        {messages.length === 0 && !loading && (
          <div className="text-center text-slate-400 text-sm mt-10">
            No messages yet. Send a message to start!
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="bg-white border-t border-slate-200 p-3 pb-safe">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-md mx-auto">
          {/* PRD says "Chat must be text-only for MVP", disabling image upload. */}
          {/* <button type="button" className="p-3 text-slate-400 ..."><ImageIcon /></button> */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-[#0E3B40] focus:border-[#16858F] focus:ring-1 focus:ring-[#16858F] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3.5 bg-[#16858F] text-white rounded-2xl disabled:opacity-50 disabled:bg-slate-300 transition-colors btn-press touch-target"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
