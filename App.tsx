import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import ChatInterface from './components/ChatInterface';
import { DesignConfig, Message, AspectRatio } from './types';
import { INITIAL_CONFIG } from './constants';
import { generateDesign, upscaleImage } from './services/geminiService';
import { GripVertical } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<DesignConfig>(INITIAL_CONFIG);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'Olá! Sou seu Designer Assistente. Vamos criar algo incrível hoje?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(440);
  const [chatWidth, setChatWidth] = useState(360);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.max(300, Math.min(e.clientX, 600)); // Min 300px, Max 600px
        setSidebarWidth(newWidth);
      }
      if (isResizingRight && containerRef.current) {
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        const newWidth = Math.max(300, Math.min(containerWidth - e.clientX, 600));
        setChatWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto'; // Re-enable text selection
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  const addMessage = (role: 'user' | 'model', text: string, image?: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      text,
      imageUrl: image,
      timestamp: new Date()
    }]);
  };

  const executeGeneration = async (currentConfig: DesignConfig, logUserMessage: boolean = true, previousImage?: string) => {
    setIsProcessing(true);
    setIsTyping(true);

    if (logUserMessage) {
       const promptSummary = previousImage 
        ? `Refinar imagem: ${currentConfig.subjectDescription}`
        : currentConfig.niche === 'auto' 
            ? `Criar imagem (IA Decide) - ${currentConfig.subjectDescription || 'automático'}`
            : `Criar imagem (${currentConfig.niche}) - ${currentConfig.subjectDescription || 'automático'}`;
            
       addMessage('user', promptSummary);
    }

    try {
      // Pass previousImage to service to trigger refinement/edit mode
      const imageUrl = await generateDesign(currentConfig, previousImage);
      
      setGeneratedImage(imageUrl);
      setHistory(prev => [imageUrl, ...prev]);
      
      setIsTyping(false);
      addMessage('model', 'Design gerado com sucesso.', imageUrl);
    } catch (error) {
      setIsTyping(false);
      addMessage('model', 'Desculpe, tive um problema ao gerar a imagem. Tente novamente.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = () => {
    // Standard generation (new image)
    executeGeneration(config);
  };

  const handleChatRequest = async (text: string) => {
    // If we have an image, we are refining it.
    // If not, we are starting fresh with chat input.
    
    // Update config with the refinement text
    const newConfig = { ...config, subjectDescription: text };
    setConfig(newConfig);

    if (generatedImage) {
        // REFINEMENT MODE
        executeGeneration(newConfig, true, generatedImage);
    } else {
        // NEW GENERATION MODE
        executeGeneration(newConfig, true);
    }
  };

  const handleUpscale = async () => {
    if (!generatedImage) return;
    setIsProcessing(true);
    addMessage('user', 'Melhorar resolução (Upscale)');
    setIsTyping(true);

    try {
        const upscaled = await upscaleImage(generatedImage);
        setGeneratedImage(upscaled);
        setHistory(prev => [upscaled, ...prev]);

        setIsTyping(false);
        addMessage('model', 'Imagem restaurada e melhorada com sucesso.', upscaled);
    } catch (e) {
        setIsTyping(false);
        addMessage('model', 'Falha no upscale.');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleRatioChange = (ratio: AspectRatio) => {
    if (config.aspectRatio === ratio) return;
    
    const newConfig = { ...config, aspectRatio: ratio };
    setConfig(newConfig);
    
    addMessage('user', `Alterar formato para ${ratio}`);
    
    // If we have an image, try to re-generate using it as base (refine) or start fresh
    executeGeneration(newConfig, false); 
  };

  return (
    <div ref={containerRef} className="flex h-screen w-screen bg-grid-pattern text-gray-900 font-sans selection:bg-brand-200 overflow-hidden">
      
      {/* 1. Control Panel (Left) */}
      <div style={{ width: sidebarWidth, minWidth: 300, maxWidth: 600 }} className="relative flex-shrink-0">
        <Sidebar 
            config={config} 
            setConfig={setConfig} 
            onGenerate={handleGenerate}
            isGenerating={isProcessing}
        />
        {/* Resize Handle Right */}
        <div 
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-brand-500/50 z-50 flex items-center justify-center group transition-colors"
            onMouseDown={() => {
                setIsResizingLeft(true);
                document.body.style.cursor = 'col-resize';
            }}
        >
            <div className="h-8 w-1 rounded-full bg-gray-300 group-hover:bg-brand-500 transition-colors" />
        </div>
      </div>

      {/* 2. Canvas (Center) */}
      <Canvas 
        imageUrl={generatedImage}
        history={history}
        onUpscale={handleUpscale}
        onRatioChange={handleRatioChange}
        onSelectHistory={setGeneratedImage}
        isProcessing={isProcessing}
        currentRatio={config.aspectRatio}
      />

      {/* 3. Chat/History (Right) */}
      <div style={{ width: chatWidth, minWidth: 300, maxWidth: 600 }} className="relative flex-shrink-0">
        {/* Resize Handle Left */}
        <div 
            className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-brand-500/50 z-50 flex items-center justify-center group transition-colors"
            onMouseDown={() => {
                setIsResizingRight(true);
                document.body.style.cursor = 'col-resize';
            }}
        >
             <div className="h-8 w-1 rounded-full bg-gray-300 group-hover:bg-brand-500 transition-colors" />
        </div>
        <ChatInterface 
            messages={messages}
            onSendMessage={handleChatRequest}
            isTyping={isTyping}
        />
      </div>
      
    </div>
  );
};

export default App;