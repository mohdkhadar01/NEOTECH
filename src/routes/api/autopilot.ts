import { createFileRoute } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import { runAutopilotCrew } from '../../lib/ai/agents/crew';
import { saveSimulation } from '../../lib/db/mongo';
import type { AgentThought } from '../../lib/ai/agents/types';

export const Route = createFileRoute('/api/autopilot')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { idea } = await request.json() as { idea: string };
        const sessionId = nanoid(10);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (data: object) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            send({ type: 'session', sessionId });

            const allThoughts: AgentThought[] = [];

            try {
              const result = await runAutopilotCrew(idea, sessionId, (thought) => {
                allThoughts.push(thought);
                send({ type: 'thought', thought });
              });

              const saveObj: any = { type: 'autopilot', ...result };
              if (!saveObj.idea) saveObj.idea = idea;
              await saveSimulation(sessionId, saveObj);

              send({ type: 'complete', result });
            } catch (err: any) {
              send({ type: 'error', message: err.message || 'Unknown error' });
            } finally {
              controller.close();
            }
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
  }
});
