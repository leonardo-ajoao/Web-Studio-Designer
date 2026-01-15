import React, { useRef, useState } from 'react';
import { 
  Upload, User, Layout, Palette, Zap, Image as ImageIcon, 
  Wand2, Sparkles, Loader2, Plus, ArrowUpLeft, ArrowUp, ArrowUpRight,
  ArrowLeft, Circle, ArrowRight, ArrowDownLeft, ArrowDown, ArrowDownRight,
  Camera, Layers, Aperture, Command, ScanFace, UserCog
} from 'lucide-react';
import { DesignConfig } from '../types';
import { NICHES } from '../constants';
import { enhancePrompt } from '../services/geminiService';

interface SidebarProps {
  config: DesignConfig;
  setConfig: React.Dispatch<React.SetStateAction<DesignConfig>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <div className="group/tooltip relative flex items-center justify-center w-full">
    {children}
    <div className="absolute -top-10 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 transform translate-y-1 group-hover/tooltip:translate-y-0 pointer-events-none whitespace-nowrap z-50 shadow-xl">
      {text}
    </div>
  </div>
);

// Grid component for Light Direction
const LightGrid = ({ selected, onSelect }: { selected: string, onSelect: (dir: string) => void }) => {
    const directions = [
        { id: 'top-left', icon: ArrowUpLeft }, { id: 'top-center', icon: ArrowUp }, { id: 'top-right', icon: ArrowUpRight },
        { id: 'middle-left', icon: ArrowLeft }, { id: 'center', icon: Circle }, { id: 'middle-right', icon: ArrowRight },
        { id: 'bottom-left', icon: ArrowDownLeft }, { id: 'bottom-center', icon: ArrowDown }, { id: 'bottom-right', icon: ArrowDownRight },
    ];

    return (
        <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-xl w-fit mx-auto">
            {directions.map((d) => (
                <button
                    key={d.id}
                    onClick={() => onSelect(d.id)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                        selected === d.id 
                        ? 'bg-white shadow-md text-brand-600 scale-105' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <d.icon size={14} strokeWidth={selected === d.id ? 2.5 : 2} />
                </button>
            ))}
        </div>
    );
};

// Subtle Dial Control for Camera
const CameraDial = ({ label, value, min, max, onChange, unit = "°" }: any) => {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16 rounded-full border-2 border-gray-100 bg-white shadow-sm flex items-center justify-center group hover:border-brand-200 transition-colors">
                <div 
                    className="absolute w-full h-full rounded-full border-b-2 border-brand-500 opacity-20"
                    style={{ transform: `rotate(${((value - min) / (max - min)) * 360}deg)` }}
                />
                <span className="text-xs font-bold text-gray-700">{value}{unit}</span>
                <input 
                    type="range" min={min} max={max} value={value} 
                    onChange={onChange}
                    className="absolute inset-0 opacity-0 cursor-ew-resize"
                    title={label}
                />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, onGenerate, isGenerating }) => {
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'subjectImage' | 'secondaryImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!config.subjectDescription) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(config.subjectDescription);
      setConfig(prev => ({ ...prev, subjectDescription: enhanced }));
    } catch (e) { console.error(e); } finally { setIsEnhancing(false); }
  };

  return (
    <div className="w-full h-full flex flex-col z-20 bg-surface-50/80 backdrop-blur-md border-r border-gray-200/50 shadow-xl overflow-hidden">
      
      {/* BRAND HEADER */}
      <div className="p-7 pb-2 flex-shrink-0">
        <div className="flex items-center gap-3 select-none">
          <div className="relative w-11 h-11 bg-black rounded-xl flex items-center justify-center shadow-lg ring-4 ring-black/5 overflow-hidden group">
             <div className="absolute -top-6 -right-6 w-12 h-12 bg-white/20 rounded-full blur-lg group-hover:scale-110 transition-transform"></div>
             <div className="absolute bottom-0 left-0 w-6 h-6 bg-brand-500/30 rotate-45"></div>
             <Command className="text-white z-10 relative" size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center h-12">
             <div className="flex items-baseline gap-1">
                <span className="font-bold text-2xl tracking-tighter text-gray-900 leading-none">Web</span>
                <span className="font-light text-2xl tracking-tighter text-gray-500 leading-none">Studio</span>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7 space-y-8">
        
        {/* Module 1: Composition (Images) */}
        <section className="bg-white rounded-[2rem] p-6 shadow-soft border border-gray-100/80">
          <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                    {config.isCharacterGen ? <ScanFace size={18} /> : <Layers size={18} />}
                </div>
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    {config.isCharacterGen ? "Gerar Personagem" : "Composição"}
                </h3>
              </div>
              
              {/* Toggle Character Gen Mode */}
              <button 
                onClick={() => setConfig({...config, isCharacterGen: !config.isCharacterGen})}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                    config.isCharacterGen 
                    ? 'bg-black text-white border-black shadow-lg' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                  <UserCog size={12} />
                  {config.isCharacterGen ? "Modo Personagem ON" : "Modo Padrão"}
              </button>
          </div>
          
          <div className="space-y-4">
            {/* Visual Guide for Character Mode */}
            {config.isCharacterGen && (
                <div className="px-3 py-2 bg-blue-50 rounded-xl border border-blue-100 mb-2">
                    <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                        <span className="font-bold">Como funciona:</span> A IA coletará o DNA (Rosto) da Imagem 1 e aplicará na Pose/Roupa da Imagem 2.
                    </p>
                </div>
            )}

            <div className="flex gap-3">
                {/* Image 1: Subject / DNA */}
                <Tooltip text={config.isCharacterGen ? "Rosto/Identidade (DNA)" : "Sujeito Principal"}>
                    <div onClick={() => subjectInputRef.current?.click()} className={`flex-1 h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${config.isCharacterGen ? 'border-brand-300 bg-brand-50/30' : 'border-gray-200 hover:border-brand-500'}`}>
                        {config.subjectImage ? (
                            <>
                                <img src={config.subjectImage} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-white text-xs font-bold">Alterar</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center px-2 text-center">
                                {config.isCharacterGen ? <ScanFace className="text-brand-500 mb-2" size={24} /> : <User className="text-gray-300 mb-2" size={24} />}
                                <span className={`text-[10px] font-bold ${config.isCharacterGen ? 'text-brand-600' : 'text-gray-400'}`}>
                                    {config.isCharacterGen ? "Upload Rosto" : "Sujeito"}
                                </span>
                            </div>
                        )}
                        <input ref={subjectInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'subjectImage')} />
                    </div>
                </Tooltip>

                {/* Arrow Connector for Char Mode */}
                {config.isCharacterGen && (
                    <div className="flex items-center justify-center">
                        <ArrowRight size={16} className="text-gray-300" />
                    </div>
                )}

                {/* Image 2: Reference / Style */}
                <Tooltip text={config.isCharacterGen ? "Referência de Look/Pose/Roupa" : "Referência ou Objeto"}>
                    <div onClick={() => secondaryInputRef.current?.click()} className={`flex-1 h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${config.isCharacterGen ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200 hover:border-accent-500'}`}>
                        {config.secondaryImage ? (
                            <>
                                <img src={config.secondaryImage} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-white text-xs font-bold">Alterar</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center px-2 text-center">
                                {config.isCharacterGen ? <UserCog className="text-purple-500 mb-2" size={24} /> : <Plus className="text-gray-300 mb-2" size={24} />}
                                <span className={`text-[10px] font-bold ${config.isCharacterGen ? 'text-purple-600' : 'text-gray-400'}`}>
                                    {config.isCharacterGen ? "Upload Look" : "Combinar"}
                                </span>
                            </div>
                        )}
                         <input ref={secondaryInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'secondaryImage')} />
                    </div>
                </Tooltip>
            </div>

            <div className="relative">
                <textarea 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20 outline-none resize-none h-24 placeholder-gray-400"
                    placeholder={config.isCharacterGen ? "Detalhes adicionais (Ex: fazer o personagem sorrir, mudar a cor da camisa para azul...)" : "Descreva o cenário e a ação..."}
                    value={config.subjectDescription}
                    onChange={(e) => setConfig({...config, subjectDescription: e.target.value})}
                />
                <button onClick={handleEnhancePrompt} disabled={isEnhancing} className="absolute bottom-2 right-2 p-1.5 bg-white shadow-sm border rounded-lg hover:text-brand-600">
                    {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                </button>
            </div>
          </div>
        </section>

        {/* Module 2: Camera Controls (Redesigned - Subtle) */}
        <section className="bg-white rounded-[2rem] p-6 shadow-soft border border-gray-100/80">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-xl text-gray-600"><Camera size={18} /></div>
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Lentes & Ângulo</h3>
                </div>
                <div className="px-2 py-1 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-[10px] font-mono font-bold text-gray-500">MANUAL</span>
                </div>
             </div>

             <div className="flex justify-between items-end gap-4">
                {/* Dials for Rotation */}
                <CameraDial 
                    label="Rotação" value={config.cameraAngle} min={-180} max={180} 
                    onChange={(e: any) => setConfig({...config, cameraAngle: parseInt(e.target.value)})} 
                />
                <CameraDial 
                    label="Inclinação" value={config.cameraVertical} min={-90} max={90} 
                    onChange={(e: any) => setConfig({...config, cameraVertical: parseInt(e.target.value)})} 
                />
                
                {/* Vertical Slider for Zoom */}
                <div className="flex flex-col items-center gap-2 flex-1">
                     <div className="relative w-full h-8 bg-gray-100 rounded-full flex items-center px-2">
                        <Aperture size={12} className="text-gray-400 absolute left-3" />
                        <input 
                            type="range" min="1" max="10" step="0.5"
                            value={config.cameraZoom}
                            onChange={(e) => setConfig({...config, cameraZoom: parseFloat(e.target.value)})}
                            className="w-full h-full opacity-0 absolute cursor-pointer z-10"
                        />
                        <div className="h-1.5 bg-gray-300 rounded-full w-full overflow-hidden">
                             <div className="h-full bg-black transition-all" style={{ width: `${(config.cameraZoom / 10) * 100}%` }} />
                        </div>
                     </div>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Zoom {config.cameraZoom}x</span>
                </div>
             </div>
        </section>

        {/* Module 3: Lighting (Pro - Inspired by Image 1) */}
        <section className="bg-gray-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
          {/* Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/20 blur-3xl rounded-full pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-5 relative z-10">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-gray-800 rounded-xl text-white"><Zap size={18} fill="currentColor"/></div>
               <h3 className="font-bold text-white text-sm uppercase tracking-wide">Iluminação Pro</h3>
             </div>
             
             {/* Main Toggle */}
             <div 
                className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${config.rimLight ? 'bg-brand-500' : 'bg-gray-700'}`}
                onClick={() => setConfig({...config, rimLight: !config.rimLight})}
             >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${config.rimLight ? 'translate-x-6' : 'translate-x-0'}`} />
             </div>
          </div>
          
          {/* Advanced Controls (Only Visible if Active) */}
          <div className={`space-y-5 transition-all duration-500 relative z-10 ${config.rimLight ? 'opacity-100 max-h-96' : 'opacity-30 max-h-0 overflow-hidden'}`}>
             
             {/* Direction Control */}
             <div className="flex items-start gap-4">
                 <div className="flex-1">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Direção da Luz</label>
                     <LightGrid selected={config.lightingDirection} onSelect={(dir) => setConfig({...config, lightingDirection: dir})} />
                 </div>
                 
                 {/* Light Color */}
                 <div className="flex-1 flex flex-col items-end">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block text-right">Cor do Recorte</label>
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-glow ring-2 ring-brand-500/50">
                        <input 
                            type="color" 
                            value={config.lightingColor}
                            onChange={(e) => setConfig({...config, lightingColor: e.target.value})}
                            className="absolute -top-4 -left-4 w-20 h-20 p-0 border-0 cursor-pointer"
                        />
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 mt-1">{config.lightingColor}</span>
                 </div>
             </div>

             <div className="pt-2 border-t border-gray-800">
                <button 
                    onClick={() => setConfig({...config, fillLight: !config.fillLight})}
                    className={`w-full py-2 rounded-lg text-xs font-bold border transition-colors ${config.fillLight ? 'bg-white/10 border-white/20 text-white' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
                >
                    + Luz de Preenchimento (Suave)
                </button>
             </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="p-6 pt-2 bg-transparent flex-shrink-0">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full h-16 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 group active:translate-y-1 transition-all duration-300 
                     bg-gradient-to-r from-accent-500 via-amber-400 to-accent-600 bg-[length:200%_auto] hover:bg-right hover:shadow-glow-accent shadow-lg border-b-4 border-accent-600 active:border-b-0
                     text-black disabled:bg-none disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300"
        >
          {isGenerating ? (
            <>
               <Loader2 className="animate-spin text-black" size={24} />
               <span>Renderizando...</span>
            </>
          ) : (
            <>
              <Wand2 size={24} className="group-hover:rotate-12 transition-transform" />
              <span>Gerar Visual</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;