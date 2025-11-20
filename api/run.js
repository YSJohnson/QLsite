// api/run.js

module.exports = async function handler(req, res) {
  // CORS 设置（允许你的域名）
  res.setHeader('Access-Control-Allow-Origin', 'https://ysjohnson.top'); // 或 '*' 测试用
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { taskId } = body;

  // 🔒 可选：白名单校验（推荐！）
  const ALLOWED_TASK_IDS = [41, 42, 43, 44, 40]; // ← 把你允许的脚本 ID 写在这里
  const TASK_ID_NUM = parseInt(taskId, 10);

  if (!taskId || isNaN(TASK_ID_NUM) || !ALLOWED_TASK_IDS.includes(TASK_ID_NUM)) {
    return res.status(400).json({ error: 'Invalid or unauthorized task ID' });
  }

  try {
    const QL_HOST = process.env.QL_HOST;
    const CLIENT_ID = process.env.CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;

    if (!QL_HOST || !CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    // Step 1: 获取 token
    const tokenUrl = `${QL_HOST}/open/auth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    const tokenRes = await fetch(tokenUrl, { method: 'GET' });

    const tokenText = await tokenRes.text();
    if (!tokenRes.ok) {
      console.error('Token fetch failed:', tokenText);
      return res.status(500).json({ error: 'Failed to get QingLong token', details: tokenText });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid token response format' });
    }

    const token = tokenData?.data?.token;
    if (!token) {
      return res.status(500).json({ error: 'Token not found in response' });
    }

    // Step 2: 触发任务（新版青龙：PUT + [id]）
    const runRes = await fetch(`${QL_HOST}/open/crons/run`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([TASK_ID_NUM]) // 注意：是数组！
    });

    const runBody = await runRes.text();
    if (!runRes.ok) {
      console.error('Run task failed:', runBody);
      return res.status(500).json({ error: 'Failed to trigger script', details: runBody });
    }

    // 成功！
    res.status(200).json({ success: true, message: `Task ${TASK_ID_NUM} triggered!` });

  } catch (error) {
    console.error('💥 Server error:', error.message);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
