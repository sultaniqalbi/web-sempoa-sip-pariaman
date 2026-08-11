import React, { useState } from 'react';

interface GalleryItem {
  title: string;
  desc: string;
  category: string;
  emoji: string;
}

interface ImageGalleryProps {
  items: GalleryItem[];
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedItem(item)}
            className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden hover:scale-[1.01] transition-transform duration-200 shadow-xl cursor-pointer"
          >
            <div className="p-8 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full uppercase">
                  {item.category}
                </span>
              </div>
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl font-extrabold shadow-inner shrink-0">
                  {item.emoji}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white leading-snug">{item.title}</h3>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-lg"
            >
              ✕
            </button>
            <div className="w-24 h-24 bg-slate-800 rounded-3xl mx-auto flex items-center justify-center text-6xl shadow-inner">
              {selectedItem.emoji}
            </div>
            <div className="space-y-2">
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded-full uppercase">
                {selectedItem.category}
              </span>
              <h2 className="text-2xl font-extrabold text-white">{selectedItem.title}</h2>
              <p className="text-slate-350 text-xs leading-relaxed max-w-sm mx-auto">{selectedItem.desc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
