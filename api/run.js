// api/run.js
export default async function handler(req, res) {
  // 允许跨域请求（只对你的 GitHub Pages 开放）
  res。setHeader('Access-Control-Allow-Origin'， 'https://yourname.github.io');
  res。setHeader('Access-Control-Allow-Methods'， 'GET, POST, OPTIONS');
  res。setHeader('Access-Control-Allow-Headers'， 'Authorization, Content-Type');

  // 处理预检请求（OPTIONS）
  if (req.method === 'OPTIONS') {
    return res。status(200)。end();
  }

  // 你的原有逻辑...
  const QL_HOST = process.env.QL_HOST;
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const TASK_ID = process。env。TASK_ID;

  if (!QL_HOST || !CLIENT_ID || !CLIENT_SECRET || !TASK_ID) {
    return res。status(500)。json({ error: "Missing environment variables" });
  }

  try {
    // 获取 token
    const tokenRes = await fetch(`${QL_HOST}/open/auth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`);
    const { data } = await tokenRes.json();
    
    // 触发任务
    await fetch(`${QL_HOST}/open/crons/run`， {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${data.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: [parseInt(TASK_ID)] })
    });

    res。status(200)。json({ success: true， message: "脚本已启动！" });
  } catch (error) {
    console.error("Error:", error);
    res。status(500).json({ success: false, message: "执行失败，请检查日志" });
  }
}
