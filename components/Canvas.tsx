import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, Maximize2, Sparkles, 
  Smartphone, Monitor, Instagram, RefreshCcw, Image, 
  History, ZoomIn, ZoomOut, Shuffle, CheckCircle, ArrowLeftRight, X
} from 'lucide-react';
import { AspectRatio } from '../types';

interface CanvasProps {
  imageUrl: string | null;
  candidates?: string[]; 
  onSelectCandidate: (url: string) => void;
  history: string[];
  onUpscale: () => void;
  onVariation: () => void;
  onRatioChange: (ratio: AspectRatio) => void;
  onSelectHistory: (url: string) => void;
  isProcessing: boolean;
  currentRatio: AspectRatio;
  
  // New props for comparison
  isComparing: boolean;
  beforeImage: string | null;
  afterImage: string | null;
  onCloseComparison: () => void;
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <div className="group relative flex items-center justify-center">
    {children}
    <div className="absolute -top-10 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 pointer-events-none whitespace-nowrap shadow-lg z-50">
      {text}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
    </div>
  </div>
);

// Comparison Slider Component
const ComparisonSlider = ({ before, after, onClose }: { before: string, after: string, onClose: () => void }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setSliderPos((x / rect.width) * 100);
    };

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: React.MouseEvent) => { if (isDragging) handleMove(e.clientX); };
    const handleTouchMove = (e: React.TouchEvent) => { if (isDragging) handleMove(e.touches[0].clientX); };

    useEffect(() => {
        const handleGlobalUp = () => setIsDragging(false);
        window.addEventListener('mouseup', handleGlobalUp);
        window.addEventListener('touchend', handleGlobalUp);
        return () => {
            window.removeEventListener('mouseup', handleGlobalUp);
            window.removeEventListener('touchend', handleGlobalUp);
        };
    }, []);

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900 p-8">
            <div className="absolute top-4 right-4 z-50">
                <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all">
                    <X size={20} />
                </button>
            </div>
            
            <div className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                <ArrowLeftRight size={24} /> Comparativo Upscale
            </div>
            
            <div 
                ref={containerRef}
                className="relative w-full max-w-5xl h-[80vh] bg-black rounded-lg overflow-hidden shadow-2xl cursor-col-resize select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onTouchStart={handleMouseDown}
                onTouchMove={handleTouchMove}
            >
                {/* After Image (Background) */}
                <img src={after} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                
                {/* Before Image (Foreground with Clip) */}
                <div 
                    className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                >
                    <img src={before} className="absolute inset-0 w-full h-full object-contain" />
                </div>

                {/* Slider Handle */}
                <div 
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ left: `${sliderPos}%` }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-brand-600">
                        <ArrowLeftRight size={14} />
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-xs font-bold backdrop-blur-sm pointer-events-none">Original</div>
                <div className="absolute bottom-4 right-4 bg-brand-600/80 text-white px-3 py-1 rounded text-xs font-bold backdrop-blur-sm pointer-events-none">Upscale 4K</div>
            </div>
        </div>
    );
};

