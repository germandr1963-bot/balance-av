const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// ── INGREDIENTES (archivo local, no cambia) ────────────────────────────────
const INGS_FILE = path.join(__dirname, 'ingredientes.json');
function leerIngs(){ return JSON.parse(fs.readFileSync(INGS_FILE,'utf8')); }
function guardarIngs(data){ fs.writeFileSync(INGS_FILE, JSON.stringify(data, null, 2)); }

// ── LIBROS (GitHub como almacenamiento persistente) ────────────────────────
const LIBROS_FILE = path.join(__dirname, 'libros.json');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'germandr1963-bot';
const GITHUB_REPO  = 'balance-av';
const GITHUB_PATH  = 'libros.json';

async function leerLibrosGitHub(){
  if(!GITHUB_TOKEN) return JSON.parse(fs.readFileSync(LIBROS_FILE,'utf8'));
  const r = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,{
    headers:{ Authorization:`token ${GITHUB_TOKEN}`, Accept:'application/vnd.github.v3+json' }
  });
  const d = await r.json();
  if(!d.content) throw new Error('No se pudo leer libros.json de GitHub: '+(d.message||''));
  return JSON.parse(Buffer.from(d.content,'base64').toString('utf8'));
}

async function guardarLibrosGitHub(data){
  // Guardar también en disco local (por si acaso durante el mismo ciclo de vida)
  fs.writeFileSync(LIBROS_FILE, JSON.stringify(data, null, 2));
  if(!GITHUB_TOKEN) return;

  // Obtener SHA actual del archivo (necesario para actualizar)
  const r1 = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,{
    headers:{ Authorization:`token ${GITHUB_TOKEN}`, Accept:'application/vnd.github.v3+json' }
  });
  const d1 = await r1.json();
  const sha = d1.sha;

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const r2 = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,{
    method:'PUT',
    headers:{ Authorization:`token ${GITHUB_TOKEN}`, Accept:'application/vnd.github.v3+json', 'Content-Type':'application/json' },
    body: JSON.stringify({ message:'[balance-av] actualizar libros', content, sha })
  });
  const d2 = await r2.json();
  if(!d2.content) throw new Error('Error al guardar en GitHub: '+(d2.message||''));
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const SYSTEM_PROMPT = `Eres el redactor técnico-nutricional de "Armonía y Vitalidad", marca española de nutrición cetogénica. Tu tarea es generar el Balance Nutricional del Día para el libro "Renacer Keto".

REGLAS ABSOLUTAS DE CONTENIDO:
1. Solo menciona vitaminas, minerales, compuestos bioactivos, antioxidantes y subtipos de fibra que tengan fuente real en los ingredientes proporcionados. Si no hay fuente, no lo incluyas.
2. Un ingrediente puede aparecer en varias secciones si cumple funciones distintas documentadas.
3. Una vitamina puede aparecer en vitaminas Y en antioxidantes si tiene ambas funciones (ejemplo: vitamina E es liposoluble Y antioxidante — va en ambas con enfoque diferente).
4. Si detectas un micronutriente, compuesto o antioxidante relevante no listado pero presente en los ingredientes, añádelo con el mismo formato.
5. En hierro, distingue siempre entre hemo (animal) y no hemo (vegetal).
6. Nunca inventes cifras de micronutrientes. Usa siempre la frase de descargo estándar.
7. Los porcentajes de macros deben sumar exactamente 100,00%.
8. No menciones ningún alimento que no aparezca en las comidas del día.
9. En proteínas, lista siempre primero las fuentes de origen animal.
10. Tono: profesional, riguroso pero accesible. Prohibido el lenguaje médico críptico o frases genéricas.

REGLAS TIPOGRÁFICAS OBLIGATORIAS:
Los siguientes términos deben ir siempre entre asteriscos dobles para cursiva: *carpaccio*, *ribeye*, *bratwurst*, *kale*, *cherry*, *portobello*, *shiitake*, *grass-fed*, *light*, *quark*, *fromage blanc*, *skyr*, *cottage*, *feta*, *mascarpone*, *mozzarella*, *ricotta*, *cheddar*, *havarti*, *provolone*, *ghee*, *tempeh*, *whey*.
Los siguientes términos llevan siempre mayúscula inicial: Frankfurt, Philadelphia, Roquefort, Kalamata, Burgos, Dijon, Vera, Brie, Camembert, Edam, Emmental, Gouda, Grana Padano, Gruyère, Brasil, California, Castilla, India.

FORMATO DE SALIDA — usa estos marcadores exactos que la app convertirá a RTF:
- Títulos de sección: ##Texto## (se convierte en negrita grande)
- Subtítulos: **Texto** (se convierte en negrita)
- Cursiva: *Texto* (se convierte en cursiva)
- Viñeta: comienza la línea con • 

ESTRUCTURA OBLIGATORIA:

##Balance nutricional del día [X]: [Enfoque Metabólico]##

[Párrafo de introducción — 80-100 palabras. Integrar: (1) proteínas y grasas principales priorizando origen animal y saciedad, (2) objetivo metabólico de esa combinación, (3) referencia breve a vegetales o frutos secos como vehículos de micronutrientes. Conectar ingrediente con beneficio. Prohibido frases genéricas.]

A continuación, un resumen de los principales aportes nutricionales de las comidas del día.

**Energía aportada por los alimentos**
• Calorías totales (aprox.): [X] kcal

**Macronutrientes: la base de la saciedad**

• **Grasas:** [X,XX] g | [X,XX] % de las calorías totales
[Fuentes específicas del recetario. Énfasis en producción de cetonas y estabilidad energética.]

• **Proteínas:** [X,XX] g | [X,XX] % de las calorías totales
[Fuentes de alto valor biológico, primero las animales. Énfasis en mantenimiento de tejido magro y síntesis de enzimas.]

• **Carbohidratos netos:** [X,XX] g | [X,XX] % de las calorías totales
[Fuentes vegetales de baja carga glucémica. Énfasis en aporte de volumen y micronutrientes sin comprometer cetosis.]

**Micronutrientes clave: nutrición con propósito**

Aunque no podemos dar cifras exactas sin un análisis de laboratorio, los ingredientes del día [X] son fuentes excelentes de:

**Vitaminas**

**Vitaminas liposolubles (A, D, E, K)**
[Solo las presentes. Formato: • Vitamina X (nombre técnico): ingredientes. Función en máximo 15 palabras.]

**Vitaminas hidrosolubles (complejo B y C)**
[Solo las presentes. Mismo formato.]

**Minerales**

**Macrominerales**
[Solo los presentes. Formato: • Mineral: ingredientes. Función en máximo 15 palabras.]

**Microminerales**
[Solo los presentes. Distinguir • Hierro hemo (animal) y • Hierro no hemo (vegetal) cuando ambos estén presentes.]

**El valor añadido plus de calidad**

**Grasas saludables y perfil lipídico**
• Grasas monoinsaturadas (MUFAs / ácido oleico): [ingredientes]. [función]
• Grasas saturadas (SFAs) y MCT: [ingredientes]. [función]
• Grasas poliinsaturadas (PUFAs):
• Omega-3 (ALA, EPA, DHA): [ingredientes]. [función]
• Omega-6 (ácido linoleico): [ingredientes]. [función]

**Fibra vegetal**
[Solo subtipos con fuente real. Base: fibra general, celulosa/hemicelulosas/lignina, pectinas/mucílagos/gomas, inulina/FOS/GOS, almidón resistente, beta-glucanos, quitina vegetal.]

**Compuestos bioactivos y antioxidantes**

**Compuestos bioactivos**
[Solo los presentes. Base: CLA, alicina, colina, fitosteroles, isoflavonas, polifenoles/flavonoides, probióticos/prebióticos, sulforafano.]
Formato: • Nombre: ingredientes. Función en máximo 15 palabras.

**Antioxidantes**
[Solo los presentes. Base: antocianinas, carotenoides, CoQ10, glutatión, SOD, vitamina C, vitamina E.]
Formato: • Nombre: ingredientes. Función en máximo 15 palabras.

[NOTA: Una nota práctica e inspiradora relacionada con los ingredientes o el objetivo metabólico del día. Máximo 2-3 líneas.]

**Conclusión del día**
[Párrafo de 6-7 líneas. Integrar: aporte metabólico del día, cobertura nutricional destacada, sinergia entre ingredientes principales, beneficio concreto para el lector principiante. Tono riguroso pero motivador.]`;


