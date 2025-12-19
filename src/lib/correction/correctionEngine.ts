import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedResume, StructuredError, CorrectionProposal } from '../parser/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateCorrections(
  resume: ParsedResume,
  errors: StructuredError[],
  jobRole: string
): Promise<CorrectionProposal> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  // Filter errors that have allowed fixes
  const actionableErrors = errors.filter(e => e.allowed_fixes.length > 0);

  if (actionableErrors.length === 0) {
    return {
      modified_resume: resume.rawText,
      changes_made: [],
      unresolved_errors: []
    };
  }

  const prompt = `
    You are a **Constrained Resume Correction Engine**.
    Your task is to fix specific errors in a resume based on a strict set of rules.
    
    **CORE RULES (NON-NEGOTIABLE):**
    1. Fix ONLY what is listed in the "ERRORS" list.
    2. NEVER invent experience, projects, skills, metrics, or titles.
    3. NEVER rewrite the entire resume.
    4. Perform diff-based, minimal edits.
    5. If a fix requires fabrication, DO NOT apply it.
    
    **INPUT DATA:**
    
    TARGET ROLE: ${jobRole}
    
    RESUME CONTENT:
    """
    ${resume.rawText}
    """
    
    ERRORS TO FIX:
    ${JSON.stringify(actionableErrors, null, 2)}
    
    **OUTPUT FORMAT:**
    Return a JSON object with the following structure:
    {
      "modified_resume": "FULL UPDATED RESUME TEXT",
      "changes_made": [
        {
          "error_id": "ID_OF_ERROR_FIXED",
          "action": "DESCRIPTION_OF_ACTION",
          "before": "TEXT_BEFORE_CHANGE",
          "after": "TEXT_AFTER_CHANGE"
        }
      ],
      "unresolved_errors": [
        {
          "error_id": "ID_OF_ERROR_NOT_FIXED",
          "reason": "WHY_IT_COULD_NOT_BE_FIXED"
        }
      ]
    }
    
    Ensure the "modified_resume" is the complete text of the resume with the fixes applied.
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from code block if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;

    return JSON.parse(jsonString) as CorrectionProposal;
  } catch (error: any) {
    console.error('Correction Engine Error:', error);
    if (error.response) {
      console.error('Gemini API Response Error:', await error.response.text());
    }
    throw new Error(`Failed to generate corrections: ${error.message}`);
  }
}