const Canvas: React.FC<CanvasProps> = ({ 
    imageUrl, candidates, onSelectCandidate, history, onUpscale, onVariation, onRatioChange, onSelectHistory, isProcessing, currentRatio,
    isComparing, beforeImage, afterImage, onCloseComparison
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { setScale(1); setPosition({ x: 0, y: 0 }); }, [imageUrl, candidates]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!imageUrl && !candidates) return;
    setScale(Math.min(Math.max(0.5, scale - e.deltaY * 0.001), 4));
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageUrl && !candidates) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `web-studio-render-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Download failed", e);
    }
  };

  // Render Comparison Mode
  if (isComparing && beforeImage && afterImage) {
      return <ComparisonSlider before={beforeImage} after={afterImage} onClose={onCloseComparison} />;
  }

  // Render Grid for Candidates
  if (candidates && candidates.length > 1) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 relative overflow-hidden">
               <div className="z-10 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-brand-100 mb-6 flex items-center gap-2">
                   <Sparkles size={16} className="text-brand-600 animate-pulse" />
                   <span className="text-sm font-bold text-slate-700">Escolha a melhor versão para continuar</span>
               </div>
               
               <div className="grid grid-cols-2 gap-6 p-10 max-w-4xl max-h-full overflow-y-auto">
                   {candidates.map((img, idx) => (
                       <div 
                         key={idx} 
                         onClick={() => onSelectCandidate(img)}
                         className="relative group cursor-pointer rounded-2xl overflow-hidden border-4 border-white shadow-md hover:shadow-xl hover:scale-105 transition-all hover:border-brand-500"
                       >
                           <img src={img} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <div className="bg-white text-brand-600 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                   <CheckCircle size={16} /> Selecionar
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-gray-50/50">
      
      {/* Zoom Controls */}
      <div className="absolute top-6 right-6 z-10 flex gap-2">
         <div className="bg-white rounded-full shadow-dock p-1.5 flex items-center gap-1 border border-gray-100">
            <button onClick={() => setScale(Math.max(0.5, scale - 0.2))} className="p-2 hover:bg-gray-100 rounded-full"><ZoomOut size={16} /></button>
            <span className="text-xs font-bold text-gray-500 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(Math.min(4, scale + 0.2))} className="p-2 hover:bg-gray-100 rounded-full"><ZoomIn size={16} /></button>
            <div className="w-px h-4 bg-gray-200 mx-1"></div>
            <button onClick={() => { setScale(1); setPosition({x:0, y:0}); }} className="p-2 hover:bg-gray-100 rounded-full"><Maximize2 size={16} /></button>
         </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className={`flex-1 flex items-center justify-center relative overflow-hidden cursor-${isDragging ? 'grabbing' : imageUrl ? 'grab' : 'default'}`}
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
      >
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
         {imageUrl ? (
           <div style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.2s ease-out' }} className="shadow-2xl">
              <img src={imageUrl} className="max-h-[80vh] max-w-[80vw] object-contain bg-white shadow-lg pointer-events-none" />
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center text-gray-300 space-y-6 pointer-events-none">
              <div className="w-32 h-32 rounded-3xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center shadow-sm animate-pulse"><Image size={48} /></div>
              <p className="text-sm font-semibold text-gray-400 tracking-widest uppercase">Aguardando Criação</p>
           </div>
         )}
      </div>

      {/* Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 w-full max-w-3xl px-4 pointer-events-none">
         {showHistory && history.length > 0 && (
            <div className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-dock p-3 w-full animate-in slide-in-from-bottom-5 fade-in">
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {history.map((url, i) => (
                        <img key={i} src={url} onClick={() => onSelectHistory(url)} className={`w-16 h-16 rounded-xl object-cover cursor-pointer border-2 hover:scale-105 transition-all ${imageUrl === url ? 'border-brand-600' : 'border-transparent'}`} />
                    ))}
                </div>
            </div>
         )}

         <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-white/50 rounded-full shadow-dock px-4 py-3 flex items-center gap-4 hover:shadow-xl transition-shadow">
            
            {/* Resolutions */}
            <div className="flex gap-2 pr-4 border-r border-gray-200">
                <button 
                    onClick={() => onRatioChange('1:1')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all ${currentRatio === '1:1' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                    <Instagram size={14} /> 1080x1080
                </button>
                <button 
                    onClick={() => onRatioChange('3:4')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all ${currentRatio === '3:4' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                    <Smartphone size={14} /> 1080x1350
                </button>
                <button 
                    onClick={() => onRatioChange('9:16')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all ${currentRatio === '9:16' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                    <Smartphone size={14} /> 1080x1920
                </button>
                <button 
                    onClick={() => onRatioChange('16:9')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all ${currentRatio === '16:9' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                    <Monitor size={14} /> 1280x720
                </button>
            </div>

            <div className="flex gap-3">
                <Tooltip text="Criar Variação">
                    <button onClick={onVariation} disabled={!imageUrl || isProcessing} className="p-2.5 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 hover:text-black transition-all disabled:opacity-50">
                        {isProcessing ? <RefreshCcw size={18} className="animate-spin" /> : <Shuffle size={18} />} 
                    </button>
                </Tooltip>

                <Tooltip text="Upscale (4K)">
                    <button onClick={onUpscale} disabled={!imageUrl || isProcessing} className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-full font-bold text-xs hover:bg-brand-100 transition-all disabled:opacity-50">
                        <Sparkles size={14} /> Upscale
                    </button>
                </Tooltip>
                
                <button onClick={() => setShowHistory(!showHistory)} className="p-2.5 bg-gray-50 rounded-full hover:bg-gray-100 relative">
                    <History size={18} />
                    {history.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-brand-600 rounded-full animate-bounce" />}
                </button>
                
                <Tooltip text="Download (Imagem Atual)">
                    <button onClick={handleDownload} disabled={!imageUrl} className="p-2.5 bg-black text-white rounded-full hover:bg-gray-800 shadow-md active:scale-95 transition-all">
                        <Download size={18} />
                    </button>
                </Tooltip>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Canvas;