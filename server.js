const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const INGS_FILE = path.join(__dirname, 'ingredientes.json');
function leerIngs(){ return JSON.parse(fs.readFileSync(INGS_FILE,'utf8')); }
function guardarIngs(data){ fs.writeFileSync(INGS_FILE, JSON.stringify(data, null, 2)); }
const LIBROS_FILE = path.join(__dirname, 'libros.json');
function leerLibros(){ return JSON.parse(fs.readFileSync(LIBROS_FILE,'utf8')); }
function guardarLibros(data){ fs.writeFileSync(LIBROS_FILE, JSON.stringify(data, null, 2)); }
const ITALICS_FILE = path.join(__dirname, 'italics.json');
function leerItalics(){ return JSON.parse(fs.readFileSync(ITALICS_FILE,'utf8')); }
function guardarItalics(data){ fs.writeFileSync(ITALICS_FILE, JSON.stringify(data, null, 2)); }
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function buildSystemPrompt(){
  const it = leerItalics();
  const cursiva = it.cursiva.map(t=>`*${t}*`).join(', ');
  const cursivaMayuscula = (it['cursiva-mayuscula']||[]).map(t=>`*${t}*`).join(', ');
  const mayusculaRedonda = (it['mayuscula-redonda']||[]).join(', ');
  return `Eres el redactor técnico-nutricional de "Armonía y Vitalidad", marca española de nutrición cetogénica. Tu tarea es generar el Balance Nutricional del Día para el libro "Renacer Keto".

REGLAS ABSOLUTAS DE CONTENIDO:
1. Solo menciona vitaminas, minerales, compuestos bioactivos, antioxidantes y subtipos de fibra que tengan fuente real en los ingredientes proporcionados. Si no hay fuente, no lo incluyas.
2. Un ingrediente puede aparecer en varias secciones si cumple funciones distintas documentadas.
3. Una vitamina puede aparecer en vitaminas Y en antioxidantes si tiene ambas funciones (ejemplo: vitamina E es liposoluble Y antioxidante — va en ambas con enfoque diferente).
4. Si detectas un micronutriente, compuesto o antioxidante relevante no listado pero presente en los ingredientes, añádelo con el mismo formato.
5. En hierro, distingue siempre entre hemo (animal) y no hemo (vegetal).
6. Nunca inventes cifras de micronutrientes. Usa siempre la frase de descargo estándar.
7. Los porcentajes de macros deben sumar exactamente 100,00%.
8. REGLA ABSOLUTA: No menciones ningún alimento que no aparezca en las comidas del día. Está terminantemente prohibido citar un ingrediente ausente aunque sea para aclarar que no está presente. Si no está en la lista de ingredientes del día, no existe para este documento.
9. En proteínas, lista siempre primero las fuentes de origen animal.
10. Tono: profesional, riguroso pero accesible. Prohibido el lenguaje médico críptico o frases genéricas.
11. Cada balance debe ser único. La introducción y la conclusión deben redactarse con vocabulario, estructura de frases y enfoque distintos a los de cualquier otro día. Prohibido reutilizar frases, expresiones o estructuras de apertura y cierre entre días.

REGLAS TIPOGRÁFICAS OBLIGATORIAS:
Los siguientes términos van siempre en cursiva, mayúscula solo si abren frase: ${cursiva}.
Los siguientes términos van en cursiva y siempre con mayúscula inicial: ${cursivaMayuscula}.
Los siguientes términos van en redonda y siempre con mayúscula inicial: ${mayusculaRedonda}.

FORMATO DE SALIDA — usa estos marcadores exactos que la app convertirá a RTF:
- Títulos de sección: ##Texto## (se convierte en negrita grande)
- Subtítulos: **Texto** (se convierte en negrita)
- Cursiva: *Texto* (se convierte en cursiva)
- Viñeta: comienza la línea con • 

ESTRUCTURA OBLIGATORIA:

##Balance nutricional del día [X]##

**[Enfoque Metabólico del día — título breve y descriptivo, máximo 6 palabras]**

**Enfoque del día**
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
[OBLIGATORIO — nunca omitir. Párrafo de 6-7 líneas redactado con los ingredientes reales del día. Integrar: aporte metabólico del día, cobertura nutricional destacada, sinergia entre los ingredientes principales presentes, beneficio concreto para el lector principiante. Tono riguroso pero motivador. Prohibido usar datos genéricos o de otros días.]

*Documento elaborado por el Departamento Técnico-Nutricional de **Armonía y Vitalidad**. Información con fines divulgativos y educativos; no sustituye el consejo de un profesional sanitario cualificado.*`;
}


