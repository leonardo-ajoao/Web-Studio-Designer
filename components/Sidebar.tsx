import React, { useRef, useState } from 'react';
import { 
  Upload, User, Layout, Palette, Zap, Image as ImageIcon, 
  Wand2, Sparkles, Loader2, Plus, ArrowUpLeft, ArrowUp, ArrowUpRight,
  ArrowLeft, Circle, ArrowRight, ArrowDownLeft, ArrowDown, ArrowDownRight,
  Camera, Layers, Aperture, Command, Trash2, AlignVerticalJustifyCenter, AlignVerticalJustifyStart, AlignVerticalJustifyEnd,
  Cpu, Megaphone, Stethoscope, Wrench, Shirt, Sun, RotateCcw, FolderOpen, Clock, X, Grid2X2, ToggleLeft, ToggleRight
} from 'lucide-react';
import { DesignConfig, NicheOption, ProjectState } from '../types';
import { NICHES } from '../constants';
import { enhancePrompt } from '../services/geminiService';

interface SidebarProps {
  config: DesignConfig;
  setConfig: React.Dispatch<React.SetStateAction<DesignConfig>>;
  onGenerate: () => void;
  isGenerating: boolean;
  onReset: () => void; 
  savedProjects: ProjectState[];
  onRestore: (project: ProjectState) => void;
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <div className="group/tooltip relative flex items-center justify-center w-full">
    {children}
    <div className="absolute -top-10 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 transform translate-y-1 group-hover/tooltip:translate-y-0 pointer-events-none whitespace-nowrap z-50 shadow-xl">
      {text}
    </div>
  </div>
);

