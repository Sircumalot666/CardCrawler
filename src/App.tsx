import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  RefreshCw, 
  Search, 
  FileJson, 
  FileSpreadsheet, 
  Info,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Virtuoso } from 'react-virtuoso';
import { hearthstoneService } from './services/hearthstoneService';
import { Card, MetadataResponse } from './types';
import { Parser } from '@json2csv/plainjs';

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSet, setSelectedSet] = useState<number | null>(null);
  const [fetchClass, setFetchClass] = useState<string | null>(null);
  const [fetchFormat, setFetchFormat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [classMappings, setClassMappings] = useState<Record<number, string>>({});

  useEffect(() => {
    // Fetch metadata on mount to map IDs to names
    const fetchMetadata = async () => {
      try {
        const data = await hearthstoneService.getMetadata();
        setMetadata(data);
      } catch (err: any) {
        console.error("Failed to fetch metadata", err);
        const serverError = err.response?.data?.error || err.response?.data?.details?.error;
        setError(serverError ? `API Fehler: ${serverError}` : "Fehler beim Laden der Metadaten. Bitte API-Keys prüfen.");
      }
    };
    fetchMetadata();
  }, []);

  const fetchAllCards = async () => {
    setLoading(true);
    setError(null);
    setProgress(10); // Initial progress
    try {
      const data = await hearthstoneService.getAllCards('de_DE', fetchClass || undefined, fetchFormat || undefined);
      setCards(data.cards);
      setProgress(100);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Fehler beim Abrufen der Karten.");
    } finally {
      setLoading(false);
    }
  };

  const getExportableCards = (cardsToExport: Card[]) => {
    if (!metadata) return cardsToExport;
    return cardsToExport.map(card => ({
      ...card,
      className: classMappings[card.classId] || metadata.classes.find(c => c.id === card.classId)?.name || 'Unknown',
      setName: metadata.sets.find(s => s.id === card.cardSetId)?.name || 'Unknown',
      rarityName: metadata.rarities.find(r => r.id === card.rarityId)?.name || 'Unknown',
      cardTypeName: metadata.types.find(t => t.id === card.cardTypeId)?.name || 'Unknown',
    }));
  };

  const exportJSON = () => {
    const exportData = getExportableCards(filteredCards);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "hearthstone_cards.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportCSV = () => {
    try {
      const parser = new Parser();
      const exportData = getExportableCards(filteredCards);
      const csv = parser.parse(exportData);
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "hearthstone_cards.csv");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (err) {
      console.error("CSV Export failed", err);
      alert("CSV Export fehlgeschlagen.");
    }
  };

  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  const standardSetIds = useMemo(() => {
    if (!metadata) return new Set<number>();
    const standardGroup = metadata.setGroups.find(g => g.slug === 'standard');
    if (!standardGroup) return new Set<number>();
    
    const setIds = new Set<number>();
    standardGroup.cardSets.forEach(slug => {
      const set = metadata.sets.find(s => s.slug === slug);
      if (set) setIds.add(set.id);
    });
    return setIds;
  }, [metadata]);

  const filteredCards = useMemo(() => {
    const neutralClass = metadata?.classes.find(c => c.slug === 'neutral');
    const neutralClassId = neutralClass?.id;

    return cards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            card.text?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesClass = true;
      if (selectedClass !== null && neutralClassId !== undefined) {
        matchesClass = card.classId === selectedClass || card.classId === neutralClassId;
      }
      
      let matchesFormat = true;
      if (selectedFormat === 'standard') {
        matchesFormat = standardSetIds.has(card.cardSetId);
      } else if (selectedFormat === 'wild') {
        matchesFormat = !standardSetIds.has(card.cardSetId);
      }

      const matchesSet = selectedSet === null || card.cardSetId === selectedSet;

      return matchesSearch && matchesClass && matchesFormat && matchesSet;
    });
  }, [cards, searchTerm, selectedClass, selectedFormat, selectedSet, standardSetIds, metadata]);

  const getClassName = (id: number) => {
    return classMappings[id] || metadata?.classes.find(c => c.id === id)?.name || `Class ${id}`;
  };

  const getSetName = (id: number) => {
    return metadata?.sets.find(s => s.id === id)?.name || `Set ${id}`;
  };

  const isStandard = (setId: number) => {
    return standardSetIds.has(setId);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-2">
            Hearthstone <span className="italic font-serif font-normal lowercase">Explorer</span>
          </h1>
          <p className="font-mono text-xs opacity-60 uppercase tracking-widest">
            Battle.net Game Data API Integration / v1.0
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase opacity-60 font-mono">Abzurufendes Format</label>
            <select
              value={fetchFormat || ''}
              onChange={(e) => setFetchFormat(e.target.value || null)}
              className="px-4 py-2 bg-transparent border border-[#141414] focus:outline-none focus:bg-white transition-all font-mono text-sm uppercase appearance-none"
            >
              <option value="">ALLE FORMATE</option>
              <option value="standard">STANDARD</option>
              <option value="wild">WILD</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase opacity-60 font-mono">Abzurufende Klasse</label>
            <select
              value={fetchClass || ''}
              onChange={(e) => setFetchClass(e.target.value || null)}
              className="px-4 py-2 bg-transparent border border-[#141414] focus:outline-none focus:bg-white transition-all font-mono text-sm uppercase appearance-none"
            >
              <option value="">ALLE KLASSEN</option>
              {metadata?.classes.map(c => (
                <option key={c.id} value={c.slug}>{c.name.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchAllCards}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[#141414] text-[#E4E3E0] hover:bg-opacity-90 transition-all disabled:opacity-50 uppercase font-mono text-sm tracking-tighter cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {loading ? 'Lade Karten...' : 'Karten abrufen'}
          </button>
          
          {cards.length > 0 && (
            <>
              <button
                onClick={exportJSON}
                className="flex items-center gap-2 px-6 py-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all uppercase font-mono text-sm tracking-tighter cursor-pointer"
              >
                <FileJson className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-6 py-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all uppercase font-mono text-sm tracking-tighter cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 md:p-10">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 border border-red-500 bg-red-50 text-red-700 font-mono text-sm"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="mb-12">
            <div className="flex justify-between font-mono text-xs uppercase mb-2">
              <span>Synchronisiere mit Blizzard Servern...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 bg-black/10 w-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#141414]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12 border-b border-[#141414] pb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input 
              type="text"
              placeholder="SUCHE NACH NAME ODER TEXT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-transparent border border-[#141414] focus:outline-none focus:bg-white transition-all font-mono text-sm uppercase"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : null)}
              className="w-full pl-10 pr-4 py-3 bg-transparent border border-[#141414] focus:outline-none focus:bg-white transition-all font-mono text-sm uppercase appearance-none"
            >
              <option value="">ALLE KLASSEN</option>
              {metadata?.classes.map(c => (
                <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <select
              value={selectedSet || ''}
              onChange={(e) => setSelectedSet(e.target.value ? Number(e.target.value) : null)}
              className="w-full pl-10 pr-4 py-3 bg-transparent border border-[#141414] focus:outline-none focus:bg-white transition-all font-mono text-sm uppercase appearance-none"
            >
              <option value="">ALLE SETS</option>
              {metadata?.sets
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(s => (
                  <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <select
              value={selectedFormat || ''}
              onChange={(e) => setSelectedFormat(e.target.value || null)}
              className="w-full pl-10 pr-4 py-3 bg-transparent border border-[#141414] focus:outline-none focus:bg-white transition-all font-mono text-sm uppercase appearance-none"
            >
              <option value="">ALLE FORMATE</option>
              <option value="standard">STANDARD</option>
              <option value="wild">WILD</option>
            </select>
          </div>

          <div className="flex items-center justify-end font-mono text-xs uppercase opacity-60">
            {filteredCards.length} Karten gefunden
          </div>
        </div>

        {/* Class Renaming UI */}
        {metadata && (
          <div className="mb-12 p-6 border border-[#141414]">
            <h2 className="font-bold uppercase tracking-widest mb-4">Export Klassen-Umbenennung</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metadata.classes.map(c => (
                <div key={c.id} className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase opacity-60 font-mono">{c.name}</label>
                  <input
                    type="text"
                    placeholder={c.name}
                    value={classMappings[c.id] || ''}
                    onChange={(e) => setClassMappings(prev => ({...prev, [c.id]: e.target.value}))}
                    className="px-3 py-2 bg-transparent border border-[#141414] focus:outline-none focus:bg-white transition-all font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-[80px_1.5fr_1fr_1fr_100px_100px] gap-4 p-4 border-b border-[#141414] font-serif italic text-xs uppercase opacity-50 tracking-widest">
              <div>ID</div>
              <div>Name</div>
              <div>Klasse</div>
              <div>Set</div>
              <div>Format</div>
              <div className="text-right">Mana</div>
            </div>

            {/* Table Body */}
            <div style={{ height: '70vh' }}>
              <Virtuoso
                data={filteredCards}
                itemContent={(index, card) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-[80px_1.5fr_1fr_1fr_100px_100px] gap-4 p-4 border-b border-[#141414]/10 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all cursor-pointer group bg-[#E4E3E0]"
                  >
                    <div className="font-mono text-xs opacity-50 group-hover:opacity-100">{card.id}</div>
                    <div className="font-bold tracking-tight uppercase flex items-center gap-2">
                      {card.name}
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <div className="font-mono text-xs uppercase">{getClassName(card.classId)}</div>
                    <div className="font-mono text-xs uppercase">{getSetName(card.cardSetId)}</div>
                    <div className="font-mono text-[10px] uppercase">
                      <span className={`px-2 py-0.5 border ${isStandard(card.cardSetId) ? 'border-green-500 text-green-600 group-hover:text-green-400' : 'border-amber-600 text-amber-700 group-hover:text-amber-400'}`}>
                        {isStandard(card.cardSetId) ? 'Standard' : 'Wild'}
                      </span>
                    </div>
                    <div className="text-right font-mono font-bold">{card.manaCost}</div>
                  </motion.div>
                )}
              />
            </div>

            {filteredCards.length === 0 && !loading && (
              <div className="p-20 text-center">
                <p className="font-serif italic text-2xl opacity-40 mb-4">Keine Karten gefunden.</p>
                <p className="font-mono text-xs uppercase opacity-40">
                  {cards.length === 0 ? 'Klicke auf "Alle Karten abrufen" um zu starten.' : 'Versuche es mit anderen Filtern.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 p-10 border-t border-[#141414] flex justify-between items-center opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]">
        <div>© 2026 Hearthstone Explorer</div>
        <div>Data provided by Blizzard Entertainment</div>
      </footer>
    </div>
  );
}
