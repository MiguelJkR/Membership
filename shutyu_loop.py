#!/usr/bin/env python3
"""Shutyu Revenue Loop — colector medible del funnel de Shutyu.
Lee Supabase (service_role de .env.local) -> funnel + MRR + fee plataforma (caja) + valor cliente
+ horas Tony. Escribe: metrics.json (ultimo), history.jsonl (serie), y una nota en el vault.
Corre diario (Tony_Shutyu_Loop). $0 real hasta Stripe LIVE + negocios onboarded a Connect.
"""
import os, json, urllib.request, datetime
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
ENV = r"D:\Dev\projects\shutyu\.env.local"
VAULT_NOTE = r"D:\Dev\Obsidian Vault\proyectos\shutyu\shutyu-23-metricas-loop.md"
OUT_JSON = os.path.join(BASE, "shutyu_metrics.json")
HIST = os.path.join(BASE, "shutyu_history.jsonl")

def load_env(p):
    e = {}
    for line in open(p, encoding="utf-8", errors="ignore"):
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1); e[k.strip()] = v.strip().strip('"').strip("'")
    return e

def q(url, key, path):
    req = urllib.request.Request(url + "/rest/v1/" + path,
        headers={"apikey": key, "Authorization": "Bearer " + key, "Accept": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=25).read().decode())

def monthly_cents(p):
    pc = p["price_cents"]; iv = (p.get("interval") or "month")
    return pc if iv == "month" else (pc/12.0 if iv == "year" else (pc*52/12.0 if iv == "week" else pc))

def collect():
    env = load_env(ENV)
    URL = env["NEXT_PUBLIC_SUPABASE_URL"]; KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
    FEE_BPS = int(env.get("PLATFORM_FEE_BPS", "1000"))
    live = env.get("STRIPE_SECRET_KEY", "").startswith("sk_live_")
    biz = q(URL, KEY, "businesses?select=id,name,listed,license_verified,stripe_account_id,created_at,state")
    mem = q(URL, KEY, "memberships?select=status,plan_id,started_at,saved_cents")
    plans = q(URL, KEY, "plans?select=id,price_cents,interval,active")
    led = q(URL, KEY, "ledger?select=kind,gross_cents,platform_fee_cents,net_cents,occurred_at")
    pp = {p["id"]: p for p in plans}
    active = [m for m in mem if m["status"] == "active"]
    mrr = sum(monthly_cents(pp[m["plan_id"]]) for m in active if m["plan_id"] in pp) / 100.0
    mstat = Counter(m["status"] for m in mem)
    saved = sum((m.get("saved_cents") or 0) for m in mem) / 100.0
    now = datetime.datetime.now(datetime.timezone.utc)
    def within(ts, d):
        if not ts: return False
        try: dd = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception: return False
        return (now - dd).days <= d
    gmv = sum(l["gross_cents"] for l in led) / 100.0
    fee = sum(l["platform_fee_cents"] for l in led) / 100.0
    fee30 = sum(l["platform_fee_cents"] for l in led if within(l.get("occurred_at"), 30)) / 100.0
    onboard = sum(1 for b in biz if b.get("stripe_account_id"))
    listed = sum(1 for b in biz if b.get("listed"))
    verified = sum(1 for b in biz if b.get("license_verified"))
    PROSPECTS, EMAILS = 159, 88
    tony_hours = round(EMAILS*6/60.0 + onboard*0.4 + 0.25*30, 1)
    # que falta para caja real
    blockers = []
    if not live: blockers.append("Stripe en TEST -> flip a LIVE (accion de Miguel: verificar cuenta)")
    if onboard == 0: blockers.append("0 negocios onboarded a Stripe Connect -> ninguno cobra real")
    real = live and onboard > 0
    return {
        "ts": now.isoformat(), "stripe_mode": "LIVE" if live else "TEST", "caja_real": real,
        "funnel": {"prospectos": PROSPECTS, "emails_enviados": EMAILS, "negocios_alta": len(biz),
                   "onboarded_stripe": onboard, "verificados": verified, "listados": listed,
                   "clientes": len(mem), "membresias_activas": len(active), "por_estado": dict(mstat)},
        "dinero_usd": {"MRR": round(mrr, 2), "ingreso_plataforma_MRR_mes": round(mrr*FEE_BPS/10000.0, 2),
                       "GMV_total": round(gmv, 2), "fee_plataforma_total": round(fee, 2),
                       "fee_plataforma_30d": round(fee30, 2), "ahorro_a_clientes": round(saved, 2), "fee_pct": FEE_BPS/100.0},
        "tony_horas_ahorradas": tony_hours,
        "desbloquea_caja_real": blockers,
    }

