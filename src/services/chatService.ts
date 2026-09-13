import type { ChatMessage, Language } from '../types';
import { cleanGarbageOCRText } from './ocrService';

/**
 * Generate a contextual response from Notiq AI for user chat questions based on document text & category preferences
 */
export async function generateAIChatResponse(
  userQuestion: string,
  docText: string,
  docTitle: string,
  _chatHistory: ChatMessage[],
  language: Language = 'auto'
): Promise<{ text: string; suggestionPills: string[] }> {
  const cleanQ = userQuestion.trim().toLowerCase();

  // Clean raw OCR text to ensure zero OCR code tokens leak into chat response
  const sanitizedDocText = cleanGarbageOCRText(docText);

  // Detect language preferences if requested in prompt or settings
  let targetLang: 'en' | 'hi' | 'hinglish' = 'en';
  if (language === 'hi' || cleanQ.includes('hindi') || cleanQ.includes('हिंदी')) targetLang = 'hi';
  else if (language === 'hinglish' || cleanQ.includes('hinglish')) targetLang = 'hinglish';

  // Category mode detection from user query
  const isVivaMode = cleanQ.includes('viva') || cleanQ.includes('oral');
  const isQuickRevision = cleanQ.includes('quick') || cleanQ.includes('revision') || cleanQ.includes('short');
  const is2Marks = cleanQ.includes('2 mark') || cleanQ.includes('2-mark') || cleanQ.includes('2marks');
  const is5Marks = cleanQ.includes('5 mark') || cleanQ.includes('5-mark') || cleanQ.includes('5marks');
  const is10Marks = cleanQ.includes('10 mark') || cleanQ.includes('10-mark') || cleanQ.includes('10marks');
  const isMCQs = cleanQ.includes('mcq') || cleanQ.includes('quiz') || cleanQ.includes('practice question');
  const isFormula = cleanQ.includes('formula') || cleanQ.includes(' सूत्र') || cleanQ.includes('fact') || cleanQ.includes('date');
  const isExample = cleanQ.includes('example') || cleanQ.includes('उदाहरण') || cleanQ.includes('real life');

  // Search relevant context sentences from sanitizedDocText
  const sentences = sanitizedDocText
    .replace(/([.?!।])\s*(?=[A-Z\u0900-\u097F])/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 15 && !/\b(UXV|UXK|UXJ|QWX|PLM|XZY|ZXC|VBN|FGH|JKL)\b/i.test(s));

  const keywords = cleanQ.split(/\s+/).filter(w => w.length > 3);
  const relevantSentences = sentences.filter(s => 
    keywords.some(k => s.toLowerCase().includes(k))
  );

  const contextExcerpt = relevantSentences.length > 0 
    ? relevantSentences.slice(0, 4).join(' ') 
    : sentences.slice(0, 3).join(' ');

  let responseText = '';

  // Category Mode Responses
  if (isVivaMode) {
    responseText = targetLang === 'hi'
      ? `🎤 **Viva Preparation Mode (${docTitle}):**\n\n` +
        `**1. मुख्य परिभाषा:** ${contextExcerpt.slice(0, 100)}\n` +
        `**2. सम्भावित Viva प्रश्न:** "${userQuestion}" का मुख्य उद्देश्य क्या है?\n` +
        `**3. Crisp Answer:** ${contextExcerpt.slice(0, 150)}\n` +
        `**4. Cross-Question:** यह अवधारणा कब विफल होती है?`
      : `🎤 **Viva Preparation Mode (${docTitle}):**\n\n` +
        `**1. Crisp Definition (20-40 words):** ${contextExcerpt.slice(0, 110)}\n\n` +
        `**2. Primary Viva Question:** What is the fundamental mechanism of ${docTitle}?\n` +
        `**3. One-Line Examiner Answer:** ${contextExcerpt.slice(0, 120)}\n\n` +
        `**4. Cross-Question Cue:** Be ready to explain edge cases or real-world limitations.`;
  } else if (is2Marks) {
    responseText = targetLang === 'hi'
      ? `📝 **2 Marks Exam Answer Format (${docTitle}):**\n\n` +
        `**परिभाषा:** ${contextExcerpt.slice(0, 80)}\n\n` +
        `• बिंदु 1: ${sentences[0] || contextExcerpt.slice(0, 50)}\n` +
        `• बिंदु 2: ${sentences[1] || 'मुख्य अनुप्रयोग याद रखें।'}`
      : `📝 **2 Marks Exam Answer Format (${docTitle}):**\n\n` +
        `**Definition:** ${contextExcerpt.slice(0, 90)}\n\n` +
        `• Key Point 1: ${sentences[0] || contextExcerpt.slice(0, 60)}\n` +
        `• Key Point 2: ${sentences[1] || 'Essential rule for exam scoring.'}`;
  } else if (is5Marks) {
    responseText = targetLang === 'hi'
      ? `📖 **5 Marks Exam Answer Format (${docTitle}):**\n\n` +
        `**मुख्य परिचय:** ${contextExcerpt.slice(0, 100)}\n\n` +
        `1. ${sentences[0] || 'प्रथम बिंदु'}\n` +
        `2. ${sentences[1] || 'द्वितीय बिंदु'}\n` +
        `3. ${sentences[2] || 'तृतीय बिंदु'}\n` +
        `4. 🌟 **उदाहरण:** दैनिक जीवन में ${contextExcerpt.slice(0, 40)} का व्यावहारिक उपयोग।`
      : `📖 **5 Marks Exam Answer Format (${docTitle}):**\n\n` +
        `**Core Introduction:** ${contextExcerpt.slice(0, 110)}\n\n` +
        `1. ${sentences[0] || 'Primary mechanism'}\n` +
        `2. ${sentences[1] || 'Key characteristic'}\n` +
        `3. ${sentences[2] || 'Operational requirement'}\n` +
        `4. 🌟 **Practical Example:** Real-world usage of ${contextExcerpt.slice(0, 50)}.`;
  } else if (is10Marks) {
    responseText = targetLang === 'hi'
      ? `📚 **10 Marks Long Answer Format (${docTitle}):**\n\n` +
        `**1. भूमिका (Introduction):** ${contextExcerpt.slice(0, 120)}\n\n` +
        `**2. मुख्य सिद्धांत (Core Body):**\n` +
        `• ${sentences[0] || 'मुख्य बिंदु 1'}\n` +
        `• ${sentences[1] || 'मुख्य बिंदु 2'}\n\n` +
        `**3. 📐 फ्लोचार्ट/आरेख सुझाव:** ${docTitle} का आरेख बनाएं।\n\n` +
        `**4. 🏁 निष्कर्ष:** यह सिद्धांत परीक्षा के लिए अनिवार्य है।`
      : `📚 **10 Marks Long Answer Format (${docTitle}):**\n\n` +
        `**1. Introduction:** ${contextExcerpt.slice(0, 130)}\n\n` +
        `**2. Architectural Breakdown:**\n` +
        `• ${sentences[0] || 'Primary principle'}\n` +
        `• ${sentences[1] || 'Secondary relation'}\n\n` +
        `**3. 📐 Recommended Flow Diagram:** Draw a structural flowchart illustrating ${docTitle}.\n\n` +
        `**4. 🏁 Conclusion:** Master these relationships to score full 10 marks.`;
  } else if (isMCQs) {
    responseText = `❓ **MCQ Practice Mode (${docTitle}):**\n\n` +
      `**Q1. Which of the following best describes "${userQuestion}"?**\n` +
      `A) ${contextExcerpt.slice(0, 50)} (Correct)\n` +
      `B) Incorrect alternative B\n` +
      `C) Incorrect alternative C\n` +
      `D) Incorrect alternative D\n\n` +
      `💡 **Explanation:** ${contextExcerpt.slice(0, 120)}`;
  } else if (isQuickRevision) {
    responseText = `⚡ **Quick Revision Cues (30-60 Seconds):**\n\n` +
      `• ${sentences[0] || contextExcerpt.slice(0, 80)}\n` +
      `• ${sentences[1] || 'Key exam cue'}\n` +
      `• ${sentences[2] || 'High yield note'}`;
  } else if (isFormula) {
    responseText = `⚡ **Formulas, Dates & Facts (${docTitle}):**\n\n` +
      `• Fact 1: ${contextExcerpt.slice(0, 100)}\n` +
      `• Fact 2: ${sentences[0] || 'Essential law/date'}`;
  } else if (isExample) {
    responseText = `🌟 **Real-Life Practical Example (${docTitle}):**\n\n` +
      `Imagine a scenario where Input $\\rightarrow$ Processing $\\rightarrow$ Result: "${contextExcerpt.slice(0, 160)}..."`;
  } else {
    // Default Help
    responseText = targetLang === 'hi'
      ? `🤖 **Notiq AI सहायक (${docTitle}):**\n\nआपके प्रश्न "${userQuestion}" का संदर्भ विवरण:\n\n${contextExcerpt || 'इस दस्तावेज़ में मुख्य सिद्धांतों का विवरण है।'}\n\nआप किसी भी कैटेगरी (Viva Mode, Quick Revision, 2 Marks, 5 Marks, 10 Marks, MCQs) में उत्तर प्राप्त कर सकते हैं!`
      : `🤖 **Notiq AI Assistant (${docTitle}):**\n\nRegarding "${userQuestion}":\n\n${contextExcerpt || 'Here is the core summary from your study document.'}\n\n💡 **Tip:** You can ask for category-specific answers like "Explain in Viva Mode", "Give 5-mark answer", or "Generate MCQs"!`;
  }

  const suggestionPills = [
    'Explain in Viva Mode',
    'Quick Revision (30s)',
    'Generate 5-mark answer',
    'Generate 10-mark answer',
    'Generate 5 practice MCQs',
  ];

  return { text: responseText, suggestionPills };
}

