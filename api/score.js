// ============================================================
// MI MAPA VITAL — API ENDPOINT V3.0
// Vercel Serverless Function
// Conexión Vital — Segundo Amanecer
// Jesús Trejo Álvarez — Arquitecto de Sistemas de Transición
// ============================================================
//
// ENDPOINT: POST /api/score
// BODY: { "Q1": 3, "Q2": 4, ..., "Q109": 2 }
// RESPONSE: JSON con 67 scores calculados
// ============================================================

// ── STATEMENTS INVERTIDOS (105 de 109 — CONFIRMADO) ─────────
const INV_STATEMENTS = [
  2,3,4,6,7,8,
  9,10,12,13,14,15,16,
  17,18,19,20,21,22,23,24,
  25,26,27,28,29,30,31,32,
  33,34,36,37,38,39,40,
  41,42,43,44,45,46,47,
  48,49,50,51,52,53,54,55,
  56,57,58,59,60,61,62,63,
  64,65,66,67,68,69,70,
  71,72,73,74,75,76,77,
  78,79,80,81,82,83,84,
  85,86,87,88,89,90,
  91,92,93,94,95,96,97,
  98,99,100,101,102,103,
  104,105,106,107,108,109,
];

// ── TABLAS DE PROFUNDIDAD ────────────────────────────────────
const TABLA_A = [1.0,1.3,1.7,2.2,2.8,3.2,3.4,3.4]; // 8 behaviors
const TABLA_B = [1.0,1.4,2.0,2.6,3.0,3.2,3.2];     // 7 behaviors
const TABLA_C = [1.0,1.6,2.4,3.0,3.3,3.3];          // 6 behaviors

// ── ARQUITECTURA 15 CELDAS ───────────────────────────────────
const CELDAS = [
  {id:'DES_FIS',etapa:'DES',riqueza:'FISICA',    qStart:1,  tabla:TABLA_A},
  {id:'DES_MEN',etapa:'DES',riqueza:'MENTAL',    qStart:9,  tabla:TABLA_A},
  {id:'DES_SOC',etapa:'DES',riqueza:'SOCIAL',    qStart:17, tabla:TABLA_A},
  {id:'DES_TEM',etapa:'DES',riqueza:'TEMPORAL',  qStart:25, tabla:TABLA_A},
  {id:'DES_FIN',etapa:'DES',riqueza:'FINANCIERA',qStart:33, tabla:TABLA_A},
  {id:'REC_FIS',etapa:'REC',riqueza:'FISICA',    qStart:41, tabla:TABLA_B},
  {id:'REC_MEN',etapa:'REC',riqueza:'MENTAL',    qStart:48, tabla:TABLA_A},
  {id:'REC_SOC',etapa:'REC',riqueza:'SOCIAL',    qStart:56, tabla:TABLA_A},
  {id:'REC_TEM',etapa:'REC',riqueza:'TEMPORAL',  qStart:64, tabla:TABLA_B},
  {id:'REC_FIN',etapa:'REC',riqueza:'FINANCIERA',qStart:71, tabla:TABLA_B},
  {id:'CLA_FIS',etapa:'CLA',riqueza:'FISICA',    qStart:78, tabla:TABLA_B},
  {id:'CLA_MEN',etapa:'CLA',riqueza:'MENTAL',    qStart:85, tabla:TABLA_C},
  {id:'CLA_SOC',etapa:'CLA',riqueza:'SOCIAL',    qStart:91, tabla:TABLA_B},
  {id:'CLA_TEM',etapa:'CLA',riqueza:'TEMPORAL',  qStart:98, tabla:TABLA_C},
  {id:'CLA_FIN',etapa:'CLA',riqueza:'FINANCIERA',qStart:104,tabla:TABLA_C},
];

// ── PESOS ────────────────────────────────────────────────────
const PESOS_RIQUEZA = {
  DES:{FISICA:0.25,MENTAL:0.25,SOCIAL:0.20,TEMPORAL:0.15,FINANCIERA:0.15},
  REC:{FISICA:0.20,MENTAL:0.30,SOCIAL:0.25,TEMPORAL:0.13,FINANCIERA:0.12},
  CLA:{FISICA:0.18,MENTAL:0.23,SOCIAL:0.27,TEMPORAL:0.17,FINANCIERA:0.15},
};
const PESOS_ETAPA = {DES:0.25, REC:0.40, CLA:0.35};