def write_note(r):
    d = r["dinero_usd"]; f = r["funnel"]
    tag = "🟢 CAJA REAL" if r["caja_real"] else "🟡 DEMO/TEST (aún no es plata real)"
    lines = [
        "---", "tags: [proyecto, tema/shutyu, tema/metricas, reference]",
        "estado: auto-generado", f"actualizado: {r['ts'][:16].replace('T',' ')}", "---", "",
        "# 📈 Shutyu Revenue Loop — métricas en vivo", "",
        f"> Auto-generado por `shutyu_loop.py` (diario). Fuente: Supabase real. Estado: **{tag}** · fee plataforma **{d['fee_pct']}%**.", "",
        "## 💵 Dinero", "",
        "| Métrica | USD |", "|---|--:|",
        f"| MRR (membresías activas) | ${d['MRR']:,.2f} |",
        f"| **Ingreso plataforma s/ MRR (mes)** | **${d['ingreso_plataforma_MRR_mes']:,.2f}** |",
        f"| GMV total (ledger) | ${d['GMV_total']:,.2f} |",
        f"| Fee plataforma total | ${d['fee_plataforma_total']:,.2f} |",
        f"| Fee plataforma 30d | ${d['fee_plataforma_30d']:,.2f} |",
        f"| Ahorro entregado a clientes | ${d['ahorro_a_clientes']:,.2f} |", "",
        "## 🔻 Funnel", "",
        "| Etapa | # |", "|---|--:|",
        f"| Prospectos (outreach) | {f['prospectos']} |",
        f"| Correos enviados (Tony) | {f['emails_enviados']} |",
        f"| Negocios dados de alta | {f['negocios_alta']} |",
        f"| Onboarded a Stripe Connect | {f['onboarded_stripe']} |",
        f"| Verificados / Listados | {f['verificados']} / {f['listados']} |",
        f"| Membresías activas | {f['membresias_activas']} |",
        f"| Por estado | {f['por_estado']} |", "",
        f"## ⏱ Tony ahorró ~**{r['tony_horas_ahorradas']} h** (outreach + onboarding + este loop)", "",
        "## 🔓 Qué desbloquea la caja real", "",
    ]
    for b in (r["desbloquea_caja_real"] or ["nada — ya hay caja real"]):
        lines.append(f"- [ ] {b}")
    lines += ["", "## 🔗 Relacionado", "- [[shutyu-22-infra-y-credenciales]] · [[shutyu-13-plan-maestro-app]] · [[tony-cerebro]]", ""]
    os.makedirs(os.path.dirname(VAULT_NOTE), exist_ok=True)
    open(VAULT_NOTE, "w", encoding="utf-8").write("\n".join(lines))

if __name__ == "__main__":
    r = collect()
    open(OUT_JSON, "w", encoding="utf-8").write(json.dumps(r, ensure_ascii=False, indent=1))
    open(HIST, "a", encoding="utf-8").write(json.dumps(r, ensure_ascii=False) + "\n")
    write_note(r)
    print(json.dumps({"stripe": r["stripe_mode"], "MRR": r["dinero_usd"]["MRR"],
                      "fee_mes": r["dinero_usd"]["ingreso_plataforma_MRR_mes"],
                      "activas": r["funnel"]["membresias_activas"], "onboarded": r["funnel"]["onboarded_stripe"],
                      "tony_h": r["tony_horas_ahorradas"]}, ensure_ascii=False))
    print("nota:", VAULT_NOTE)
