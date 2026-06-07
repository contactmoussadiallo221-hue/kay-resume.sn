import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set high limits for base64 file uploads (PDF / Image scans)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Initialize Gemini Client with correct requirements from skill guidelines
if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI features will fail.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Summarize and simplify lesson endpoint
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const { text, fileData, mimeType, subject, difficulty } = req.body;

    if (!text && !fileData) {
      return res.status(400).json({ error: "Veuillez fournir un texte ou un document/image." });
    }

    const payloadParts: any[] = [];

    // Add document data if present
    if (fileData && mimeType) {
      const base64Data = fileData.startsWith('data:') 
        ? fileData.split(',')[1] 
        : fileData;
        
      payloadParts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    // Add textual context or guidelines if present
    const promptInstructions = `
      Vous êtes "Mon Prof IA", un enseignant exceptionnel et pédagogue, qui aide à transformer les cours complexes en résumés parfaits, clairs et structurés en Français.
      
      Matière du cours: ${subject || 'Général'}
      Niveau de simplification ciblé : ${difficulty || 'college'} (primary = Élémentaire / 8-10 ans, college = Collège / 11-15 ans, lycee = Lycée / 15-18 ans, uni = Université / Enseignement supérieur)

      Analysez méticuleusement le cours fourni (texte, image ou fichier PDF).
      
      Générez en Français l'objet structuré suivant :
      - title : Un titre éducatif court pour cette fiche (maximum 5 mots).
      - summaryText : Un résumé clair et pédagogique du cours complet.
      - keyPoints : Une liste de 4 à 5 points mémos essentiels (les points à retenir absolument).
      - definitions : Une liste d'au moins 3 définitions clés trouvées ou induites par le cours (terme, definition).
      - formulasOrDates : Une liste des formules importantes, dates historiques clés, ou théorèmes fondamentaux (si non applicable, renvoyez une liste vide).
      - simplification : Une explication alternative ultra-simple adaptée précisément au niveau "${difficulty}" :
        * Si primary: Expliquer comme à un enfant de 9 ans avec des analogies imagées, des comparaisons simples et un ton chaleureux. Bienveillant et amusant.
        * Si college: Explication pas à pas, structurée, rigoureuse mais très accessible, facilitant l'assimilation.
        * Si lycee: Explication analytique intégrant le vocabulaire conceptuel indispensable, le contexte historique ou scientifique complet.
        * Si uni: Explication académique enrichie, point de vue critique, complexité scientifique ou concepts avancés.
      - quiz : Un mini-quiz d'évaluation contenant exactement 3 questions à choix multiples. Chaque question doit inclure :
        * question: Libellé de la question.
        * options: Exactement 4 choix possibles.
        * correctAnswer: La réponse exacte (doit correspondre à l'une des options).
        * explanation: Une phrase expliquant pourquoi cette réponse est correcte.

      ${text ? `Informations ou notes additionnelles fournies par l'élève: "${text}"` : ""}
    `;

    payloadParts.push({ text: promptInstructions });

    console.log(`Analyzing document with gemini-3.5-flash for subject "${subject}" and level "${difficulty}"...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: payloadParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summaryText: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            definitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING }
                },
                required: ["term", "definition"]
              }
            },
            formulasOrDates: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            simplification: { type: Type.STRING },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["title", "summaryText", "keyPoints", "definitions", "formulasOrDates", "simplification", "quiz"]
        }
      }
    });

    const jsonText = response.text || "{}";
    res.json(JSON.parse(jsonText.trim()));
  } catch (error: any) {
    console.error("Gemini route error:", error);
    res.status(500).json({ error: error?.message || "Une erreur est survenue lors de l'apprentissage." });
  }
});

// Configure Vite or serve static production build
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer();
