import React from 'react';
import { 
  Sparkles, 
  X, 
  ArrowRight, 
  Gamepad2, 
  UserCheck, 
  Rocket, 
  FileCode,
  Layers
} from 'lucide-react';
import { SAMPLE_TEMPLATES, TemplateProject } from '../utils/templates';
import { HostedFile } from '../types';
import { formatBytes } from '../utils/crypto';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (tpl: TemplateProject) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-[#090d16] p-6 sm:p-8 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">テンプレートから瞬時にサイト公開</h3>
              <p className="text-xs text-slate-400">
                1クリックでファイルを展開し、自分好みにエディタでカスタマイズ可能
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6">
          {SAMPLE_TEMPLATES.map((tpl) => {
            const totalBytes = tpl.files.reduce((acc, f) => acc + f.size, 0);

            return (
              <div
                key={tpl.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer"
                onClick={() => onSelectTemplate(tpl)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                      {tpl.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {tpl.badge}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {tpl.name}
                  </h4>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    {tpl.files.length} ファイル ({formatBytes(totalBytes)})
                  </span>

                  <button
                    type="button"
                    className="flex items-center gap-1 font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform"
                  >
                    <span>選択</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>💡 テンプレートを選択後、サイト設定でサブドメインを自由に変更できます。</span>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white font-medium ml-2"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
