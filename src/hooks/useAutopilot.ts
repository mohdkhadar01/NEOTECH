import { useState, useCallback, useRef } from 'react';
import type { AgentThought, AutopilotState, AgentName } from '../lib/ai/agents/types';

const AGENT_CONFIG: Record<AgentName, { emoji: string; color: string; description: string }> = {
  'Research Agent': { emoji: '🔍', color: '#2563EB', description: 'Scanning real market data' },
  'World Builder': { emoji: '🌍', color: '#7C3AED', description: 'Creating the ecosystem' },
  'Strategy Agent': { emoji: '📊', color: '#E8600A', description: 'Planning the path forward' },
  'Simulation Director': { emoji: '⚡', color: '#2D7A4F', description: 'Running the simulation' },
  'Chaos Agent': { emoji: '😈', color: '#C0392B', description: 'Injecting real crises' },
  'Critic Agent': { emoji: '🎯', color: '#FFB800', description: 'Challenging every decision' },
  'Reporter Agent': { emoji: '📝', color: '#1A1714', description: 'Writing the future reports' }
};

export function useAutopilot() {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<AutopilotState['phase']>('idle');
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentName | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AutopilotState | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [avatarText, setAvatarText] = useState('');
  const [avatarEmotion, setAvatarEmotion] = useState<'neutral'|'alert'|'happy'|'serious'|'excited'>('neutral');
  const abortControllerRef = useRef<AbortController | null>(null);

  const phaseMap: Record<AgentName, AutopilotState['phase']> = {
    'Research Agent': 'researching',
    'World Builder': 'building_world',
    'Strategy Agent': 'strategizing',
    'Simulation Director': 'simulating',
    'Chaos Agent': 'chaos',
    'Critic Agent': 'critiquing',
    'Reporter Agent': 'reporting'
  };

  const start = useCallback(async (idea: string) => {
    setIsRunning(true);
    setThoughts([]);
    setAgentStatuses({});
    setResult(null);
    setError('');
    setPhase('researching');
    setAvatarText('Initiating autopilot. Seven agents are now analyzing your startup.');
    setAvatarEmotion('serious');

    // Create AbortController to support cancellation/cleanup
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
        signal: controller.signal
      });

      if (!response.body) throw new Error('No stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Save the incomplete last line back to the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(cleanLine.slice(6));

            if (data.type === 'session') {
              setSessionId(data.sessionId);
            }

            if (data.type === 'thought') {
              const thought: AgentThought = data.thought;
              setThoughts(prev => [...prev, thought]);
              setActiveAgent(thought.agent);
              setPhase(phaseMap[thought.agent] || 'simulating');
              setAgentStatuses(prev => ({
                ...prev,
                [thought.agent]: thought.type === 'complete' ? 'done' : 'working'
              }));

              const emotionMap: Record<string, typeof avatarEmotion> = {
                insight: 'excited', decision: 'serious', conflict: 'alert',
                complete: 'happy', warning: 'serious', thinking: 'neutral'
              };
              setAvatarEmotion(emotionMap[thought.type] || 'neutral');
              if (thought.type !== 'thinking') setAvatarText(thought.message);
            }

            if (data.type === 'complete') {
              setResult(data.result);
              setPhase('complete');
              setAvatarText(data.result.reportData?.narrator_summary || 'Simulation complete.');
              setAvatarEmotion('happy');
              setIsRunning(false);
            }

            if (data.type === 'error') {
              setError(data.message);
              setAvatarText('An error occurred. Please check your API keys.');
              setAvatarEmotion('alert');
              setIsRunning(false);
            }
          } catch (e) {
            console.error('Failed to parse SSE line:', cleanLine, e);
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setError(e.message || 'Stream connection failed');
        setIsRunning(false);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
    setPhase('idle');
  }, []);

  return {
    isRunning, phase, thoughts, activeAgent, agentStatuses,
    result, sessionId, error, avatarText, avatarEmotion,
    agentConfig: AGENT_CONFIG,
    start, stop
  };
}