// ── GESTOR DE INGREDIENTES ─────────────────────────────────────────────────
app.get('/api/ingredientes', (req, res) => {
  try { res.json(leerIngs()); }
  catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/ingredientes/add', (req, res) => {
  try {
    const { n, g, p, c, t, grupo, estado, fuente, usda_id, ciqual_id, comentario, url } = req.body;
    if (!n || t === undefined) return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    const ings = leerIngs();
    if (ings.find(i => i.n.toLowerCase() === n.toLowerCase()))
      return res.status(400).json({ error: 'Ya existe un ingrediente con ese nombre.' });
    const ing = { n: n.trim(), g: parseFloat(g)||0, p: parseFloat(p)||0, c: parseFloat(c)||0, t: t.trim() };
    if (grupo) ing.grupo = grupo.trim();
    if (estado) ing.estado = estado.trim();
    if (fuente) ing.fuente = fuente.trim();
    if (usda_id) ing.usda_id = usda_id.trim();
    if (ciqual_id) ing.ciqual_id = ciqual_id.trim();
    if (comentario) ing.comentario = comentario.trim();
    if (url) ing.url = url.trim();
    ings.push(ing);
    ings.sort((a,b) => a.n.localeCompare(b.n, 'es'));
    guardarIngs(ings);
    res.json({ ok: true, total: ings.length });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/ingredientes/edit', (req, res) => {
  try {
    const { nombre_original, n, g, p, c, t, grupo, estado, fuente, usda_id, ciqual_id, comentario, url } = req.body;
    const ings = leerIngs();
    const idx = ings.findIndex(i => i.n.toLowerCase() === nombre_original.toLowerCase());
    if (idx === -1) return res.status(404).json({ error: 'Ingrediente no encontrado.' });
    const ing = { n: n.trim(), g: parseFloat(g)||0, p: parseFloat(p)||0, c: parseFloat(c)||0, t: t.trim() };
    if (grupo !== undefined) ing.grupo = grupo ? grupo.trim() : '';
    if (estado !== undefined) ing.estado = estado ? estado.trim() : '';
    if (fuente !== undefined) ing.fuente = fuente ? fuente.trim() : '';
    if (usda_id !== undefined) ing.usda_id = usda_id ? usda_id.trim() : '';
    if (ciqual_id !== undefined) ing.ciqual_id = ciqual_id ? ciqual_id.trim() : '';
    if (comentario !== undefined) ing.comentario = comentario ? comentario.trim() : '';
    if (url !== undefined) ing.url = url ? url.trim() : '';
    ings[idx] = ing;
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

// ── BUSCADOR USDA ─────────────────────────────────────────────────────────
app.get('/api/usda/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta el término de búsqueda.' });
  const usdaKey = process.env.USDA_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!usdaKey) return res.status(500).json({ error: 'USDA API key no configurada.' });
  try {
    // 1. Traducir al inglés con Claude
    let queryEn = q;
    if (anthropicKey) {
      try {
        const tr = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 60,
            messages: [{ role: 'user', content: `Traduce este nombre de alimento al inglés para buscar en la base de datos USDA. Responde SOLO con la traducción, sin explicaciones ni puntuación: "${q}"` }]
          })
        });
        const trData = await tr.json();
        if (trData.content && trData.content[0]) queryEn = trData.content[0].text.trim();
      } catch(e) { queryEn = q; }
    }

    // 2. Buscar en USDA con término en inglés
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(queryEn)}&dataType=Foundation,SR%20Legacy&pageSize=10&api_key=${usdaKey}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!data.foods) return res.json({ results: [], traduccion: queryEn });

    // 3. Traducir nombres de resultados al español con Claude
    const nombresEn = data.foods.map(f => f.description);
    let nombresEs = nombresEn;
    if (anthropicKey) {
      try {
        const tr2 = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 400,
            messages: [{ role: 'user', content: `Traduce estos nombres de alimentos al español para una base de datos nutricional española. Responde SOLO con un JSON array de strings en el mismo orden, sin explicaciones: ${JSON.stringify(nombresEn)}` }]
          })
        });
        const tr2Data = await tr2.json();
        if (tr2Data.content && tr2Data.content[0]) {
          const txt = tr2Data.content[0].text.trim().replace(/```json|```/g,'').trim();
          nombresEs = JSON.parse(txt);
        }
      } catch(e) { nombresEs = nombresEn; }
    }

    const results = data.foods.map((f, i) => {
      const nutrients = {};
      (f.foodNutrients || []).forEach(n => {
        if (n.nutrientId === 1003 || n.nutrientName === 'Protein') nutrients.p = Math.round(n.value * 100) / 100;
        if (n.nutrientId === 1004 || n.nutrientName === 'Total lipid (fat)') nutrients.g = Math.round(n.value * 100) / 100;
        if (n.nutrientId === 1005 || n.nutrientName === 'Carbohydrate, by difference') nutrients.c_total = Math.round(n.value * 100) / 100;
        if (n.nutrientId === 1079 || n.nutrientName === 'Fiber, total dietary') nutrients.fibra = Math.round(n.value * 100) / 100;
      });
      const c = Math.max(0, Math.round(((nutrients.c_total || 0) - (nutrients.fibra || 0)) * 100) / 100);
      return {
        usda_id: String(f.fdcId),
        n: nombresEs[i] || f.description,
        n_original: f.description,
        p: nutrients.p || 0,
        g: nutrients.g || 0,
        c: c,
        fuente: `USDA ${f.fdcId}`
      };
    });
    res.json({ results, traduccion: queryEn });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── ACTUALIZACIÓN MASIVA POR USDA_ID ─────────────────────────────────────
