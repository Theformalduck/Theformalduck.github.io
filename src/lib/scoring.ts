interface Bullet    { id: string; text: string }
interface ExpEntry  { id: string; company: string; role: string; period: string; bullets: Bullet[] }
interface EduEntry  { id: string; school: string; degree: string; period: string; gpa: string }
interface Project   { id: string; name: string; desc: string; link: string; tags: string }
interface SkillGroup { id: string; category: string; items: string[] }

export interface ScoredResume {
  name: string; title: string; email: string; phone: string;
  location: string; website: string; linkedin: string; github: string;
  summary: string;
  experience: ExpEntry[];
  education: EduEntry[];
  skills: SkillGroup[];
  projects: Project[];
}

const ACTION_VERBS = [
  "engineer","built","led","develop","implement","optim","launch","ship",
  "design","architect","creat","manag","deploy","integrat","automat",
  "reduc","increas","improv","migrat","transform","scal","mentor",
  "collabor","establish","deliver","achiev","spearhead","drove","accelerat",
  "streamlin","coordinat","facilitat","generat","maintain","enhanc",
  "revamp","refactor","debug","analyz","monitor","configur","publish",
  "present","negoti","oversee","direct","execut","strategiz","pitch",
];

const METRIC_RE = /\d+%|\$[\d,]+|\d+x\b|\d{2,}[+k]?\b/i;

function scoreKeywords(d: ScoredResume): number {
  const allText = [
    d.summary,
    ...d.experience.flatMap(e => e.bullets.map(b => b.text)),
    ...d.projects.map(p => p.desc),
  ].join(" ").toLowerCase();
  let v = 0;
  for (const verb of ACTION_VERBS) if (allText.includes(verb)) v += 2;
  const skillItems = d.skills.flatMap(g => g.items).length;
  return Math.min(100,
    Math.min(60, v) +
    Math.min(25, skillItems * 2) +
    (d.linkedin ? 8 : 0) +
    (d.github   ? 7 : 0)
  );
}

function scoreImpact(d: ScoredResume): number {
  const bullets = d.experience.flatMap(e => e.bullets.map(b => b.text));
  if (bullets.length === 0) return 0;
  const q = bullets.filter(b => METRIC_RE.test(b)).length;
  return Math.min(100,
    Math.round((q / bullets.length) * 75) +
    (METRIC_RE.test(d.summary) ? 15 : 0) +
    (d.projects.some(p => METRIC_RE.test(p.desc)) ? 10 : 0)
  );
}

function scoreClarity(d: ScoredResume): number {
  return Math.min(100,
    (d.name.trim()     ? 15 : 0) +
    (d.email.trim()    ? 15 : 0) +
    (d.phone.trim()    ?  8 : 0) +
    (d.location.trim() ?  7 : 0) +
    (d.title.trim()    ? 10 : 0) +
    (d.summary.length >= 50  ? 20 : d.summary.length > 0 ? 8 : 0) +
    (d.summary.length >= 150 ? 10 : 0) +
    ((d.linkedin.trim() || d.website.trim()) ? 10 : 0) +
    (d.github.trim()   ?  5 : 0)
  );
}

function scoreFormatting(d: ScoredResume): number {
  const avgBullets = d.experience.length > 0
    ? d.experience.reduce((s, e) => s + e.bullets.length, 0) / d.experience.length
    : 0;
  return Math.min(100,
    (d.experience.length >= 1 ? 20 : 0) +
    (d.experience.length >= 2 ?  5 : 0) +
    (d.education.length  >= 1 ? 15 : 0) +
    (d.skills.length     >= 1 ? 15 : 0) +
    (d.projects.length   >= 1 ? 10 : 0) +
    (d.summary.trim()         ? 15 : 0) +
    (avgBullets >= 2 ? 10 : 0) +
    (avgBullets >= 3 ? 10 : 0)
  );
}

export function computeScore(d: ScoredResume) {
  const keywords   = scoreKeywords(d);
  const impact     = scoreImpact(d);
  const clarity    = scoreClarity(d);
  const formatting = scoreFormatting(d);
  const total = Math.round(keywords * 0.25 + impact * 0.30 + clarity * 0.25 + formatting * 0.20);
  return { total, keywords, impact, clarity, formatting };
}
