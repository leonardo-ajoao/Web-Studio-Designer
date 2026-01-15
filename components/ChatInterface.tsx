import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Paperclip, MoreHorizontal, Sparkles, PenTool, Sliders, Zap, Camera, X } from 'lucide-react';
import { Message, DesignConfig } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  config: DesignConfig;
  setConfig: React.Dispatch<React.SetStateAction<DesignConfig>>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isTyping, config, setConfig }) => {
  const [input, setInput] = useState('');
  const [showTools, setShowTools] = useState(false);
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
    <div className="w-full flex flex-col h-full z-20 border-l border-slate-200 bg-white relative">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100">
               <Bot size={20} />
            </div>
            <div>
               <h3 className="font-bold text-slate-900 text-sm leading-tight">Designer Assistente</h3>
               <div className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                 <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Online</p>
               </div>
            </div>
         </div>
      </div>

      {/* TOOLS DRAWER (Expandable) */}
      <div className={`overflow-hidden transition-all duration-300 bg-slate-50 border-b border-slate-200 ${showTools ? 'max-h-96 opacity-100 shadow-inner' : 'max-h-0 opacity-0'}`}>
         <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-2 py-0.5 rounded">Ajustes Rápidos</span>
                <button onClick={() => setShowTools(false)} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                {/* Lighting Quick Toggle */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs mb-2">
                        <Zap size={14} className="text-brand-500" /> Luz (Rim)
                    </div>
                    <button 
                        onClick={() => setConfig(prev => ({...prev, rimLight: !prev.rimLight}))}
                        className={`w-full py-1.5 rounded-md text-[10px] font-bold transition-all border ${config.rimLight ? 'bg-brand-600 border-brand-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                    >
                        {config.rimLight ? 'ON' : 'OFF'}
                    </button>
                </div>

                {/* Zoom Quick Control */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs mb-2">
                        <Camera size={14} className="text-brand-500" /> Zoom
                    </div>
                    <input 
                        type="range" min="1" max="10" step="0.5" 
                        value={config.cameraZoom}
                        onChange={(e) => setConfig(prev => ({...prev, cameraZoom: parseFloat(e.target.value)}))}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 bg-slate-50/50">
         {messages.length === 0 && (
            <div className="text-center mt-20 opacity-50">
               <PenTool size={40} className="text-slate-300 mx-auto mb-4" />
               <p className="text-sm text-slate-500 font-medium">Como posso ajudar no seu design?</p>
            </div>
         )}

         {messages.map((msg) => (
           <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[90%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                 
                 {/* Square Avatars */}
                 <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border shadow-sm ${msg.role === 'user' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-brand-600'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                 </div>

                 {/* Rectangular Bubbles */}
                 <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3.5 text-sm leading-relaxed shadow-sm border ${
                        msg.role === 'user' 
                        ? 'bg-slate-900 text-white rounded-lg rounded-tr-none border-slate-900' 
                        : 'bg-white text-slate-700 rounded-lg rounded-tl-none border-slate-200'
                    }`}>
                       {msg.text}
                       {msg.imageUrl && (
                         <div className="mt-3 rounded-md overflow-hidden border border-slate-200 shadow-sm bg-slate-50 p-1">
                            <img src={msg.imageUrl} alt="Result" className="w-full h-auto rounded-sm" />
                         </div>
                       )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 font-medium">
                       {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                 </div>
              </div>
           </div>
         ))}

         {isTyping && (
           <div className="flex justify-start pl-11">
                <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg rounded-tl-none shadow-sm flex gap-1 items-center">
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-sm animate-pulse" />
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-sm animate-pulse delay-75" />
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-sm animate-pulse delay-150" />
                </div>
           </div>
         )}
         <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
         <div className="flex justify-end mb-2">
            <button 
                onClick={() => setShowTools(!showTools)}
                className={`text-[10px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all uppercase tracking-wider ${showTools ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                <Sliders size={12} />
                Ajustes
            </button>
         </div>

         <form onSubmit={handleSubmit} className="relative">
            <input 
              type="text" 
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder-slate-400"
              placeholder="Digite sua solicitação..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
               type="submit" 
               disabled={!input.trim() || isTyping}
               className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-md transition-all shadow-md active:shadow-none"
            >
               <Send size={16} />
            </button>
         </form>
      </div>

    </div>
  );
};

export default ChatInterface;