app.post('/api/usda/update', async (req, res) => {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'USDA API key no configurada.' });
  try {
    const ings = leerIngs();
    const conId = ings.filter(i => i.usda_id && i.fuente === 'USDA');
    if (conId.length === 0) return res.json({ ok: true, actualizados: 0, mensaje: 'No hay ingredientes con USDA ID.' });
    let actualizados = 0;
    const errores = [];
    for (const ing of conId) {
      try {
        const url = `https://api.nal.usda.gov/fdc/v1/food/${ing.usda_id}?api_key=${apiKey}`;
        const r = await fetch(url);
        const data = await r.json();
        if (!data.foodNutrients) continue;
        const nutrients = {};
        data.foodNutrients.forEach(n => {
          if (n.nutrient && (n.nutrient.id === 1003 || n.nutrient.name === 'Protein')) nutrients.p = Math.round(n.amount * 100) / 100;
          if (n.nutrient && (n.nutrient.id === 1004 || n.nutrient.name === 'Total lipid (fat)')) nutrients.g = Math.round(n.amount * 100) / 100;
          if (n.nutrient && (n.nutrient.id === 1005 || n.nutrient.name === 'Carbohydrate, by difference')) nutrients.c_total = Math.round(n.amount * 100) / 100;
          if (n.nutrient && (n.nutrient.id === 1079 || n.nutrient.name === 'Fiber, total dietary')) nutrients.fibra = Math.round(n.amount * 100) / 100;
        });
        const c = Math.max(0, Math.round(((nutrients.c_total || 0) - (nutrients.fibra || 0)) * 100) / 100);
        const idxs = ings.reduce((acc, item, i) => { if (item.usda_id === ing.usda_id) acc.push(i); return acc; }, []);
        idxs.forEach(idx => {
          if (nutrients.p !== undefined) ings[idx].p = nutrients.p;
          if (nutrients.g !== undefined) ings[idx].g = nutrients.g;
          ings[idx].c = c;
          actualizados++;
        });
      } catch(e) { errores.push(ing.n); }
    }
    guardarIngs(ings);
    res.json({ ok: true, actualizados, errores });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── BUSCAR EN USDA POR ID ─────────────────────────────────────────────────
app.get('/api/usda/by-id', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Falta el ID.' });
  const usdaKey = process.env.USDA_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!usdaKey) return res.status(500).json({ error: 'USDA API key no configurada.' });
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/food/${id.trim()}?api_key=${usdaKey}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!data.foodNutrients) return res.status(404).json({ error: 'ID no encontrado en USDA.' });
    const nutrients = {};
    data.foodNutrients.forEach(n => {
      if (n.nutrient && (n.nutrient.id === 1003 || n.nutrient.name === 'Protein')) nutrients.p = Math.round(n.amount * 100) / 100;
      if (n.nutrient && (n.nutrient.id === 1004 || n.nutrient.name === 'Total lipid (fat)')) nutrients.g = Math.round(n.amount * 100) / 100;
      if (n.nutrient && (n.nutrient.id === 1005 || n.nutrient.name === 'Carbohydrate, by difference')) nutrients.c_total = Math.round(n.amount * 100) / 100;
      if (n.nutrient && (n.nutrient.id === 1079 || n.nutrient.name === 'Fiber, total dietary')) nutrients.fibra = Math.round(n.amount * 100) / 100;
    });
    const c = Math.max(0, Math.round(((nutrients.c_total || 0) - (nutrients.fibra || 0)) * 100) / 100);
    // Traducir nombre al español con Claude
    let nombreEs = data.description;
    if (anthropicKey) {
      try {
        const tr = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 60,
            messages: [{ role: 'user', content: `Traduce este nombre de alimento al español para una base de datos nutricional española. Responde SOLO con la traducción, sin explicaciones: "${data.description}"` }]
          })
        });
        const trData = await tr.json();
        if (trData.content && trData.content[0]) nombreEs = trData.content[0].text.trim();
      } catch(e) { nombreEs = data.description; }
    }
    res.json({ result: {
      usda_id: String(data.fdcId),
      n: nombreEs,
      n_original: data.description,
      p: nutrients.p || 0,
      g: nutrients.g || 0,
      c: c,
      fuente: `USDA ${data.fdcId}`
    }});
  } catch(e) { res.status(500).json({ error: e.message }); }
});


