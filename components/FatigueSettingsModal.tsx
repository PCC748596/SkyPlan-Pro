
import React from 'react';
import { X } from 'lucide-react';

export interface FatigueSettings {
  sleepEstimation: 'AUTO' | 'MANUAL';
  timeMode: 'LOCAL' | 'UTC';
  timezone: string;
}

interface FatigueSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FatigueSettings;
  onUpdateSettings: (newSettings: FatigueSettings) => void;
}

const FatigueSettingsModal: React.FC<FatigueSettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof FatigueSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[350px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-lg flex flex-col font-sans select-none overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
          <span className="text-slate-900 dark:text-white font-bold text-sm">Settings</span>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Sleep Estimation */}
          <div className="flex flex-col gap-3">
             <span className="font-bold text-slate-200 border-b border-slate-300 dark:border-slate-700 pb-1">Sleep estimation:</span>
             <div className="flex flex-col gap-3 pl-1">
                <label className="flex items-start gap-2 cursor-pointer group">
                   <div className="relative flex items-center mt-0.5">
                      <input 
                        type="radio" 
                        name="sleepEst" 
                        className="peer appearance-none w-4 h-4 border-2 border-slate-500 rounded-full checked:border-blue-500 checked:border-4 transition-all"
                        checked={settings.sleepEstimation === 'AUTO'}
                        onChange={() => handleChange('sleepEstimation', 'AUTO')}
                      />
                   </div>
                   <div className="flex flex-col">
                      <span className="font-bold text-slate-200 group-hover:text-slate-900 dark:text-white">Automatic</span>
                      <span className="text-slate-500 leading-tight">estimate sleep times based on the duty schedule</span>
                   </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer group">
                   <div className="relative flex items-center mt-0.5">
                      <input 
                        type="radio" 
                        name="sleepEst" 
                        className="peer appearance-none w-4 h-4 border-2 border-slate-500 rounded-full checked:border-blue-500 checked:border-4 transition-all"
                        checked={settings.sleepEstimation === 'MANUAL'}
                        onChange={() => handleChange('sleepEstimation', 'MANUAL')}
                      />
                   </div>
                   <div className="flex flex-col">
                      <span className="font-bold text-slate-200 group-hover:text-slate-900 dark:text-white">Manual</span>
                      <span className="text-slate-500 leading-tight">manually fine-tune sleep times</span>
                   </div>
                </label>
             </div>
          </div>

          {/* Time Mode */}
          <div className="flex flex-col gap-3">
             <span className="font-bold text-slate-200 border-b border-slate-300 dark:border-slate-700 pb-1">Flight, duty, sleep times in:</span>
             <div className="flex flex-col gap-3 pl-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                   <input 
                     type="radio" 
                     name="timeMode" 
                     className="peer appearance-none w-4 h-4 border-2 border-slate-500 rounded-full checked:border-blue-500 checked:border-4 transition-all"
                     checked={settings.timeMode === 'LOCAL'}
                     onChange={() => handleChange('timeMode', 'LOCAL')}
                   />
                   <span className="font-bold text-slate-200 group-hover:text-slate-900 dark:text-white">Local time</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                   <input 
                     type="radio" 
                     name="timeMode" 
                     className="peer appearance-none w-4 h-4 border-2 border-slate-500 rounded-full checked:border-blue-500 checked:border-4 transition-all"
                     checked={settings.timeMode === 'UTC'}
                     onChange={() => handleChange('timeMode', 'UTC')}
                   />
                   <span className="font-bold text-slate-200 group-hover:text-slate-900 dark:text-white">Z time</span>
                </label>
             </div>
          </div>

          {/* Timezone */}
          <div className="flex flex-col gap-3">
             <span className="font-bold text-slate-200 border-b border-slate-300 dark:border-slate-700 pb-1">Timeline timezone</span>
             <div className="pl-1">
                <select 
                   className="bg-white text-slate-900 font-bold py-1 px-2 rounded w-24 outline-none focus:ring-2 focus:ring-blue-500"
                   value={settings.timezone}
                   onChange={(e) => handleChange('timezone', e.target.value)}
                >
                   <option value="Z-3">Z-3</option>
                   <option value="Z-4">Z-4</option>
                   <option value="Z">UTC</option>
                </select>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-end gap-2">
           <button onClick={onClose} className="px-4 py-2 bg-[#00A86B] hover:bg-[#00925c] text-slate-900 dark:text-white font-bold rounded text-xs transition-colors shadow-sm">
              Export scenario
           </button>
           <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded text-xs transition-colors">
              Close
           </button>
        </div>

      </div>
    </div>
  );
};

export default FatigueSettingsModal;
