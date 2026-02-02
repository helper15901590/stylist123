
import React, { useState, useRef, useEffect } from 'react';
import { PRESET_MODELS } from './constants';
import { Gender, PresetModel, ClothingCategory } from './types';
import { AliyunStylistService } from './services/aliyunService';
import { fileToBase64, urlToBase64, compressImage } from './utils/imageUtils';

/**
 * 定义应用的三大流程阶段
 */
type AppStep = 'MODEL' | 'STYLING' | 'RESULT';

/**
 * 衣物分类的显示配置
 */
interface CategoryConfig {
  id: ClothingCategory;
  label: string;
  icon: string;
  group: string;
}

// 分组展示
const CLOTHING_GROUPS = [
  { id: 'apparel', label: '主体服饰' },
  { id: 'acc', label: '精致配饰' },
  { id: 'detail', label: '包袋鞋履' },
];

// 具体分类配置
const CLOTHING_CONFIG: CategoryConfig[] = [
  { id: 'TOP', label: '上衣', icon: '👕', group: 'apparel' },
  { id: 'OUTERWEAR', label: '外套', icon: '🧥', group: 'apparel' },
  { id: 'BOTTOM', label: '下装', icon: '👖', group: 'apparel' },
  { id: 'HEADWEAR', label: '头饰', icon: '👒', group: 'acc' },
  { id: 'EARRINGS', label: '耳饰', icon: '💎', group: 'acc' },
  { id: 'NECKLACE', label: '项链', icon: '📿', group: 'acc' },
  { id: 'HAND_ACC', label: '手饰', icon: '⌚', group: 'acc' },
  { id: 'BAG', label: '包包', icon: '👜', group: 'detail' },
  { id: 'SHOES', label: '鞋子', icon: '👟', group: 'detail' },
];

const LOADING_MESSAGES = [
  "正在解析布料纹理...",
  "正在重构真实光影效果...",
  "正在计算衣物叠穿层次...",
  "正在融合背景环境细节...",
  "即将呈现完美搭配..."
];

/**
 * App - 虚拟试穿主应用组件
 */