// ── GESTOR DE CURSIVAS ─────────────────────────────────────────────────────
app.get('/api/italics', (req, res) => {
  try { res.json(leerItalics()); }
  catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/italics/add', (req, res) => {
  try {
    const { tipo, termino } = req.body;
    if(!tipo || !termino) return res.status(400).json({ error: 'Faltan datos' });
    if(!['cursiva','cursiva-mayuscula','mayuscula-redonda'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });
    const data = leerItalics();
    const t = termino.trim();
    if(!t) return res.status(400).json({ error: 'Término vacío' });
    if(data[tipo].includes(t)) return res.status(400).json({ error: 'El término ya existe' });
    data[tipo].push(t);
    data[tipo].sort((a,b)=>a.toLowerCase().localeCompare(b.toLowerCase(),'es'));
    guardarItalics(data);
    res.json({ ok: true });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/italics/delete', (req, res) => {
  try {
    const { tipo, termino } = req.body;
    if(!tipo || !termino) return res.status(400).json({ error: 'Faltan datos' });
    const data = leerItalics();
    const antes = data[tipo].length;
    data[tipo] = data[tipo].filter(t => t !== termino);
    if(data[tipo].length === antes) return res.status(404).json({ error: 'Término no encontrado' });
    guardarItalics(data);
    res.json({ ok: true });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ── GESTOR DE LIBROS ──────────────────────────────────────────────────────
app.get('/api/libros', (req, res) => {
  try { res.json(leerLibros()); }
  catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/libros/edit', (req, res) => {
  try {
    const { key, data } = req.body;
    const libros = leerLibros();
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
    guardarLibros(libros);
    res.json({ ok: true, newKey });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/libros/add', (req, res) => {
  try {
    const { key, data } = req.body;
    const libros = leerLibros();
    if (libros[key]) return res.status(400).json({ error: 'Ya existe un libro con esa clave.' });
    libros[key] = data;
    guardarLibros(libros);
    res.json({ ok: true });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/libros/delete', (req, res) => {
  try {
    const { key } = req.body;
    const libros = leerLibros();
    if (!libros[key]) return res.status(404).json({ error: 'Libro no encontrado.' });
    delete libros[key];
    guardarLibros(libros);
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
        max_tokens: 8000,
        system: buildSystemPrompt(),
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
