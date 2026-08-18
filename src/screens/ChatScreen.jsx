import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Image as ImageIcon, CheckCircle2, MapPin } from 'lucide-react';

export function ChatScreen({ job, artisan }) {
  const { currentUser, navigateTo, showToast } = useApp();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const matchId = job ? `${job.job_id}_${artisan?.uid}` : 'demo_match_id';

  useEffect(() => {
    const messagesRef = collection(db, `matches/${matchId}/messages`);
    const q = query(messagesRef, orderBy('created_at', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedMessages = [];
        snapshot.forEach((doc) => {
          fetchedMessages.push({ id: doc.id, ...doc.data() });
        });
        setMessages(fetchedMessages);
        setLoading(false);
        scrollToBottom();
      },
      (error) => {
        console.error("Firestore Listen Error:", error);
        setMessages([
          {
            id: 'm1',
            sender_uid: artisan?.uid || 'artisan',
            text: `Hello ${currentUser?.firstName || 'there'}! I received your job request for the ${job?.description || 'repair'}. I am on my way.`,
            created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          }
        ]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [matchId, artisan?.uid, currentUser?.firstName, job?.description]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, `matches/${matchId}/messages`), {
        match_id: matchId,
        sender_uid: currentUser?.uid || 'user_demo_client',
        text: messageText,
        photo_url: null,
        created_at: serverTimestamp(),
        read_at: null
      });
      scrollToBottom();
    } catch (err) {
      console.error("Send message error:", err);
      showToast('Message sending failed. Check connection.', 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender_uid: currentUser?.uid || 'user_demo_client',
          text: messageText,
          created_at: new Date().toISOString(),
        }
      ]);
      scrollToBottom();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8] flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <Header title={artisan ? `${artisan.first_name} ${artisan.last_name}` : 'Chat'} backTo="client_dash" />
        {artisan && (
          <div className="flex items-center justify-between px-4 pb-3 bg-white">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#16858F] bg-[#E8F5F6] px-2 py-0.5 rounded-md uppercase tracking-wider">
                {artisan.trade}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span className="font-bold uppercase tracking-wider">Verified Identity</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigateTo('live_tracking')}
              className="flex items-center gap-1 bg-[#16858F] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-[#0E5C63] transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              Track
            </button>
          </div>
        )}
      </div>

      <main className="flex-1 px-4 py-4 overflow-y-auto space-y-4">
        <div className="text-center pb-4">
          <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            ₦{job?.match_fee?.toLocaleString() || '1,500'} Match Fee Held in Escrow
          </span>
        </div>

        {loading ? (
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
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.created_at?.toDate ? msg.created_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="bg-white border-t border-slate-200 p-3 pb-safe">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-md mx-auto">
          <button
            type="button"
            className="p-3 text-slate-400 hover:text-[#16858F] transition-colors rounded-xl bg-slate-50"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
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
