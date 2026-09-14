import { HindiReconstructionService } from './hindiReconstructionService';
import { BackendTranslationEngine } from './translationEngine';

export interface BackendStickyNote {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  keywords: string[];
  topic: string;
  pageNumber: string;
  priority: string;
  color: string;
}

export interface BackendOCRProcessResponse {
  status: 'SUCCESS' | 'ERROR';
  languageDetected: 'hi' | 'en';
  outputLanguage: 'hi' | 'en';
  cleanText: string;
  summary: string;
  stickyNotes: BackendStickyNote[];
  storyNarrative?: string;
}

export class BackendSummaryGenerator {
  /**
   * Process and generate complete clean JSON response from rawText
   */
  public static async processDocument(
    rawText: string,
    docTitle: string,
    requestedOutputLanguage: 'auto' | 'hi' | 'en' = 'auto',
    mode: string = 'smart-summary',
    pages?: { pageNumber: number; text: string }[]
  ): Promise<BackendOCRProcessResponse> {
    // 1. Detect language
    const devanagariCount = (rawText.match(/[\u0900-\u097F]/g) || []).length;
    const latinCount = (rawText.match(/[a-zA-Z]/g) || []).length;
    const detectedLanguage: 'hi' | 'en' = (devanagariCount > latinCount * 0.2 || devanagariCount > 20) ? 'hi' : 'en';

    let outputLanguage: 'hi' | 'en' = detectedLanguage;
    if (requestedOutputLanguage === 'hi') outputLanguage = 'hi';
    else if (requestedOutputLanguage === 'en') outputLanguage = 'en';

    // 2. Multi-stage OCR Cleanup & Hindi Reconstruction
    let cleanText = rawText;
    if (detectedLanguage === 'hi') {
      cleanText = HindiReconstructionService.reconstruct(rawText);
    } else {
      cleanText = HindiReconstructionService.cleanOCRCodes(rawText);
    }

    // 3. Translation if target output language differs from detected language
    if (outputLanguage === 'hi' && detectedLanguage === 'en') {
      cleanText = await BackendTranslationEngine.translate(cleanText, 'hi', 'en');
      cleanText = HindiReconstructionService.reconstruct(cleanText);
    } else if (outputLanguage === 'en' && detectedLanguage === 'hi') {
      cleanText = await BackendTranslationEngine.translate(cleanText, 'en', 'hi');
    }

    // 4. Split cleanText into sentences
    const sentences = cleanText
      .split(/(?<=[.?!।\n])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 5);

    // 5. Generate Overview Summary
    const overviewSentences = sentences.slice(0, 5);
    const summary = overviewSentences.join(' ') || (outputLanguage === 'hi' 
      ? `${docTitle} का संपूर्ण अध्याय सारांश एवं मुख्य बिंदु।` 
      : `Comprehensive chapter summary of ${docTitle}.`);

    // 6. Generate Page-Wise Sticky Notes if pages provided, else standard chunking
    const stickyNotes: BackendStickyNote[] = [];

    if (pages && pages.length > 0) {
      for (let i = 0; i < pages.length; i++) {
        const pageObj = pages[i];
        const pageNum = pageObj.pageNumber || (i + 1);
        const pageRawText = pageObj.text || '';
        const pageClean = outputLanguage === 'hi'
          ? HindiReconstructionService.reconstruct(pageRawText)
          : HindiReconstructionService.cleanOCRCodes(pageRawText);

        const pageSentences = pageClean.split(/(?<=[.?!।\n])\s+/).map(s => s.trim()).filter(s => s.length > 5);
        const pageHeading = pageSentences[0] || (outputLanguage === 'hi' ? `पृष्ठ ${pageNum} अध्ययन नोट्स` : `Page ${pageNum} Study Notes`);

        const noteTitle = outputLanguage === 'hi'
          ? `पेज ${pageNum}: ${pageHeading.slice(0, 40)}`
          : `Page ${pageNum}: ${pageHeading.slice(0, 40)}`;

        const bullets: string[] = pageSentences.slice(0, 8);
        while (bullets.length < 8) {
          bullets.push(outputLanguage === 'hi'
            ? `पृष्ठ ${pageNum} का परीक्षा-उपयोगी सारांश बिंदु।`
            : `Page ${pageNum} key examination revision takeaway.`);
        }

        stickyNotes.push({
          id: `sticky-page-${pageNum}-${Date.now()}-${i}`,
          title: noteTitle,
          summary: pageSentences.slice(0, 2).join(' ') || noteTitle,
          bullets: bullets.slice(0, 10),
          keywords: [pageHeading.slice(0, 20), `Page ${pageNum}`],
          topic: pageHeading.slice(0, 30),
          pageNumber: String(pageNum),
          priority: i === 0 ? 'high' : 'medium',
          color: ['purple', 'pink', 'yellow', 'blue', 'green', 'orange'][i % 6],
        });
      }
    } else {
      const totalSentences = sentences.length;
      const targetCardCount = totalSentences >= 20 ? 6 : 5;
      const sentencesPerCard = Math.max(2, Math.ceil(totalSentences / targetCardCount));
      const usedBulletsGlobal = new Set<string>();

      const topicTitlesHi = [
        'अध्याय का परिचय एवं मुख्य पृष्ठभूमि',
        'मुख्य पात्र / मुख्य अवधारणा एवं नियम',
        'महत्वपूर्ण घटनाएँ / प्रक्रिया एवं कार्यप्रणाली',
        'कारण, प्रभाव और मुख्य तथ्य',
        'निष्कर्ष, संदेश और परीक्षा के महत्वपूर्ण बिंदु',
        'पूरे अध्याय की अंतिम त्वरित पुनरावृत्ति',
      ];

      const topicTitlesEn = [
        'Chapter Overview & Historical Foundation',
        'Core Characters & Foundational Theories',
        'Crucial Developments & Operating Mechanics',
        'Underlying Causes, Impacts & Core Facts',
        'Conclusions, Themes & Exam Revision Points',
        'Comprehensive Final Rapid Summary',
      ];

      for (let cardIdx = 0; cardIdx < targetCardCount; cardIdx++) {
        const startIdx = cardIdx * sentencesPerCard;
        const endIdx = Math.min(totalSentences, (cardIdx + 1) * sentencesPerCard);
        const chunkSentences = sentences.slice(startIdx, endIdx);
        if (chunkSentences.length === 0) continue;

        const topicList = outputLanguage === 'hi' ? topicTitlesHi : topicTitlesEn;
        const chunkTopic = topicList[cardIdx % topicList.length];

        const noteSummary = chunkSentences.slice(0, 3).join(' ') || (outputLanguage === 'hi' 
          ? `${chunkTopic}: अध्याय का महत्वपूर्ण एवं परीक्षा-उपयोगी भाग।`
          : `${chunkTopic}: Essential revision section of the chapter.`);

        const bullets: string[] = [];

        for (const sent of chunkSentences) {
          const cleanS = sent.replace(/^[#\s•\-\*\d\.:\)>·▪■□◆◇✓✔★☆✦✧\[\]]+/g, '').trim();
          if (cleanS.length > 8 && !usedBulletsGlobal.has(cleanS)) {
            bullets.push(cleanS);
            usedBulletsGlobal.add(cleanS);
          }
          if (bullets.length >= 10) break;
        }

        const fallbackExamBullets = outputLanguage === 'hi' ? [
          `इस भाग (${chunkTopic}) में उल्लिखित मुख्य बिंदु परीक्षा के दृष्टिकोण से अत्यंत महत्वपूर्ण हैं।`,
          `विद्यार्थियों को इस खंड में दिए गए प्रमुख नियमों, तिथियों और तर्कों को विशेष रूप से याद रखना चाहिए।`,
          `अध्याय का यह अंश विषय की व्यावहारिक समझ और विश्लेषणात्मक प्रश्नों के उत्तर हेतु सहायक है।`,
        ] : [
          `The concepts highlighted in "${chunkTopic}" carry high importance for examination revision.`,
          `Students should memorize the core rules, dates, and arguments emphasized in this section.`,
          `This section aids in developing analytical depth for answering structured examination questions.`,
        ];

        let fbIdx = 0;
        while (bullets.length < 8) {
          const candidate = fallbackExamBullets[fbIdx % fallbackExamBullets.length];
          if (!bullets.includes(candidate)) {
            bullets.push(candidate);
          }
          fbIdx++;
        }

        stickyNotes.push({
          id: `sticky-${Date.now()}-${cardIdx + 1}`,
          title: chunkTopic,
          summary: noteSummary,
          bullets: bullets.slice(0, 10),
          keywords: [chunkTopic, outputLanguage === 'hi' ? 'परीक्षा बिंदु' : 'Exam Point'],
          topic: chunkTopic,
          pageNumber: String(cardIdx + 1),
          priority: cardIdx === 0 ? 'high' : 'medium',
          color: ['purple', 'pink', 'yellow', 'blue', 'green', 'orange'][cardIdx % 6],
        });
      }
    }

    return {
      status: 'SUCCESS',
      languageDetected: detectedLanguage,
      outputLanguage,
      cleanText,
      summary,
      stickyNotes,
    };
  }
}
