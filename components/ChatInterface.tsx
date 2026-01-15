import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Paperclip, MoreHorizontal, Sparkles, PenTool } from 'lucide-react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isTyping }) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="w-full flex flex-col h-full z-20 border-l border-gray-100/50 bg-white/50 backdrop-blur-sm">
      
      {/* Header */}
      <div className="p-5 flex items-center justify-between border-b border-gray-100/50">
         <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/20 group-hover:scale-105 group-hover:shadow-black/30 transition-all duration-300">
               <PenTool size={20} />
            </div>
            <div>
               <h3 className="font-bold text-gray-900 leading-tight group-hover:text-black transition-colors">Designer Assistente</h3>
               <div className="flex items-center gap-1.5">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                 <p className="text-xs text-gray-500 font-medium">Pronto para criar</p>
               </div>
            </div>
         </div>
         <button className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:shadow-sm active:scale-95">
            <MoreHorizontal size={20} />
         </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
         {messages.length === 0 && (
            <div className="text-center mt-10 opacity-60">
               <PenTool size={32} className="text-gray-300 mx-auto mb-2" />
               <p className="text-sm text-gray-500">Descreva sua ideia ou arraste uma imagem</p>
            </div>
         )}

         {messages.map((msg) => (
           <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2.5`}>
                 
                 {/* Avatar */}
                 {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center text-black shadow-sm mt-1">
                       <Sparkles size={14} />
                    </div>
                 )}

                 {/* Bubble */}
                 <div className={`space-y-1`}>
                    <div className={`p-4 text-sm leading-relaxed shadow-sm transition-all duration-300 hover:shadow-md ${
                        msg.role === 'user' 
                        ? 'bg-black text-white rounded-2xl rounded-tr-sm hover:brightness-110' 
                        : 'bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-tl-sm hover:border-gray-200'
                    }`}>
                       {msg.text}
                       {msg.imageUrl && (
                         <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 group hover:shadow-md transition-shadow">
                            <img src={msg.imageUrl} alt="Result" className="w-full h-auto transition-transform duration-500 group-hover:scale-105" />
                         </div>
                       )}
                    </div>
                    <span className="text-[10px] text-gray-400 block px-2 opacity-70">
                       {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                 </div>
              </div>
           </div>
         ))}

         {isTyping && (
           <div className="flex justify-start pl-11">
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                </div>
           </div>
         )}
         <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="p-5 pt-2">
         <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-0 bg-white rounded-2xl shadow-soft -z-10 transition-shadow duration-300 group-hover:shadow-lg"></div>
            <input 
              type="text" 
              className="w-full pl-4 pr-12 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 transition-all duration-300 placeholder-gray-400 group-hover:border-gray-300"
              placeholder="Refinar design ou pedir alteração..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
               type="submit" 
               disabled={!input.trim() || isTyping}
               className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-black/20"
            >
               <Send size={16} />
            </button>
         </form>
      </div>

    </div>
  );
};

export default ChatInterface;