// Blue Theme Light Grid
const LightGrid = ({ selected, onSelect }: { selected: string, onSelect: (dir: string) => void }) => {
    const directions = [
        { id: 'top-left', icon: ArrowUpLeft }, { id: 'top-center', icon: ArrowUp }, { id: 'top-right', icon: ArrowUpRight },
        { id: 'middle-left', icon: ArrowLeft }, { id: 'center', icon: Circle }, { id: 'middle-right', icon: ArrowRight },
        { id: 'bottom-left', icon: ArrowDownLeft }, { id: 'bottom-center', icon: ArrowDown }, { id: 'bottom-right', icon: ArrowDownRight },
    ];

    return (
        <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900 rounded-xl w-fit mx-auto border border-slate-800">
            {directions.map((d) => (
                <button
                    key={d.id}
                    onClick={() => onSelect(d.id)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                        selected === d.id 
                        ? 'bg-brand-600 shadow-lg shadow-brand-900/50 text-white scale-110' 
                        : 'text-slate-500 hover:text-white hover:bg-slate-800'
                    }`}
                >
                    <d.icon size={14} strokeWidth={selected === d.id ? 3 : 2} />
                </button>
            ))}
        </div>
    );
};

const CameraDial = ({ label, value, min, max, onChange, unit = "°" }: any) => {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-14 h-14 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center group hover:border-brand-400 transition-colors">
                {/* Dial Indicator */}
                <div 
                    className="absolute w-full h-full rounded-full border-t-4 border-brand-500"
                    style={{ transform: `rotate(${((value - min) / (max - min)) * 360}deg)`, opacity: 0.8 }}
                />
                <span className="text-xs font-bold text-slate-700 z-10">{value}{unit}</span>
                <input 
                    type="range" min={min} max={max} value={value} 
                    onChange={onChange}
                    className="absolute inset-0 opacity-0 cursor-ew-resize z-20"
                    title={label}
                />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
        </div>
    );
};

const IconMap: Record<string, React.ReactNode> = {
    wand: <Wand2 size={16} />,
    megaphone: <Megaphone size={16} />,
    stethoscope: <Stethoscope size={16} />,
    wrench: <Wrench size={16} />,
    shirt: <Shirt size={16} />,
    cpu: <Cpu size={16} />
};

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, onGenerate, isGenerating, onReset, savedProjects, onRestore }) => {
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showProjects, setShowProjects] = useState(false);

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

  // Section Resets
  const resetLighting = () => {
      setConfig(prev => ({
          ...prev,
          niche: NICHES[0].id,
          rimLight: false,
          fillLight: false,
          lightingDirection: 'top-right',
          lightingColor: '#3b82f6'
      }));
  };

  const resetCamera = () => {
      setConfig(prev => ({
          ...prev,
          cameraAngle: 0,
          cameraVertical: 0,
          cameraZoom: 5
      }));
  };

  return (
    <div className="w-full h-full flex flex-col z-20 bg-slate-50/90 backdrop-blur-md border-r border-slate-200 shadow-xl overflow-hidden text-slate-900 relative">
      
      {/* PROJECT HISTORY DRAWER */}
      {showProjects && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-left duration-300">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <FolderOpen size={20} className="text-brand-600"/>
                      <h2 className="font-bold text-lg text-slate-900">Meus Projetos</h2>
                  </div>
                  <button onClick={() => setShowProjects(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                      <X size={20} />
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {savedProjects.length === 0 ? (
                      <div className="text-center text-slate-400 mt-20">
                          <Clock size={40} className="mx-auto mb-4 opacity-50"/>
                          <p>Nenhum projeto salvo no histórico.</p>
                      </div>
                  ) : (
                      savedProjects.map(project => (
                          <div key={project.id} onClick={() => { onRestore(project); setShowProjects(false); }} className="group cursor-pointer bg-white border border-slate-200 rounded-xl p-3 flex gap-4 hover:border-brand-500 hover:shadow-md transition-all">
                              <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                  {project.lastImage ? (
                                      <img src={project.lastImage} className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={24}/></div>
                                  )}
                              </div>
                              <div className="flex flex-col justify-center">
                                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                                      {project.name || "Projeto Sem Título"}
                                  </h3>
                                  <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                                      <Clock size={10} />
                                      {project.timestamp.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-2 bg-slate-50 px-2 py-1 rounded w-fit">
                                      {project.history.length} versões geradas
                                  </span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* HEADER */}
      <div className="p-6 pb-4 flex-shrink-0 flex items-center justify-between border-b border-slate-100 bg-white/50">
        <div className="flex items-center gap-3 select-none">
          <div className="relative w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30 overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-tr from-brand-700 to-brand-500"></div>
             <Command className="text-white z-10 relative" size={18} strokeWidth={3} />
          </div>
          <div className="flex flex-col justify-center">
             <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">WebStudio</span>
             <span className="font-medium text-xs tracking-wide text-slate-400 leading-none">AI Designer</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
            <Tooltip text="Projetos Salvos">
                <button 
                    onClick={() => setShowProjects(true)}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                >
                    <FolderOpen size={18} />
                </button>
            </Tooltip>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <Tooltip text="Novo Projeto (Salvar & Limpar)">
                <button 
                    onClick={onReset}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                    <Trash2 size={18} />
                </button>
            </Tooltip>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* --- MODULE 1: COMPOSITION (Clean & Professional) --- */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-brand-700">
              <Layers size={16} strokeWidth={2.5} />
              <h3 className="font-bold text-xs uppercase tracking-wider">Composição</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3 h-32">
                {/* Main Subject */}
                <div onClick={() => subjectInputRef.current?.click()} className="flex-1 relative group cursor-pointer">
                    <div className={`w-full h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-slate-50 ${config.subjectImage ? 'border-brand-500' : 'border-slate-200 group-hover:border-brand-400'}`}>
                        {config.subjectImage ? (
                            <img src={config.subjectImage} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-2">
                                <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-2"><User size={16}/></div>
                                <span className="text-[10px] font-bold text-slate-500">Sujeito</span>
                            </div>
                        )}
                    </div>
                    <input ref={subjectInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'subjectImage')} />
                </div>

                {/* Reference/Object */}
                <div onClick={() => secondaryInputRef.current?.click()} className="flex-1 relative group cursor-pointer">
                    <div className={`w-full h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-slate-50 ${config.secondaryImage ? 'border-brand-500' : 'border-slate-200 group-hover:border-brand-400'}`}>
                        {config.secondaryImage ? (
                            <img src={config.secondaryImage} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-2">
                                <div className="w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2"><Plus size={16}/></div>
                                <span className="text-[10px] font-bold text-slate-500">Ref/Fundo</span>
                            </div>
                        )}
                    </div>
                     <input ref={secondaryInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'secondaryImage')} />
                </div>
            </div>

            {/* Position Control */}
            <div className="flex bg-slate-100 rounded-lg p-1">
                 {[
                     { id: 'top', icon: AlignVerticalJustifyStart },
                     { id: 'center', icon: AlignVerticalJustifyCenter },
                     { id: 'bottom', icon: AlignVerticalJustifyEnd }
                 ].map((opt) => (
                    <button 
                        key={opt.id}
                        onClick={() => setConfig({...config, subjectPosition: opt.id as any})}
                        className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-all ${config.subjectPosition === opt.id ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <opt.icon size={16} />
                    </button>
                 ))}
            </div>

            {/* Prompt Input */}
            <div className="relative group">
                <textarea 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none h-20 placeholder-slate-400 transition-all"
                    placeholder="Descreva o cenário, ação e detalhes..."
                    value={config.subjectDescription}
                    onChange={(e) => setConfig({...config, subjectDescription: e.target.value})}
                />
                <button onClick={handleEnhancePrompt} disabled={isEnhancing} className="absolute bottom-2 right-2 p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-brand-500 hover:bg-brand-50 transition-colors">
                    {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                </button>
            </div>
          </div>
        </section>

        {/* --- MODULE 2: AMBIENCE & LIGHTING (Merged) --- */}
        <section className={`bg-white rounded-2xl p-5 shadow-sm border transition-all relative group/section ${config.studioLightActive ? 'border-brand-200' : 'border-slate-100'}`}>
             <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2 text-brand-700">
                    <Sun size={16} strokeWidth={2.5} />
                    <h3 className="font-bold text-xs uppercase tracking-wider">Estúdio & Luz</h3>
                 </div>
                 
                 <div className="flex items-center gap-2">
                     <Tooltip text={config.studioLightActive ? "Desativar Iluminação" : "Ativar Iluminação"}>
                        <button 
                            onClick={() => setConfig({...config, studioLightActive: !config.studioLightActive})}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${config.studioLightActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'}`}
                        >
                            {config.studioLightActive ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                            {config.studioLightActive ? 'ON' : 'OFF'}
                        </button>
                     </Tooltip>
                     
                     {config.studioLightActive && (
                         <Tooltip text="Resetar Luz">
                             <button onClick={resetLighting} className="p-1 text-slate-300 hover:text-slate-500 transition-colors"><RotateCcw size={14}/></button>
                         </Tooltip>
                     )}
                 </div>
             </div>

             {/* Only show controls if Active */}
             <div className={`space-y-4 transition-all duration-300 ${config.studioLightActive ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                 
                 {/* Niche Selector (Ambience) */}
                 <div className="mb-4">
                     <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Ambientação (Estilo)</label>
                     <div className="grid grid-cols-3 gap-2">
                         {NICHES.map((niche) => (
                             <button
                                key={niche.id}
                                onClick={() => setConfig({...config, niche: niche.id})}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                                    config.niche === niche.id 
                                    ? 'bg-brand-50 border-brand-200 text-brand-700' 
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-brand-200 hover:text-brand-500'
                                }`}
                             >
                                 {IconMap[niche.iconId] || <Wand2 size={16}/>}
                                 <span className="text-[9px] font-bold mt-1 truncate w-full text-center">{niche.label}</span>
                             </button>
                         ))}
                     </div>
                 </div>

                 {/* Rim Light Toggle */}
                 <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Rim Light (Contorno)</span>
                     <button 
                        onClick={() => setConfig({...config, rimLight: !config.rimLight})}
                        className={`w-8 h-5 rounded-full p-0.5 transition-colors ${config.rimLight ? 'bg-brand-500' : 'bg-slate-200'}`}
                     >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${config.rimLight ? 'translate-x-3' : 'translate-x-0'}`} />
                     </button>
                 </div>
                 
                 {/* Lighting Controls (Expanded) */}
                 <div className={`space-y-4 overflow-hidden transition-all duration-300 ${config.rimLight ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex gap-4">
                         <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Direção</label>
                            <LightGrid selected={config.lightingDirection} onSelect={(dir) => setConfig({...config, lightingDirection: dir})} />
                         </div>
                         <div className="flex flex-col items-center justify-start pt-6">
                            <input 
                                type="color" 
                                value={config.lightingColor}
                                onChange={(e) => setConfig({...config, lightingColor: e.target.value})}
                                className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border-2 border-slate-200 p-0"
                                title="Cor da Luz"
                            />
                            <span className="text-[9px] font-mono text-slate-400 mt-1">{config.lightingColor}</span>
                         </div>
                    </div>
                    <button 
                        onClick={() => setConfig({...config, fillLight: !config.fillLight})}
                        className={`w-full py-2 rounded-lg text-[10px] font-bold border transition-all ${config.fillLight ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-400'}`}
                    >
                        {config.fillLight ? 'Preenchimento: ON' : 'Preenchimento: OFF'}
                    </button>
                 </div>
            </div>
        </section>

        {/* --- MODULE 3: LENSES (Improved Visuals) --- */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative group/section">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-brand-700">
                    <Camera size={16} strokeWidth={2.5} />
                    <h3 className="font-bold text-xs uppercase tracking-wider">Lentes & Ângulo</h3>
                </div>
                <Tooltip text="Resetar Lentes">
                    <button onClick={resetCamera} className="p-1 text-slate-300 hover:text-slate-500 transition-colors"><RotateCcw size={14}/></button>
                </Tooltip>
             </div>

             <div className="flex items-end justify-between gap-2">
                <CameraDial 
                    label="Rotação" value={config.cameraAngle} min={-180} max={180} 
                    onChange={(e: any) => setConfig({...config, cameraAngle: parseInt(e.target.value)})} 
                />
                
                {/* Zoom Slider */}
                <div className="flex-1 px-2 pb-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>Perto</span>
                        <span>Longe</span>
                    </div>
                    <div className="relative h-6 bg-slate-100 rounded-full flex items-center px-1">
                        <input 
                            type="range" min="1" max="10" step="0.5"
                            value={config.cameraZoom}
                            onChange={(e) => setConfig({...config, cameraZoom: parseFloat(e.target.value)})}
                            className="w-full h-full opacity-0 absolute z-10 cursor-pointer"
                        />
                        <div 
                            className="h-4 bg-brand-500 rounded-full transition-all shadow-sm"
                            style={{ width: `${(config.cameraZoom / 10) * 100}%` }} 
                        />
                    </div>
                    <div className="text-center mt-1">
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Zoom {config.cameraZoom}x</span>
                    </div>
                </div>

                <CameraDial 
                    label="Tilt" value={config.cameraVertical} min={-90} max={90} 
                    onChange={(e: any) => setConfig({...config, cameraVertical: parseInt(e.target.value)})} 
                />
             </div>
        </section>

      </div>

      {/* FOOTER */}
      <div className="p-6 pt-2 bg-slate-50 border-t border-slate-200 space-y-3">
        {/* Quantity Selector - Styled as Segmented Control */}
        <div className="flex items-center justify-between bg-white rounded-xl p-2 border border-slate-200">
             <div className="flex items-center gap-2 px-1">
                 <Grid2X2 size={16} className="text-slate-400"/>
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Variações</span>
             </div>
             <div className="flex bg-slate-100 rounded-lg p-1">
                 {[1, 2, 3, 4].map((num) => (
                     <button
                        key={num}
                        onClick={() => setConfig({...config, imageCount: num as any})}
                        className={`w-8 h-7 text-xs font-bold rounded-md transition-all ${
                            config.imageCount === num 
                            ? 'bg-white text-brand-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                     >
                         {num}
                     </button>
                 ))}
             </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full h-14 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 
                     bg-brand-600 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700 hover:shadow-brand-600/40 active:translate-y-0.5
                     disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
               <Loader2 className="animate-spin" size={18} />
               <span>Renderizando...</span>
            </>
          ) : (
            <>
              <Wand2 size={18} />
              <span>Gerar Visual</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;