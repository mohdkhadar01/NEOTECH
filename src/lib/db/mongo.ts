import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || '';
let client: MongoClient | null = null;
let connectFailed = false;

async function getClient(): Promise<MongoClient | null> {
  if (connectFailed || !uri) return null;
  if (client) return client;
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    console.log('[mongo] Connected successfully');
    return client;
  } catch (err) {
    console.error('[mongo] Connection failed:', err);
    connectFailed = true;
    return null;
  }
}

const DB_NAME = process.env.MONGODB_DB_NAME || 'neoverse';

export async function saveSimulation(sessionId: string, data: object) {
  const c = await getClient();
  if (!c) return;
  try {
    await c.db(DB_NAME).collection('simulations').insertOne({
      session_id: sessionId,
      ...data,
      created_at: new Date()
    });
  } catch (err) { console.error('[mongo] saveSimulation failed:', err); }
}

export async function loadSimulation(sessionId: string) {
  const c = await getClient();
  if (!c) return null;
  try {
    return await c.db(DB_NAME).collection('simulations').findOne({ session_id: sessionId });
  } catch (err) { console.error('[mongo] loadSimulation failed:', err); return null; }
}

export async function updateSimulation(sessionId: string, update: object) {
  const c = await getClient();
  if (!c) return;
  try {
    await c.db(DB_NAME).collection('simulations').updateOne(
      { session_id: sessionId },
      { $set: update }
    );
  } catch (err) { console.error('[mongo] updateSimulation failed:', err); }
}

export async function saveBoardroomLog(sessionId: string, log: object) {
  const c = await getClient();
  if (!c) return;
  try {
    await c.db(DB_NAME).collection('boardroom_logs').insertOne({
      session_id: sessionId,
      ...log,
      timestamp: new Date()
    });
  } catch (err) { console.error('[mongo] saveBoardroomLog failed:', err); }
}

export async function saveAgentMemory(sessionId: string, memory: object) {
  const c = await getClient();
  if (!c) return;
  try {
    await c.db(DB_NAME).collection('agent_memories').insertOne({
      session_id: sessionId,
      ...memory,
      timestamp: new Date()
    });
  } catch (err) { console.error('[mongo] saveAgentMemory failed:', err); }
}

export async function saveBranch(sessionId: string, branch: object) {
  const c = await getClient();
  if (!c) return;
  try {
    await c.db(DB_NAME).collection('branches').insertOne({
      session_id: sessionId,
      ...branch,
      created_at: new Date()
    });
  } catch (err) { console.error('[mongo] saveBranch failed:', err); }
}

export async function getAllSessions() {
  const c = await getClient();
  if (!c) return [];
  try {
    return await c.db(DB_NAME).collection('simulations')
      .find({}, { projection: { session_id: 1, idea: 1, created_at: 1 } })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();
  } catch (err) { console.error('[mongo] getAllSessions failed:', err); return []; }
}