/**
 * Evaluate student's oral/written answer in Practice AI Viva mode
 */
export async function evaluateStudentVivaAnswer(
  userAnswer: string,
  expectedConcept: string,
  language: Language = 'auto'
): Promise<{ score: number; feedback: string; isCorrect: boolean }> {
  if (!userAnswer || userAnswer.trim().length < 4) {
    return {
      score: 30,
      feedback: language === 'hi' 
        ? 'उत्तर बहुत संक्षिप्त था। कृपया अवधारणा को थोड़ा और विस्तार से समझाएं।' 
        : 'Answer was too brief. Please expand on the main mechanism.',
      isCorrect: false,
    };
  }

  const cleanAns = userAnswer.toLowerCase();
  const cleanExp = expectedConcept.toLowerCase();

  const words = cleanExp.split(/\s+/).filter(w => w.length > 3);
  const matchCount = words.filter(w => cleanAns.includes(w)).length;
  const matchRatio = words.length > 0 ? matchCount / words.length : 0.5;

  let score = Math.round(50 + matchRatio * 50);
  score = Math.min(100, Math.max(40, score));

  const isCorrect = score >= 65;

  let feedback = '';
  if (language === 'hi') {
    feedback = isCorrect
      ? `शानदार Viva उत्तर! आपने मुख्य अवधारणा को सटीक रूप से प्रस्तुत किया। (अंक: ${score}/100)`
      : `अच्छा प्रयास! Viva में पूर्ण अंक हेतु तकनीकी परिभाषा का प्रयोग करें। (अंक: ${score}/100)`;
  } else {
    feedback = isCorrect
      ? `Excellent Viva explanation! Crisp definition and keywords captured. (Score: ${score}/100)`
      : `Good attempt! Include the exact technical terms for top viva marks. (Score: ${score}/100)`;
  }

  return { score, feedback, isCorrect };
}