const App: React.FC = () => {
  // --- 状态管理 ---
  const [currentStep, setCurrentStep] = useState<AppStep>('MODEL'); 
  const [selectedModel, setSelectedModel] = useState<PresetModel | null>(null); 
  const [customModelImage, setCustomModelImage] = useState<string | null>(null); 
  const [clothingImages, setClothingImages] = useState<Partial<Record<ClothingCategory, string>>>({}); 
  const [customScenarioImage, setCustomScenarioImage] = useState<string | null>(null); 
  
  const [isGenerating, setIsGenerating] = useState(false); 
  const [generatedResult, setGeneratedResult] = useState<string | null>(null); 
  const [error, setError] = useState<string | null>(null); 
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null); 
  const [uploadTarget, setUploadTarget] = useState<ClothingCategory | 'MODEL' | 'SCENARIO' | null>(null);

  // 加载文案轮播逻辑
  useEffect(() => {
    let timer: number;
    if (isGenerating) {
      timer = window.setInterval(() => {
        setLoadingTextIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  // --- 处理函数 ---

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const result = reader.result as string;
        const dataUrl = await compressImage(result);
        
        if (uploadTarget === 'MODEL') {
          setCustomModelImage(dataUrl);
          setSelectedModel(null);
        } else if (uploadTarget === 'SCENARIO') {
          setCustomScenarioImage(dataUrl);
        } else if (uploadTarget) {
          setClothingImages(prev => ({ ...prev, [uploadTarget]: dataUrl }));
        }
      };
    } catch (err) {
      setError("图片处理失败，请重试");
    }
    event.target.value = ''; 
  };

  const triggerUpload = (target: ClothingCategory | 'MODEL' | 'SCENARIO') => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handleRemoveClothing = (catId: ClothingCategory) => {
    setClothingImages(prev => {
      const next = { ...prev };
      delete next[catId];
      return next;
    });
  };

  const handleSaveImage = () => {
    if (!generatedResult) return;
    const a = document.createElement('a');
    a.href = generatedResult;
    a.download = `随身搭_${Date.now()}.png`;
    a.click();
  };

  const handleRestart = () => {
    setCurrentStep('MODEL');
    setSelectedModel(null);
    setCustomModelImage(null);
    setClothingImages({});
    setCustomScenarioImage(null);
    setGeneratedResult(null);
    setError(null);
    setIsGenerating(false);
  };

  const startGeneration = async () => {
    const baseImgUrl = customModelImage || selectedModel?.imageUrl;
    if (!baseImgUrl) return;

    setCurrentStep('RESULT');
    setIsGenerating(true);
    setError(null);
    setGeneratedResult(null);
    setLoadingTextIdx(0);

    try {
      const stylistService = new AliyunStylistService();
      const getRawBase64 = (dataUrl: string) => dataUrl.split(',')[1];
      const personBase64 = await urlToBase64(baseImgUrl);
      const processedClothing: Partial<Record<ClothingCategory, string>> = {};
      
      for (const [cat, url] of Object.entries(clothingImages)) {
        if (url) {
          processedClothing[cat as ClothingCategory] = getRawBase64(url);
        }
      }

      const result = await stylistService.generateTryOn({
        personBase64,
        clothingItems: processedClothing,
      });
      setGeneratedResult(result);
    } catch (err: any) {
      console.error("生成失败:", err);
      setError(err.message || "搭配渲染失败，请检查网络或稍后重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 局部渲染组件 ---

  const StepIndicator = () => (
    <div className="flex justify-center items-center gap-4 mb-8">
      {[
        { id: 'MODEL', label: '模特选择' },
        { id: 'STYLING', label: '服饰搭配' },
        { id: 'RESULT', label: '效果呈现' }
      ].map((s, idx) => (
        <div key={s.id} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-black transition-all ${currentStep === s.id ? 'bg-black border-black text-white' : 'border-slate-300 text-slate-400'}`}>
            {idx + 1}
          </div>
          <span className={`text-xs font-bold ${currentStep === s.id ? 'text-black' : 'text-slate-400'}`}>
            {s.label}
          </span>
          {idx < 2 && <div className="w-8 h-[1px] bg-slate-200"></div>}
        </div>
      ))}
    </div>
  );

  const ModelStep = () => (
    <div className="max-w-xl mx-auto p-4 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-4">
        {PRESET_MODELS.map(m => (
          <button
            key={m.id}
            onClick={() => { setSelectedModel(m); setCustomModelImage(null); }}
            className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all ${selectedModel?.id === m.id ? 'border-black ring-4 ring-black/10' : 'border-transparent hover:border-slate-200'}`}
          >
            <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-sm font-bold">{m.name}</p>
            </div>
          </button>
        ))}
        <button 
          onClick={() => triggerUpload('MODEL')}
          className={`aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all overflow-hidden ${customModelImage ? 'border-black bg-slate-50' : 'border-slate-300 hover:border-slate-400'}`}
        >
          {customModelImage ? (
            <img src={customModelImage} className="w-full h-full object-cover" alt="Custom" />
          ) : (
            <>
              <span className="text-2xl">📸</span>
              <span className="text-xs font-bold text-slate-500">上传本人照片</span>
            </>
          )}
        </button>
      </div>
      <button
        disabled={!selectedModel && !customModelImage}
        onClick={() => setCurrentStep('STYLING')}
        className="w-full py-4 bg-black text-white rounded-xl font-bold disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-lg"
      >
        选好了，去搭配
      </button>
    </div>
  );

  const StylingStep = () => {
    const selectedCount = Object.keys(clothingImages).length;

    return (
      <div className="max-w-2xl mx-auto p-4 flex flex-col gap-8 animate-in fade-in duration-500 relative">
        {/* 已选清单浮窗 */}
        {selectedCount > 0 && (
          <div className="sticky top-20 z-10 bg-black/90 backdrop-blur-md rounded-2xl p-3 shadow-xl mb-4 border border-white/10 flex items-center justify-between animate-in slide-in-from-top-4">
            <div className="flex -space-x-2 overflow-hidden items-center">
              {Object.entries(clothingImages).map(([catId, url]) => {
                return (
                  <div key={catId} className="w-10 h-10 rounded-full border-2 border-black bg-white overflow-hidden flex items-center justify-center relative group">
                    <img src={url} className="w-full h-full object-cover" alt={catId} />
                    <button 
                      onClick={() => handleRemoveClothing(catId as ClothingCategory)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/50 font-black uppercase tracking-widest block">已选单品</span>
              <span className="text-white text-lg font-black">{selectedCount}</span>
            </div>
          </div>
        )}

        {CLOTHING_GROUPS.map(group => (
          <div key={group.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-black tracking-widest text-black uppercase">{group.label}</h3>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CLOTHING_CONFIG.filter(c => c.group === group.id).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => triggerUpload(cat.id)}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden ${clothingImages[cat.id] ? 'border-black bg-white shadow-md' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'}`}
                >
                  {clothingImages[cat.id] ? (
                    <>
                      <img src={clothingImages[cat.id]} className="w-full h-full object-cover" alt={cat.label} />
                      <div className="absolute top-1 right-1">
                        <div 
                          onClick={(e) => { e.stopPropagation(); handleRemoveClothing(cat.id); }}
                          className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm"
                        >
                          ×
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-xl opacity-60">{cat.icon}</span>
                      <span className="text-[10px] font-bold text-slate-500">{cat.label}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-black tracking-widest text-black uppercase">背景场景</h3>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>
          <button
            onClick={() => triggerUpload('SCENARIO')}
            className={`h-24 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all overflow-hidden ${customScenarioImage ? 'border-black bg-white shadow-md' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'}`}
          >
            {customScenarioImage ? (
              <div className="relative w-full h-full">
                <img src={customScenarioImage} className="h-full w-full object-cover" alt="Scenario" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setCustomScenarioImage(null); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl opacity-40">🏙️</span>
                <span className="text-[10px] font-bold text-slate-400">上传指定场景图片 (可选)</span>
              </div>
            )}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-black tracking-widest text-black uppercase">模型说明</h3>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
            当前使用的是 <b>阿里云 aitryon-plus</b> 大模型。
            该模型专门优化了 <b>上装 (Top)</b>、<b>下装 (Bottom)</b> 以及 <b>外套 (Outerwear)</b> 的试穿效果。
            暂不支持配饰、鞋包以及背景场景的自动合成。
          </p>
        </div>

        <div className="sticky bottom-6 flex gap-4 mt-8 py-4 bg-gradient-to-t from-white via-white to-transparent">
          <button onClick={() => setCurrentStep('MODEL')} className="flex-1 py-4 border border-slate-200 rounded-xl font-bold text-slate-400 bg-white hover:text-black hover:border-black transition-all">返回修改</button>
          <button
            disabled={selectedCount === 0}
            onClick={startGeneration}
            className="flex-[2] py-4 bg-black text-white rounded-xl font-bold disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl active:scale-95"
          >
            立即渲染试穿 / {selectedCount > 0 ? `已选${selectedCount}件` : '未选单品'}
          </button>
        </div>
      </div>
    );
  };

  const ResultStep = () => (
    <div className="max-w-lg mx-auto p-4 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
      <div className="w-full aspect-[3/4] bg-slate-50 rounded-3xl overflow-hidden shadow-2xl relative border border-slate-100 group">
        {isGenerating ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-8 bg-white">
            <div className="relative">
              <div className="w-20 h-20 border-2 border-slate-100 rounded-full"></div>
              <div className="w-20 h-20 border-2 border-black border-t-transparent rounded-full animate-spin absolute inset-0"></div>
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-slate-300">STYLING</div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black tracking-[0.3em] text-black uppercase">{LOADING_MESSAGES[loadingTextIdx]}</p>
              <div className="w-32 h-[1px] bg-slate-100 mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-black animate-[loading_2s_infinite]"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-4">
            <span className="text-4xl">⚠️</span>
            <p className="text-red-500 text-sm font-bold leading-relaxed">{error}</p>
            <button onClick={startGeneration} className="px-6 py-2 bg-black text-white rounded-lg text-xs font-bold shadow-md">重试一次</button>
          </div>
        ) : (
          <img src={generatedResult || ''} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="Result" />
        )}
      </div>

      {!isGenerating && generatedResult && (
        <div className="flex flex-col w-full gap-3 animate-in slide-in-from-bottom-4">
          <button onClick={handleSaveImage} className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors uppercase tracking-widest text-[11px]">
            <span>⬇️</span> 保存搭配图 / SAVE IMAGE
          </button>
          <button onClick={handleRestart} className="w-full py-4 border border-slate-200 rounded-xl font-bold text-slate-400 hover:text-black hover:border-black transition-colors uppercase tracking-widest text-[10px]">
            重新开始 / RESTART
          </button>
        </div>
      )}
    </div>
  );

  // --- 主渲染逻辑 ---
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-12">
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      
      {/* 顶部导航 */}
      <header className="p-6 flex justify-between items-center border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter uppercase leading-none">AI 随身搭</h1>
          <span className="text-[7px] font-bold text-slate-300 tracking-[0.4em] uppercase mt-1">Virtual Fashion Stylist</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Engine</span>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="mt-8">
        <StepIndicator />
        
        {currentStep === 'MODEL' && <ModelStep />}
        {currentStep === 'STYLING' && <StylingStep />}
        {currentStep === 'RESULT' && <ResultStep />}
      </main>

      {/* 隐藏的上传组件 */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};

export default App;
