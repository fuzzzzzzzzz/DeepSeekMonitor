const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const { upsertDailyUsage } = require('./db');

function parseCSV(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 去掉 UTF-8 BOM
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);

  // 如果文件包含 ZIP 头，先解压
  if (content.startsWith('PK')) {
    const tmpDir = path.join(os.tmpdir(), 'ds-csv-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    try {
      execSync(`unzip -o "${filePath}" -d "${tmpDir}"`, { stdio: 'pipe' });
    } catch {
      // unzip 可能不可用，尝试用 PowerShell
      try {
        execSync(`powershell -Command "Expand-Archive -Path '${filePath}' -DestinationPath '${tmpDir}' -Force"`, { stdio: 'pipe' });
      } catch {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        throw new Error('无法解压 ZIP 文件');
      }
    }
    const files = fs.readdirSync(tmpDir);
    const csvFile = files.find(f => f.endsWith('.csv'));
    if (!csvFile) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      throw new Error('ZIP 中没有找到 CSV 文件');
    }
    content = fs.readFileSync(path.join(tmpDir, csvFile), 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error('CSV 文件为空');

  const headers = parseCSVLine(lines[0]);
  const lower = headers.map(h => h.toLowerCase().replace(/[\s_]+/g, ''));

  // 列映射（DeepSeek 账单导出格式: user_id, utc_date, model, wallet_type, cost, currency）
  const idx = (keywords) => lower.findIndex(h => keywords.some(k => h.includes(k)));

  const colDate  = idx(['utcdate', 'date', '日期', '时间']);
  const colModel = idx(['model', '模型']);
  const colCost  = idx(['cost', 'amount', 'fee', '金额', '费用', '花费']);

  // 检测是否有 token 列（用量导出格式）
  const colInput  = idx(['prompttokens', 'inputtokens', '输入token', 'prompt_token', 'input_token']);
  const colOutput = idx(['completiontokens', 'outputtokens', '输出token', 'completion_token', 'output_token']);
  const colTotal  = idx(['totaltokens', '总token', 'total_token']);

  // 费用单位检测：csv 里的 cost 就是元，不是分
  let costNeedsDivision = false;
  const rawCostHeader = colCost >= 0 ? headers[colCost].toLowerCase() : '';
  if (rawCostHeader.includes('cent') || rawCostHeader.includes('分')) costNeedsDivision = true;

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;

    const date  = colDate  >= 0 ? normalizeDate(values[colDate])  : null;
    const model = colModel >= 0 ? normalizeModel(values[colModel]) : '';
    if (!date || !model) continue;

    const inputTokens  = colInput  >= 0 ? parseInteger(values[colInput])  : 0;
    const outputTokens = colOutput >= 0 ? parseInteger(values[colOutput]) : 0;
    const totalTokens  = colTotal  >= 0 ? parseInteger(values[colTotal])  : 0;
    const resolvedTokens = Math.max(totalTokens, inputTokens + outputTokens);

    let cost = colCost >= 0 ? parseFloat(values[colCost].replace(/[¥￥,，]/g, '').trim()) || 0 : 0;
    if (costNeedsDivision) cost = cost / 100;

    records.push({ date, model, tokensIn: inputTokens, tokensOut: outputTokens, cost });
  }

  return { records, headers };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function normalizeDate(val) {
  const raw = (val || '').trim();
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function normalizeModel(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('flash')) return 'v4-flash';
  if (n.includes('pro') || n.includes('reasoner')) return 'v4-pro';
  if (n.includes('chat')) return 'v4-flash';
  return '';
}

function parseInteger(raw) {
  const cleaned = (raw || '').replace(/[,，]/g, '').trim();
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : n;
}

function importCSV(filePath) {
  const { records } = parseCSV(filePath);
  let imported = 0;
  for (const r of records) {
    upsertDailyUsage(r.date, r.model, r.tokensIn, r.tokensOut, r.cost);
    imported++;
  }
  return imported;
}

function exportCSV(savePath, records) {
  const header = 'Date,Model,Tokens In,Tokens Out,Cost (¥)';
  const lines = records.map(r =>
    `${r.date},${r.model},${r.tokens_in || 0},${r.tokens_out || 0},${(r.cost || 0).toFixed(4)}`
  );
  fs.writeFileSync(savePath, header + '\n' + lines.join('\n'), 'utf8');
}

module.exports = { importCSV, exportCSV, parseCSV };