// ── BENCHMARKS V3.0 (recalibrar post-piloto) ─────────────────
const BENCHMARKS = {
  DES_FIS:3.6,DES_MEN:3.4,DES_SOC:3.2,DES_TEM:3.1,DES_FIN:3.1,
  REC_FIS:3.3,REC_MEN:3.4,REC_SOC:3.2,REC_TEM:3.2,REC_FIN:3.0,
  CLA_FIS:3.5,CLA_MEN:3.6,CLA_SOC:3.3,CLA_TEM:3.3,CLA_FIN:3.1,
};

// ── HELPERS ──────────────────────────────────────────────────
const pct  = s => s !== null ? Math.round(((s-1)/5)*100) : null;
const a110 = s => s !== null ? Math.round(((s-1)/5*9+1)*10)/10 : null;
const nivel = p => p >= 83 ? 'EXCELENCIA' : p >= 60 ? 'DOMINIO_AVANZADO'
                 : p >= 40 ? 'DOMINIO_INICIAL' : p >= 20 ? 'MINIMO_ACTIVO'
                 : 'MINIMO_INCIPIENTE';

// ── MOTOR PRINCIPAL ──────────────────────────────────────────
function calcularScores(resp) {
  // Paso A: validación
  const validas = resp.filter(r => r !== null && !isNaN(r) && r >= 1 && r <= 6);
  const faltantes = 109 - validas.length;
  if (faltantes > 20) return {error:'ASSESSMENT_INCOMPLETO', faltantes};

  // Paso B: inversión
  const base = resp.map((r,i) => {
    if (r === null || isNaN(r)) return null;
    return INV_STATEMENTS.includes(i+1) ? 7-r : r;
  });

  // Paso C: anti-gaming (Capa 4)
  const invIdx = INV_STATEMENTS.map(n=>n-1);
  const rInv   = invIdx.map(i=>resp[i]).filter(r=>r!==null&&!isNaN(r));
  const μInv   = rInv.reduce((s,r)=>s+r,0)/rInv.length;
  const σInv   = Math.sqrt(rInv.reduce((s,r)=>s+Math.pow(r-μInv,2),0)/rInv.length);
  const gaming = μInv < 1.8 && σInv < 0.8;
  const factor = gaming ? 0.85 : 1.0;

  // Capa 1: patrón plano
  const baseValidos = base.filter(s=>s!==null);
  const μBase = baseValidos.reduce((s,v)=>s+v,0)/baseValidos.length;
  const σBase = Math.sqrt(baseValidos.reduce((s,v)=>s+Math.pow(v-μBase,2),0)/baseValidos.length);
  const plano = σBase < 0.8;

  const adj = base.map(s => s !== null ? s*factor : null);

  // Paso E: scores por celda
  const sCelda={}, sPct={}, brecha={};
  CELDAS.forEach(c => {
    const t=c.tabla, n=t.length;
    let sw=0,wt=0;
    for(let i=0;i<n;i++){
      const v=adj[c.qStart-1+i];
      if(v!==null){sw+=v*t[i];wt+=t[i];}
    }
    const s = wt>0 ? sw/wt : null;
    sCelda[c.id]=s;
    sPct[c.id]=pct(s);
    brecha[c.id]=s!==null ? Math.round((s-BENCHMARKS[c.id])*100)/100 : null;
  });

  // Paso G: scores por etapa
  const sEtapa={};
  ['DES','REC','CLA'].forEach(e=>{
    const ces=CELDAS.filter(c=>c.etapa===e), pr=PESOS_RIQUEZA[e];
    let s=0,w=0;
    ces.forEach(c=>{if(sCelda[c.id]!==null){s+=sCelda[c.id]*pr[c.riqueza];w+=pr[c.riqueza];}});
    sEtapa[e]=w>0?s/w:null;
  });

  // Paso F: scores por riqueza
  const sRiq={};
  ['FISICA','MENTAL','SOCIAL','TEMPORAL','FINANCIERA'].forEach(r=>{
    const ces=CELDAS.filter(c=>c.riqueza===r);
    let s=0,w=0;
    ces.forEach(c=>{if(sCelda[c.id]!==null){s+=sCelda[c.id]*PESOS_ETAPA[c.etapa];w+=PESOS_ETAPA[c.etapa];}});
    sRiq[r]=w>0?s/w:null;
  });

  // Paso H: score global
  const g16 = sEtapa.DES!==null&&sEtapa.REC!==null&&sEtapa.CLA!==null
    ? sEtapa.DES*0.25+sEtapa.REC*0.40+sEtapa.CLA*0.35 : null;
  const gPct=pct(g16), g10=a110(g16);

  return {
    // Celdas (escala 1-6)
    DES_FIS:r2(sCelda.DES_FIS),DES_MEN:r2(sCelda.DES_MEN),DES_SOC:r2(sCelda.DES_SOC),
    DES_TEM:r2(sCelda.DES_TEM),DES_FIN:r2(sCelda.DES_FIN),
    REC_FIS:r2(sCelda.REC_FIS),REC_MEN:r2(sCelda.REC_MEN),REC_SOC:r2(sCelda.REC_SOC),
    REC_TEM:r2(sCelda.REC_TEM),REC_FIN:r2(sCelda.REC_FIN),
    CLA_FIS:r2(sCelda.CLA_FIS),CLA_MEN:r2(sCelda.CLA_MEN),CLA_SOC:r2(sCelda.CLA_SOC),
    CLA_TEM:r2(sCelda.CLA_TEM),CLA_FIN:r2(sCelda.CLA_FIN),
    // Porcentajes celda
    PCT_DES_FIS:sPct.DES_FIS,PCT_DES_MEN:sPct.DES_MEN,PCT_DES_SOC:sPct.DES_SOC,
    PCT_DES_TEM:sPct.DES_TEM,PCT_DES_FIN:sPct.DES_FIN,
    PCT_REC_FIS:sPct.REC_FIS,PCT_REC_MEN:sPct.REC_MEN,PCT_REC_SOC:sPct.REC_SOC,
    PCT_REC_TEM:sPct.REC_TEM,PCT_REC_FIN:sPct.REC_FIN,
    PCT_CLA_FIS:sPct.CLA_FIS,PCT_CLA_MEN:sPct.CLA_MEN,PCT_CLA_SOC:sPct.CLA_SOC,
    PCT_CLA_TEM:sPct.CLA_TEM,PCT_CLA_FIN:sPct.CLA_FIN,
    // Etapas
    PCT_DESPERTAR:pct(sEtapa.DES),PCT_RECONCILIACION:pct(sEtapa.REC),PCT_CLARIDAD:pct(sEtapa.CLA),
    // Riquezas
    PCT_FISICA:pct(sRiq.FISICA),PCT_MENTAL:pct(sRiq.MENTAL),PCT_SOCIAL:pct(sRiq.SOCIAL),
    PCT_TEMPORAL:pct(sRiq.TEMPORAL),PCT_FINANCIERA:pct(sRiq.FINANCIERA),
    // Global
    GLOBAL_16:r2(g16),GLOBAL_110:g10,GLOBAL_PCT:gPct,
    NIVEL:gPct!==null?nivel(gPct):null,
    // Brechas
    BRECHA_DES_FIS:brecha.DES_FIS,BRECHA_DES_MEN:brecha.DES_MEN,BRECHA_DES_SOC:brecha.DES_SOC,
    BRECHA_DES_TEM:brecha.DES_TEM,BRECHA_DES_FIN:brecha.DES_FIN,
    BRECHA_REC_FIS:brecha.REC_FIS,BRECHA_REC_MEN:brecha.REC_MEN,BRECHA_REC_SOC:brecha.REC_SOC,
    BRECHA_REC_TEM:brecha.REC_TEM,BRECHA_REC_FIN:brecha.REC_FIN,
    BRECHA_CLA_FIS:brecha.CLA_FIS,BRECHA_CLA_MEN:brecha.CLA_MEN,BRECHA_CLA_SOC:brecha.CLA_SOC,
    BRECHA_CLA_TEM:brecha.CLA_TEM,BRECHA_CLA_FIN:brecha.CLA_FIN,
    // Anti-gaming (metadata)
    GAMING:gaming,PATRON_PLANO:plano,
    GAMING_MU_INV:r2(μInv),GAMING_SIGMA_INV:r2(σInv),GAMING_FACTOR:factor,
    BANDERAS:[gaming?'GAMING_DETECTADO':null,plano?'PATRON_PLANO':null].filter(Boolean).join(',')||'SIN_BANDERAS',
    // Meta
    COMPLETITUD:faltantes===0?'COMPLETO':faltantes<=5?'CASI_COMPLETO':'PARCIAL',
    FALTANTES:faltantes,VERSION:'V3.0',
  };
}

function r2(v){return v!==null?Math.round(v*100)/100:null;}

// ── HANDLER VERCEL ───────────────────────────────────────────
export default function handler(req, res) {
  // CORS — permite Make.com
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed. Use POST.'});

  try {
    const body = req.body;

    // Construir array de 109 respuestas desde Q1...Q109
    const respuestas = [];
    for (let i = 1; i <= 109; i++) {
      const val = body[`Q${i}`];
      respuestas.push(val !== undefined && val !== null && val !== '' ? parseFloat(val) : null);
    }

    const result = calcularScores(respuestas);
    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({error: 'Internal error', detail: err.message});
  }
}
















