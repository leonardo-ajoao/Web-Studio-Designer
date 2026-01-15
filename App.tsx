import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import ChatInterface from './components/ChatInterface';
import { DesignConfig, Message, AspectRatio, ProjectState } from './types';
import { INITIAL_CONFIG } from './constants';
import { generateDesign, upscaleImage } from './services/geminiService';

const App: React.FC = () => {
  const [config, setConfig] = useState<DesignConfig>(INITIAL_CONFIG);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // New: Store candidates when generating > 1 image
  const [candidates, setCandidates] = useState<string[]>([]);

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
  
  const [savedProjects, setSavedProjects] = useState<ProjectState[]>([]);

  // Upscale Comparison State
  const [isComparing, setIsComparing] = useState(false);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);

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

  const addMessage = (role: 'user' | 'model', text: string, image?: string, imageCandidates?: string[]) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      text,
      imageUrl: image,
      imageCandidates, // Pass candidates to chat history
      timestamp: new Date()
    }]);
  };

  const handleArchiveAndReset = () => {
      // Only archive if there is content (an image or at least some prompt)
      const hasContent = generatedImage || config.subjectDescription.length > 5 || messages.length > 2;

      // Force logic execution without window.confirm check if "nothing happens" (or user blindly clicks ok)
      // Re-implementing with confirmation for safety but ensuring Reset runs.
      if (window.confirm(hasContent ? "Deseja salvar o projeto atual no histórico e iniciar um novo?" : "Iniciar novo projeto?")) {
          
          if (hasContent) {
              const newProject: ProjectState = {
                  id: Date.now().toString(),
                  name: config.subjectDescription.substring(0, 30) || "Projeto Sem Título",
                  timestamp: new Date(),
                  config: { ...config }, // Deep copy
                  history: [...history],
                  lastImage: generatedImage,
                  messages: [...messages]
              };
              setSavedProjects(prev => [newProject, ...prev]);
          }

          // RESET STATE
          setConfig(INITIAL_CONFIG);
          setGeneratedImage(null);
          setCandidates([]);
          setHistory([]);
          setIsComparing(false);
          setBeforeImage(null);
          setAfterImage(null);
          
          setMessages([{
              id: Date.now().toString(),
              role: 'model',
              text: 'Projeto arquivado com sucesso. Espaço limpo para novas ideias!',
              timestamp: new Date()
          }]);
      }
  };

  const handleRestoreProject = (project: ProjectState) => {
      if (window.confirm(`Restaurar o projeto "${project.name}"? O trabalho atual não salvo será perdido.`)) {
          setConfig(project.config);
          setGeneratedImage(project.lastImage);
          setCandidates([]);
          setHistory(project.history);
          setMessages(project.messages);
          setIsComparing(false);
      }
  };

  const executeGeneration = async (
      currentConfig: DesignConfig, 
      logUserMessage: boolean = true, 
      previousImage?: string, 
      isVariation: boolean = false,
      isReformat: boolean = false 
  ) => {
    setIsProcessing(true);
    setIsTyping(true);

    if (logUserMessage) {
       let promptSummary = '';
       if (isReformat) {
           promptSummary = `Ajustar formato para ${currentConfig.aspectRatio} (Manter sujeito)`;
       } else if (isVariation) {
           promptSummary = `Criar ${currentConfig.imageCount || 1} variações criativas desta imagem`;
       } else if (previousImage) {
           promptSummary = `Refinar imagem: ${currentConfig.subjectDescription || 'ajustes aplicados'}`;
       } else {
           promptSummary = `Criar ${currentConfig.imageCount || 1}x imagens (${currentConfig.niche}) - ${currentConfig.subjectDescription || 'automático'}`;
       }
            
       addMessage('user', promptSummary);
    }

    try {
      // Service now returns an Array of strings
      const results = await generateDesign(currentConfig, previousImage, isVariation, isReformat);
      
      if (results.length === 1) {
          // Single Image Result
          const img = results[0];
          setGeneratedImage(img);
          setCandidates([]); // Clear candidates
          setHistory(prev => [img, ...prev]);
          addMessage('model', isVariation ? 'Variação gerada.' : isReformat ? 'Formato ajustado com sucesso.' : 'Design gerado com sucesso.', img);
      } else {
          // Multiple Images Result
          setCandidates(results);
          // Don't set generatedImage yet, wait for user selection
          setGeneratedImage(null); 
          addMessage('model', `Gerei ${results.length} versões. Escolha a sua preferida no painel central para continuarmos editando.`, undefined, results);
      }
      
      setIsTyping(false);
    } catch (error) {
      setIsTyping(false);
      addMessage('model', 'Desculpe, tive um problema ao gerar a imagem. Tente novamente.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = () => {
    executeGeneration(config);
  };

  const handleChatRequest = async (text: string) => {
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

  // Explicit handler for "Apply Changes" button in Chat Interface
  const handleApplyRefinement = () => {
      if (!generatedImage) {
          alert("Gere uma imagem primeiro para aplicar ajustes.");
          return;
      }
      // Force studio light active for this redesign if not already
      const activeConfig = { ...config, studioLightActive: true };
      setConfig(activeConfig);
      
      addMessage('user', 'Aplicar ajustes de iluminação/lentes na imagem atual.');
      executeGeneration(activeConfig, false, generatedImage);
  };

  const handleVariation = async () => {
      if (!generatedImage) return;
      executeGeneration(config, true, generatedImage, true, false);
  };

  // Called when user clicks an image in the Candidate Grid
  const handleSelectCandidate = (url: string) => {
      setGeneratedImage(url);
      setCandidates([]); // Exit selection mode
      setHistory(prev => [url, ...prev]);
      addMessage('user', 'Opção selecionada. Vamos trabalhar nesta versão.');
  };

  const handleUpscale = async () => {
    if (!generatedImage) return;
    
    // Store current as "Before"
    const originalImage = generatedImage;
    setBeforeImage(originalImage);

    setIsProcessing(true);
    addMessage('user', 'Melhorar resolução (Upscale)');
    setIsTyping(true);

    try {
        const upscaled = await upscaleImage(generatedImage);
        
        setGeneratedImage(upscaled);
        setHistory(prev => [upscaled, ...prev]);
        
        // Setup Comparison
        setAfterImage(upscaled);
        setIsComparing(true);

        setIsTyping(false);
        addMessage('model', 'Imagem restaurada e melhorada com sucesso. Modo comparativo ativado.', upscaled);
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
    
    // Trigger Reformat Logic
    if (generatedImage) {
        executeGeneration(newConfig, true, generatedImage, false, true); // isReformat = true
    } else {
        addMessage('user', `Formato definido: ${ratio}`);
    }
  };

  return (
    <div ref={containerRef} className="flex h-screen w-screen bg-slate-50 text-slate-900 font-sans selection:bg-brand-200 overflow-hidden">
      
      {/* 1. Control Panel (Left) */}
      <div style={{ width: sidebarWidth, minWidth: 300, maxWidth: 600 }} className="relative flex-shrink-0">
        <Sidebar 
            config={config} 
            setConfig={setConfig} 
            onGenerate={handleGenerate}
            isGenerating={isProcessing}
            onReset={handleArchiveAndReset}
            savedProjects={savedProjects}
            onRestore={handleRestoreProject}
        />
        {/* Resize Handle Right */}
        <div 
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-brand-500/50 z-50 flex items-center justify-center group transition-colors"
            onMouseDown={() => {
                setIsResizingLeft(true);
                document.body.style.cursor = 'col-resize';
            }}
        >
            <div className="h-8 w-1 rounded-full bg-slate-300 group-hover:bg-brand-500 transition-colors" />
        </div>
      </div>

      {/* 2. Canvas (Center) */}
      <Canvas 
        imageUrl={generatedImage}
        candidates={candidates} 
        onSelectCandidate={handleSelectCandidate} 
        history={history}
        onUpscale={handleUpscale}
        onVariation={handleVariation} 
        onRatioChange={handleRatioChange}
        onSelectHistory={(url) => { setGeneratedImage(url); setCandidates([]); setIsComparing(false); }}
        isProcessing={isProcessing}
        currentRatio={config.aspectRatio}
        
        // Comparison Props
        isComparing={isComparing}
        beforeImage={beforeImage}
        afterImage={afterImage}
        onCloseComparison={() => setIsComparing(false)}
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
             <div className="h-8 w-1 rounded-full bg-slate-300 group-hover:bg-brand-500 transition-colors" />
        </div>
        <ChatInterface 
            messages={messages}
            onSendMessage={handleChatRequest}
            isTyping={isTyping}
            config={config}        
            setConfig={setConfig}
            onApplyChanges={handleApplyRefinement}  
        />
      </div>
      
    </div>
  );
};

export default App;