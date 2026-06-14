import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const simulateInput = z.object({
  action: z.string(),
  idea: z.string().optional(),
  mode: z.string().optional(),
  sessionId: z.string().optional(),
  agents: z.any().optional(),
  timelineSoFar: z.any().optional(),
  decisionPrompt: z.string().optional(),
  chosenOption: z.string().optional(),
  trigger: z.string().optional(),
  triggerMonth: z.number().optional(),
  userQuestion: z.string().optional(),
  currentMonth: z.number().optional(),
  agentId: z.string().optional(),
  simResult: z.any().optional(),
  chatHistory: z.any().optional(),
});

export const runSimulateAction = createServerFn({ method: "POST" })
  .inputValidator(simulateInput)
  .handler(async ({ data }): Promise<any> => {
    const { nanoid } = await import('nanoid');
    const sim = await import('../ai/simulate');
    const db = await import('../db/sqlite');

    const { action, idea, mode, sessionId, agents, timelineSoFar,
            decisionPrompt, chosenOption, trigger, triggerMonth,
            userQuestion, currentMonth, agentId, simResult, chatHistory } = data;

    const sid = sessionId || nanoid(10);

    const mock = await import('../ai/mockData');

    switch (action) {
      case 'simulate': {
        try {
          const result = await sim.runSimulation(idea!, mode as any);
          await db.saveSimulation(sid, { idea, mode, ...result });
          return { ...result, session_id: sid };
        } catch (e) {
          console.warn('[simulate] LLM simulation generation failed, using mock data...', e);
          const result = mock.mockSimulation(idea!, mode || 'founder');
          await db.saveSimulation(sid, { idea, mode, ...result });
          return { ...result, session_id: sid };
        }
      }

      case 'agents': {
        try {
          return await sim.generateAgents(idea!);
        } catch (e) {
          console.warn('[simulate] Generate agents failed, using mock agents...', e);
          const mockSim = mock.mockSimulation(idea!, 'founder');
          return mockSim.agents;
        }
      }

      case 'boardroom': {
        try {
          const result = await sim.runBoardroom(idea!, trigger!, triggerMonth!, agents, timelineSoFar);
          await db.saveBoardroomLog(sid, result);
          return result;
        } catch (e) {
          console.warn('[simulate] Boardroom generation failed, using mock data...', e);
          const result = mock.mockBoardroom(idea!, trigger!, triggerMonth!, agents || []);
          await db.saveBoardroomLog(sid, result);
          return result;
        }
      }

      case 'chaos': {
        try {
          const result = await sim.triggerChaos(idea!, currentMonth!, agents, timelineSoFar);
          await db.updateSimulation(sid, {
            chaos_events: result,
            [`chaos_${currentMonth}`]: result
          });
          return result;
        } catch (e) {
          console.warn('[simulate] Chaos generation failed, using mock data...', e);
          const result = mock.mockChaos(idea!, currentMonth!, agents || []);
          await db.updateSimulation(sid, {
            chaos_events: result,
            [`chaos_${currentMonth}`]: result
          });
          return result;
        }
      }

      case 'branch': {
        try {
          const result = await sim.branchDecision(idea!, timelineSoFar, decisionPrompt!, chosenOption!);
          await db.saveBranch(sid, result);
          await db.saveAgentMemory(sid, {
            month: timelineSoFar?.length || 0,
            decision: decisionPrompt,
            choice: chosenOption,
            branch_id: result.branch_id
          });
          return result;
        } catch (e) {
          console.warn('[simulate] Branch decision failed, using mock data...', e);
          const result = mock.mockBranch(idea!, timelineSoFar || [], decisionPrompt!, chosenOption!);
          await db.saveBranch(sid, result);
          await db.saveAgentMemory(sid, {
            month: timelineSoFar?.length || 0,
            decision: decisionPrompt,
            choice: chosenOption,
            branch_id: result.branch_id
          });
          return result;
        }
      }

      case 'marketing': {
        try {
          return await sim.runMarketingLab(idea!);
        } catch (e) {
          console.warn('[simulate] Marketing Lab failed, using mock data...', e);
          return mock.mockMarketing(idea!);
        }
      }

      case 'future_founder': {
        let simulation = await db.loadSimulation(sid);
        if (!simulation && simResult) {
          simulation = simResult;
          // Cache it in the database for subsequent questions
          await db.saveSimulation(sid, simResult);
        }
        if (!simulation) {
          return { answer: "I can't find that simulation. Try running one first." };
        }
        try {
          const answer = await sim.futureFounding(idea!, simulation as any, [], userQuestion!, chatHistory);
          return { answer };
        } catch (e) {
          console.warn('[simulate] Future Founder failed, using mock data...', e);
          const answer = mock.mockFutureFounder(idea!, userQuestion!);
          return { answer };
        }
      }

      case 'load': {
        return await db.loadSimulation(sid);
      }

      case 'sessions': {
        return await db.getAllSessions();
      }

      case 'elevenlabs_signed_url': {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const targetAgentId = agentId || 'agent_2501kv2hf52vef7vp3zpkzy2var5';
        if (!apiKey) {
          throw new Error('No ElevenLabs API key found in server environment');
        }

        // Fetch WebRTC token
        let token = null;
        try {
          const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${targetAgentId}`,
            { headers: { 'xi-api-key': apiKey } }
          );
          if (response.ok) {
            const resJson = await response.json();
            token = resJson.token;
          }
        } catch (e) {
          console.error('[elevenlabs token fetch error]', e);
        }

        // Fetch WebSocket signed URL
        let signedUrl = null;
        try {
          const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${targetAgentId}`,
            { headers: { 'xi-api-key': apiKey } }
          );
          if (response.ok) {
            const resJson = await response.json();
            signedUrl = resJson.signed_url;
          }
        } catch (e) {
          console.error('[elevenlabs signed url fetch error]', e);
        }

        if (!token && !signedUrl) {
          throw new Error('Could not retrieve credentials from ElevenLabs API.');
        }

        return { token, signedUrl };
      }

      default:
        throw new Error('Unknown action: ' + action);
    }
  });

export const runTtsAction = createServerFn({ method: "POST" })
  .inputValidator(z.object({ text: z.string() }))
  .handler(async ({ data }) => {
    const sarvamApiKey = process.env.SARVAM_API_KEY;
    if (sarvamApiKey) {
      try {
        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'api-subscription-key': sarvamApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: data.text.slice(0, 500),
            target_language_code: 'en-IN',
            speaker: 'shubh',
            speech_format: 'wav'
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.audios && resJson.audios[0]) {
            return {
              audio: resJson.audios[0],
              contentType: 'audio/wav'
            };
          }
        }
      } catch (err) {
        console.error('[sarvam tts error]', err);
      }
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return { audio: null, error: 'No TTS key available' };
    }

    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: data.text.slice(0, 500),
            model_id: 'eleven_turbo_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.8 }
          })
        }
      );

      if (!res.ok) {
        return { audio: null, error: 'ElevenLabs request failed' };
      }

      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return { audio: base64, contentType: 'audio/mpeg' };
    } catch {
      return { audio: null, error: 'TTS unavailable' };
    }
  });
