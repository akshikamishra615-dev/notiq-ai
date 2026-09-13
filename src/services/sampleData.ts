import type { Language, SummaryMode } from '../types';

export interface SampleDoc {
  id: string;
  title: string;
  category: string;
  language: Language;
  defaultMode: SummaryMode;
  description: string;
  fileSizeText: string;
  text: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'sample-bottle-dew',
    title: 'A Bottle of Dew (Story Chapter)',
    category: 'Literature & Moral Stories',
    language: 'en',
    defaultMode: 'story',
    fileSizeText: '95 KB (2 pages)',
    description: 'The story of Rama Natha, his search for a potion to turn items to gold, and the wise man Ramanatha’s lesson on hard work.',
    text: `Chapter: A Bottle of Dew

Rama Natha was the son of a rich landlord. His father left him vast tracts of banana plantations and land. But Rama Natha was lazy and believed in magic. He believed there was a magic potion that could turn any object into pure gold. He spent all his time and money searching for this potion, listening to sadhus and spending wealth, leaving his banana fields neglected.

His wife, Madhumati, was worried because their money was running out. One day, a famous sage named Ramanatha came to their village. Rama Natha rushed to the sage and asked for the secret to the gold-making magic potion. 

Sage Ramanatha listened patiently and said, "Yes, there is such a potion! But it requires a difficult ingredient. You must collect five liters of morning dew from banana leaves. But the dew must be collected with your own hands, and you must plant and tend the banana trees yourself. When you collect five liters of dew, bring it to me, and I will chant a secret mantra to turn it into gold."

Rama Natha was overjoyed. He immediately went home and started clearing his neglected fields. He planted thousands of banana saplings. Every morning, before sunrise, he woke up and carefully gathered dew drops from the leaves into a bottle. While Rama Natha was busy planting trees and collecting dew, his wife Madhumati looked after the crop, harvested the ripe bananas, and sold them in the market for good money.

Five years passed. Rama Natha finally collected five liters of dew. Excitedly, he took the bottle of dew to Sage Ramanatha. The sage took the bottle, chanted a few words, and poured a drop on a copper coin. Nothing happened! The coin remained copper.

Rama Natha was heartbroken. "Sir, did the magic fail?" he cried.

Sage Ramanatha smiled and called Madhumati. She entered carrying a heavy box filled with thousands of shiny gold coins. The sage explained, "Rama Natha, there is no magic potion. But while you were collecting dew for five years, you cultivated thousands of banana trees. Your hard work produced abundant banana crops, which your wife sold for all these gold coins. Your sweat and labor are the real magic potion that created true gold!"

Rama Natha realized his mistake. He understood that hard work, patience, and dedication are the true sources of wealth, and he never relied on shortcuts again.`
  },
  {
    id: 'sample-quantum',
    title: 'Quantum Computing & Mechanics Fundamentals',
    category: 'Physics & Computing',
    language: 'en',
    defaultMode: 'quick-revision',
    fileSizeText: '142 KB (3 pages)',
    description: 'Covers qubits, superposition, quantum entanglement, Bloch sphere, Shor algorithm, and quantum decoherence.',
    text: `Chapter 1: Principles of Quantum Mechanics
Quantum mechanics is defined as the fundamental theory in physics that describes nature at the smallest scales of energy levels of atoms and subatomic particles.
Unlike classical physics where particles occupy definitive coordinates, quantum systems are governed by the Schrödinger wave equation: iħ ∂Ψ/∂t = ĤΨ.
The Principle of Superposition states that any two or more quantum states can be added together ('superposed') and the result will be another valid quantum state.
Quantum Entanglement is defined as a physical phenomenon where particles remain connected so that actions performed on one affect the other instantly, regardless of distance.
Formula for Quantum State Representation: |Ψ⟩ = α|0⟩ + β|1⟩, where |α|^2 + |β|^2 = 1.

Chapter 2: Qubits and Quantum Gates
A Qubit (quantum bit) is the basic unit of quantum information. While a classical bit can only be 0 or 1, a qubit can exist in a superposition of both states.
Bloch Sphere is a geometrical representation of the pure state space of a two-level quantum mechanical system (qubit).
Single-qubit quantum gates include the Pauli-X, Pauli-Y, Pauli-Z, Hadamard Gate (H), and Phase Gate (S).
The Hadamard Gate creates an equal superposition of base states: H|0⟩ = (|0⟩ + |1⟩)/√2.
Two-qubit gates include the Controlled-NOT (CNOT) gate, which flips the target qubit if and only if the control qubit is 1.

Chapter 3: Quantum Algorithms and Applications
Shor's Algorithm was formulated in 1994 by Peter Shor. It provides exponential speedup for integer factorization, threatening classical RSA encryption.
Grover's Algorithm provides quadratic speedup for unstructured database searching with O(√N) time complexity.
Quantum Key Distribution (QKD) such as the BB84 protocol uses quantum physics principles to create unconditionally secure communication channels.
Quantum Supremacy was experimentally demonstrated in 2019 using superconducting qubits completing a specific sampling problem in 200 seconds that would take supercomputers 10,000 years.

Chapter 4: Major Engineering Challenges
Quantum Decoherence is defined as the loss of quantum coherence caused by unwanted environmental interactions and thermal noise.
Quantum Error Correction (QEC) requires physical qubits to form a single fault-tolerant logical qubit using surface codes.
Operating Temperature: Superconducting quantum processors must operate at dilution refrigerator temperatures near 15 millikelvin (-273.13°C), colder than deep space.
Future Outlook: Scalable fault-tolerant quantum computers are projected for commercial cryptography and molecular simulation by 2030.`
  },
  {
    id: 'sample-history',
    title: 'Modern Indian History & Constitutional Milestones',
    category: 'History & Civics',
    language: 'en',
    defaultMode: 'important-points',
    fileSizeText: '210 KB (4 pages)',
    description: 'Exam-focused revision notes on 1857 Revolt, Freedom Struggle, Preamble, and Fundamental Rights.',
    text: `Section 1: The Revolt of 1857 and Crown Rule
The Revolt of 1857, also known as India's First War of Independence, began on May 10, 1857, at Meerut.
Key leaders included Rani Lakshmibai of Jhansi, Kunwar Singh of Bihar, Bahadur Shah Zafar in Delhi, and Tantia Tope.
Government of India Act 1858 transferred administrative authority from the British East India Company directly to the British Crown.
Lord Canning was appointed as the first Viceroy of India under Queen Victoria's Proclamation of 1858.

Section 2: Gandhian Era and Mass Movements
Mahatma Gandhi returned to India from South Africa on January 9, 1915 (commemorated as Pravasi Bharatiya Divas).
Champaran Satyagraha (1917) in Bihar was Gandhi's first civil disobedience movement against forced indigo farming.
Non-Cooperation Movement was launched in 1920 following the Jallianwala Bagh Massacre of April 13, 1919.
Dandi March and Civil Disobedience Movement commenced on March 12, 1930, protesting the British salt monopoly.
Quit India Movement was launched on August 8, 1942, with the historic slogan 'Do or Die' (Karo ya Maro).

Section 3: Drafting of the Indian Constitution
The Constituent Assembly held its first meeting on December 9, 1946.
Dr. Sachchidananda Sinha was the temporary president, succeeded by Dr. Rajendra Prasad as permanent President.
Dr. B.R. Ambedkar was appointed Chairman of the Drafting Committee on August 29, 1947.
Total duration taken to draft the Constitution was exactly 2 years, 11 months, and 18 days.
The Constitution of India was adopted on November 26, 1949 (Constitution Day) and came into full legal effect on January 26, 1950 (Republic Day).

Section 4: Key Constitutional Articles and Preamble
The Preamble declares India to be a 'Sovereign Socialist Secular Democratic Republic' committed to Justice, Liberty, Equality, and Fraternity.
Fundamental Rights are enshrined in Part III, Articles 12 to 35:
Article 14: Equality before law and equal protection of laws.
Article 19: Protection of six democratic freedoms including freedom of speech and expression.
Article 21: Protection of life and personal liberty (Right to Privacy declared fundamental under Puttaswamy judgment).
Article 32: Right to Constitutional Remedies, termed by Dr. Ambedkar as the 'Heart and Soul of the Constitution'.`
  },
  {
    id: 'sample-hindi',
    title: 'भारत का संविधान: मूल अधिकार एवं नीति निर्देशक तत्व',
    category: 'हिंदी (Hindi Civics Revision)',
    language: 'hi',
    defaultMode: 'quick-revision',
    fileSizeText: '160 KB (2 पृष्ठ)',
    description: 'हिंदी में भारतीय संविधान, मौलिक अधिकार, और राज्य के नीति निर्देशक तत्वों के महत्वपूर्ण परीक्षा नोट्स।',
    text: `अध्याय 1: भारतीय संविधान का परिचय एवं निर्माण
भारतीय संविधान विश्व का सबसे बड़ा लिखित संविधान है। इसे बनाने में 2 वर्ष, 11 माह और 18 दिन का समय लगा था।
संविधान सभा की पहली बैठक 9 दिसंबर 1946 को हुई थी।
डॉ. भीमराव आंबेडकर प्रारूप समिति (Drafting Committee) के अध्यक्ष थे।
26 नवंबर 1949 को संविधान को अंगीकृत किया गया तथा 26 जनवरी 1950 को इसे पूर्ण रूप से लागू किया गया।
प्रस्तावना संविधान की आत्मा है जो न्याय, स्वतंत्रता, समानता और बंधुत्व का संदेश देती है।

अध्याय 2: मौलिक अधिकार (भाग-3, अनुच्छेद 12 से 35)
मौलिक अधिकार भारतीय नागरिकों को संविधान द्वारा प्रदत्त बुनियादी अधिकार हैं:
अनुच्छेद 14: विधि के समक्ष समता और विधियों का समान संरक्षण।
अनुच्छेद 19: विचार एवं अभिव्यक्ति की स्वतंत्रता सहित 6 लोकतांत्रिक अधिकार।
अनुच्छेद 21: प्राण और दैहिक स्वतंत्रता का संरक्षण (जीवन का अधिकार)।
अनुच्छेद 21A: 6 से 14 वर्ष के बच्चों के लिए मुफ्त और अनिवार्य प्राथमिक शिक्षा (86वां संविधान संशोधन 2002)।
अनुच्छेद 32: संवैधानिक उपचारों का अधिकार, जिसे डॉ. आंबेडकर ने संविधान का 'हृदय और आत्मा' कहा था।

अध्याय 3: राज्य के नीति निर्देशक तत्व (भाग-4, अनुच्छेद 36 से 51)
नीति निर्देशक तत्व आयरलैंड के संविधान से प्रेरित हैं और कल्याणकारी राज्य (Welfare State) की स्थापना करते हैं।
अनुच्छेद 40: ग्राम पंचायतों का गठन और स्वशासन।
अनुच्छेद 44: संपूर्ण देश में समान नागरिक संहिता (Uniform Civil Code - UCC)।
अनुच्छेद 45: बालकों के लिए प्रारंभिक बाल्यावस्था देखरेख और शिक्षा।
अनुच्छेद 51: अंतर्राष्ट्रीय शांति और सुरक्षा की अभिवृद्धि।`
  }
];