// ── GESTOR DE INGREDIENTES ─────────────────────────────────────────────────
app.get('/api/ingredientes', (req, res) => {
  try { res.json(leerIngs()); }
  catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/ingredientes/add', (req, res) => {
  try {
    const { n, g, p, c, t } = req.body;
    if (!n || t === undefined) return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    const ings = leerIngs();
    if (ings.find(i => i.n.toLowerCase() === n.toLowerCase()))
      return res.status(400).json({ error: 'Ya existe un ingrediente con ese nombre.' });
    ings.push({ n: n.trim(), g: parseFloat(g)||0, p: parseFloat(p)||0, c: parseFloat(c)||0, t: t.trim() });
    ings.sort((a,b) => a.n.localeCompare(b.n, 'es'));
    guardarIngs(ings);
    res.json({ ok: true, total: ings.length });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/ingredientes/edit', (req, res) => {
  try {
    const { nombre_original, n, g, p, c, t } = req.body;
    const ings = leerIngs();
    const idx = ings.findIndex(i => i.n.toLowerCase() === nombre_original.toLowerCase());
    if (idx === -1) return res.status(404).json({ error: 'Ingrediente no encontrado.' });
    ings[idx] = { n: n.trim(), g: parseFloat(g)||0, p: parseFloat(p)||0, c: parseFloat(c)||0, t: t.trim() };
    ings.sort((a,b) => a.n.localeCompare(b.n, 'es'));
    guardarIngs(ings);
    res.json({ ok: true });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/ingredientes/delete', (req, res) => {
  try {
    const { n } = req.body;
    const ings = leerIngs();
    const nuevos = ings.filter(i => i.n.toLowerCase() !== n.toLowerCase());
    if (nuevos.length === ings.length) return res.status(404).json({ error: 'Ingrediente no encontrado.' });
    guardarIngs(nuevos);
    res.json({ ok: true, total: nuevos.length });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ── GESTOR DE LIBROS ──────────────────────────────────────────────────────
app.get('/api/libros', async (req, res) => {
  try { res.json(await leerLibrosGitHub()); }
  catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/libros/edit', async (req, res) => {
  try {
    const { key, data } = req.body;
    const libros = await leerLibrosGitHub();
    if (!libros[key]) return res.status(404).json({ error: 'Libro no encontrado.' });
    const newKey = data._newKey || key;
    const { _newKey, ...cleanData } = data;
    if (newKey !== key) {
      if (libros[newKey]) return res.status(400).json({ error: 'Ya existe un libro con esa clave.' });
      libros[newKey] = { ...libros[key], ...cleanData };
      delete libros[key];
    } else {
      libros[key] = { ...libros[key], ...cleanData };
    }
    await guardarLibrosGitHub(libros);
    res.json({ ok: true, newKey });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/libros/add', async (req, res) => {
  try {
    const { key, data } = req.body;
    const libros = await leerLibrosGitHub();
    if (libros[key]) return res.status(400).json({ error: 'Ya existe un libro con esa clave.' });
    libros[key] = data;
    await guardarLibrosGitHub(libros);
    res.json({ ok: true });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/libros/delete', async (req, res) => {
  try {
    const { key } = req.body;
    const libros = await leerLibrosGitHub();
    if (!libros[key]) return res.status(404).json({ error: 'Libro no encontrado.' });
    delete libros[key];
    await guardarLibrosGitHub(libros);
    res.json({ ok: true });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  const correct = process.env.ACCESS_PASSWORD || 'keto2026';
  res.json({ ok: password === correct });
});

app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.content?.map(b => b.text || '').join('').trim();
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
