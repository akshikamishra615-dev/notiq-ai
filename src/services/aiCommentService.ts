import type { QuizResultReport, Language } from '../types';

/**
 * Collection of smart, varied AI Tutor commentaries categorized by performance percentage
 */
const AI_COACH_COMMENTS: Record<'grandmaster' | 'master' | 'proficient' | 'improving' | 'needs-review', { en: string[]; hi: string[] }> = {
  grandmaster: {
    en: [
      '🔥 Flawless Mastery! Your recall is at quantum supremacy speed. You’ve synthesized every core definition and formula perfectly!',
      '⚡ 100% Precision! Outstanding cognitive retention. You could teach this topic to a lecture hall today!',
      '🏆 Supreme Performance! Your grasp of the subject is rock solid. Keep this unstoppable momentum alive!',
      '🌟 Genius Alert! You solved all multiple-choice challenges effortlessly. Your sticky notes strategy is paying off huge!',
    ],
    hi: [
      '🔥 अद्वितीय प्रदर्शन! आपने सभी अवधारणाओं और सूत्रों को शत-प्रतिशत सटीकता से हल किया है!',
      '⚡ 100% शुद्धता! आपकी स्मरण शक्ति और समझ अत्यंत सराहनीय है। यह विषय आपके मस्तिष्क में पूरी तरह सुरक्षित है!',
      '🏆 सर्वोत्कृष्ट परिणाम! आपकी कड़ी मेहनत और स्टिकी नोट्स की रणनीति रंग लाई है!',
    ],
  },
  master: {
    en: [
      '🎯 Excellent Grip! You demonstrated over 80% conceptual clarity. A quick 2-minute glance at your pinned notes will cement the rest.',
      '💡 Brilliant Retention! You navigated complex distractors with ease. Your exam readiness is in the top 5%!',
      '🚀 High-Yield Success! Almost flawless. One minor concept tweak and you are at absolute 100% mastery.',
      '✨ Impressive Focus! Your memory recall across chapters is sharp and consistent.',
    ],
    hi: [
      '🎯 शानदार समझ! आपने 80% से अधिक प्रश्नों का सही उत्तर दिया है। बहुत ही उत्तम प्रदर्शन!',
      '💡 उत्कृष्ट याददाश्त! आपकी परीक्षा की तैयारी सही दिशा में है। बस थोड़े से अभ्यास से आप 100% पर पहुँच जाएंगे।',
      '🚀 बेहतरीन स्कोर! जटिल प्रश्नों को भी आपने सहजता से हल किया है।',
    ],
  },
  proficient: {
    en: [
      '📚 Solid Foundation! You have captured the main ideas well. Reviewing the bullet points on Section 2 will boost your score further.',
      '🌱 Good Progress! You have a good grasp of the basics. Try flipping the 3D flashcards once more for rapid recall.',
      '📈 On the Right Track! With 60-75% accuracy, your core intuition is strong. Target your weak spots to unlock the next level!',
    ],
    hi: [
      '📚 मजबूत आधार! आपने मुख्य सिद्धांतों को अच्छी तरह समझा है। कुछ कठिन बिंदुओं पर दोबारा नजर डालने से स्कोर और बढ़ेगा।',
      '🌱 अच्छी प्रगति! फ्लैशकार्ड्स का एक और राउंड आपको मास्टर स्तर तक ले जाएगा।',
    ],
  },
  improving: {
    en: [
      '🔍 Promising Start! You’re building momentum. Take 5 minutes to read through the AI Highlights and retry the quiz.',
      '💪 Practice Makes Perfect! Don’t worry about missed questions—they highlight exactly where high-yield gains are waiting.',
      '⏳ Keep Going! Listen to the Text-to-Speech audio reader for this topic to reinforce auditory memory.',
    ],
    hi: [
      '🔍 सकारात्मक शुरुआत! गलतियों से सीखें और मुख्य स्टिकी नोट्स को दोबारा पढ़ें। अगली बार निश्चित रूप से बेहतर होगा!',
      '💪 निरंतर प्रयास ही सफलता की कुंजी है! ऑडियो रीडर सुनकर याद करने का प्रयास करें।',
    ],
  },
  'needs-review': {
    en: [
      '🔄 Time for a Quick Reset! Switch your summary mode to "Exam Revision" to get condensed formulas, then retake the quiz.',
      '📖 Knowledge Gap Detected! Don’t panic—learning is an iterative loop. Check the highlighted definitions on your board.',
      '🛡️ Opportunity Ahead! Review the pinned notes and flip through the flashcards deck to rebuild clarity.',
    ],
    hi: [
      '🔄 पुनरावलोकन की आवश्यकता! स्टिकी नोट्स को एक बार ध्यानपूर्वक पढ़ें और फिर से क्विज का प्रयास करें।',
      '📖 मुख्य परिभाषाओं और सूत्रों पर पुनः ध्यान दें। अभ्यास से सब आसान हो जाएगा!',
    ],
  },
};

/**
 * Generate a randomized, context-aware AI tutor feedback report
 */
export function generateAIQuizReport(
  score: number,
  total: number,
  docTitle: string,
  language: Language = 'en'
): QuizResultReport {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  
  let category: 'grandmaster' | 'master' | 'proficient' | 'improving' | 'needs-review' = 'needs-review';
  let xpEarned = 25;

  if (percentage === 100) {
    category = 'grandmaster';
    xpEarned = 150;
  } else if (percentage >= 80) {
    category = 'master';
    xpEarned = 100;
  } else if (percentage >= 60) {
    category = 'proficient';
    xpEarned = 70;
  } else if (percentage >= 40) {
    category = 'improving';
    xpEarned = 45;
  }

  const langKey = language === 'hi' ? 'hi' : 'en';
  const commentList = AI_COACH_COMMENTS[category][langKey];
  const randomComment = commentList[Math.floor(Math.random() * commentList.length)];

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (percentage >= 80) {
    strengths.push('High-speed analytical recall');
    strengths.push('Strong grasp of core terminology and definitions');
    strengths.push('Immunity to tricky distractor choices');
    weaknesses.push('Maintain active recall interval in 3 days');
  } else if (percentage >= 60) {
    strengths.push('Solid grasp of primary topic theme');
    strengths.push('Good elimination of improbable options');
    weaknesses.push('Fine-tune subtle formula parameters');
    weaknesses.push('Review secondary bullet point takeaways');
  } else {
    strengths.push('Willingness to test understanding under exam conditions');
    weaknesses.push('Revisit key definitions in AI Highlights drawer');
    weaknesses.push('Run 3D Flashcards active recall drill');
  }

  return {
    id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: new Date().toISOString(),
    docTitle,
    score,
    total,
    percentage,
    xpEarned,
    aiComment: randomComment,
    feedbackCategory: category,
    strengths,
    weaknesses,
  };
}
