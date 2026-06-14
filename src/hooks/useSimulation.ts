import { useState, useCallback } from 'react';
import { runSimulateAction } from '../lib/api/simulate.functions';
import type {
  SimResult, SimEvent, MarketingResult,
  BoardroomSession, ChaosEvent, SimMode
} from '../lib/ai/types';

export function useSimulation() {
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState<SimResult | null>(null);
  const [marketingResult, setMarketingResult] = useState<MarketingResult | null>(null);
  const [boardroomSession, setBoardroomSession] = useState<BoardroomSession | null>(null);
  const [chaosEvent, setChaosEvent] = useState<ChaosEvent | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [currentIdea, setCurrentIdea] = useState('');
  const [avatarText, setAvatarText] = useState('');
  const [avatarEmotion, setAvatarEmotion] = useState<'neutral' | 'alert' | 'happy' | 'serious' | 'excited'>('neutral');
  const [error, setError] = useState('');
  const [showBoardroom, setShowBoardroom] = useState(false);
  const [showChaos, setShowChaos] = useState(false);
  const [showFutureFounder, setShowFutureFounder] = useState(false);
  const [activeEvent, setActiveEvent] = useState<SimEvent | null>(null);

  const call = async (action: string, body: Record<string, any> = {}) => {
    return runSimulateAction({ data: { action, sessionId, ...body } });
  };

  const simulate = useCallback(async (idea: string, mode: SimMode) => {
    setLoading(true); setError('');
    setCurrentIdea(idea);
    setLoadingMsg('Analyzing your idea...');
    setAvatarText('Give me a moment. I am building your entire world from scratch.');
    setAvatarEmotion('neutral');
    try {
      const data = await call('simulate', { idea, mode }) as SimResult & { session_id: string };
      setResult(data);
      setSessionId(data.session_id);
      setAvatarText(data.timeline?.[0]?.narrator_line || 'Your simulation is ready.');
      setAvatarEmotion('happy');
      return data;
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      setAvatarText('The simulation encountered an error. Check your API key.');
      setAvatarEmotion('serious');
      console.error('[simulate error]', e);
    } finally { setLoading(false); setLoadingMsg(''); }
  }, [sessionId]);

  const openBoardroom = useCallback(async (trigger: string, triggerMonth: number) => {
    if (!result) return;
    setLoading(true);
    setAvatarText('Gathering the stakeholders. The boardroom awaits.');
    setAvatarEmotion('serious');
    try {
      const data = await call('boardroom', {
        idea: currentIdea,
        trigger, triggerMonth,
        agents: result.agents,
        timelineSoFar: result.timeline
      }) as BoardroomSession;
      setBoardroomSession(data);
      setShowBoardroom(true);
      setAvatarText(data.narrator_line);
    } finally { setLoading(false); }
  }, [result, currentIdea, sessionId]);

  const initiateChaos = useCallback(async () => {
    if (!result) return;
    setLoading(true);
    setAvatarText('Everything just changed. Brace yourself.');
    setAvatarEmotion('alert');
    try {
      const data = await call('chaos', {
        idea: currentIdea,
        currentMonth: result.timeline.length * 2,
        agents: result.agents,
        timelineSoFar: result.timeline
      }) as ChaosEvent;
      setChaosEvent(data);
      setShowChaos(true);
      setAvatarText(data.narrator_line);
    } finally { setLoading(false); }
  }, [result, currentIdea, sessionId]);

  const makeDecision = useCallback(async (decisionPrompt: string, chosenOption: string) => {
    if (!result) return;
    setLoading(true);
    setAvatarText(`${chosenOption}. Interesting. Let me show you what happens next.`);
    setAvatarEmotion('serious');
    try {
      const data = await call('branch', {
        idea: currentIdea,
        timelineSoFar: result.timeline,
        decisionPrompt, chosenOption
      }) as any;
      setResult(prev => prev ? {
        ...prev,
        timeline: [...prev.timeline, ...(data.timeline || [])],
        outcome: data.outcome || prev.outcome
      } : prev);
      setAvatarText(data.timeline?.[0]?.narrator_line || 'The future shifts.');
      setAvatarEmotion((data.outcome?.survival_probability ?? 50) > 60 ? 'happy' : 'alert');
    } finally { setLoading(false); }
  }, [result, currentIdea, sessionId]);


  const analyzeMarketing = useCallback(async (idea: string) => {
    setLoading(true); setCurrentIdea(idea);
    setLoadingMsg('Scanning the competitive landscape...');
    setAvatarText('Scanning the competitive landscape. Give me a moment.');
    setAvatarEmotion('neutral');
    try {
      const data = await call('marketing', { idea }) as MarketingResult;
      setMarketingResult(data);
      setAvatarText(data.narrator_line);
      setAvatarEmotion('serious');
      return data;
    } finally { setLoading(false); setLoadingMsg(''); }
  }, []);

  const speakEvent = useCallback((event: SimEvent) => {
    setActiveEvent(event);
    setAvatarText(event.narrator_line);
    const map: Record<string, typeof avatarEmotion> = {
      milestone: 'happy', crisis: 'alert', attack: 'alert',
      chaos: 'alert', decision: 'serious', outcome: 'neutral'
    };
    setAvatarEmotion(map[event.type] || 'neutral');
  }, []);

  const loadSession = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const data = await runSimulateAction({ data: { action: 'load', sessionId: sid } }) as any;
      if (data) {
        setResult(data as SimResult);
        setSessionId(sid);
        setCurrentIdea(data.idea || '');
        setAvatarText('Session restored. Let\'s continue where we left off.');
        setAvatarEmotion('happy');
      }
    } catch {
      setError('Failed to load session');
    } finally { setLoading(false); }
  }, []);

  const absorbChaos = useCallback(() => {
    if (!chaosEvent || !result) return;
    const chaosEvents = chaosEvent.continuation_events || [];
    setResult(prev => prev ? {
      ...prev,
      timeline: [...prev.timeline, ...chaosEvents]
    } : prev);
    setShowChaos(false);
  }, [chaosEvent, result]);

  return {
    loading, loadingMsg, result, marketingResult,
    boardroomSession, chaosEvent, sessionId, currentIdea,
    avatarText, avatarEmotion, error, activeEvent,
    showBoardroom, showChaos, showFutureFounder,
    setShowBoardroom, setShowChaos, setShowFutureFounder,
    simulate, openBoardroom, initiateChaos, makeDecision,
    analyzeMarketing, speakEvent, loadSession, absorbChaos
  };
}
