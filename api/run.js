// api/run.js —— 部署到 Vercel
export default async function handler(req, res) {
  // 🔐 允许你的 GitHub Pages 域名（改成你的！）
  const allowedOrigin = 'https://ysjohnson.top';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method allowed' });
  }

  let body;
  try {
    body = JSON.parse(req.body);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { taskId } = body;
  const TASK_ID_NUM = Number(taskId);

  // 🔒 白名单：只允许这些任务 ID（改成你的！）
  const ALLOWED_IDS = [40,41, 42, 43, 44];
  if (!taskId || isNaN(TASK_ID_NUM) || !ALLOWED_IDS.includes(TASK_ID_NUM)) {
    return res.status(400).json({ error: 'Invalid or unauthorized task ID' });
  }

  // 🌐 从环境变量读取青龙信息
  const QL_HOST = process.env.QL_HOST;
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;

  if (!QL_HOST || !CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'Missing env vars in Vercel' });
  }

  try {
    // 1️⃣ 获取 token
    const tokenRes = await fetch(
      `${QL_HOST}/open/auth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
    );
    const tokenData = await tokenRes.json();
    const token = tokenData?.data?.token;
    if (!token) throw new Error('Token missing');

    // 2️⃣ 触发任务（新版青龙：PUT + [id]）
    const runRes = await fetch(`${QL_HOST}/open/crons/run`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([TASK_ID_NUM]) // 注意：是数组！
    });

    const runData = await runRes.text();
    if (!runRes.ok) throw new Error(`Run failed: ${runData}`);

    res.status(200).json({ success: true, message: `Task ${TASK_ID_NUM} started!` });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}
