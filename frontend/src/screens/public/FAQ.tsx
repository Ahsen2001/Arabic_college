import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api';

interface FaqItem {
  question: string;
  answer: string;
  category: 'admissions' | 'academics' | 'general';
}

const FAQ: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const defaultFaqs: FaqItem[] = [
    { category: 'admissions', question: 'When do registrations for new applicants open?', answer: 'Admissions registrations typically open in late June and close on July 31st. All documents including high school transcripts and ID copies must be uploaded during this period.' },
    { category: 'admissions', question: 'How does the placement entrance exam work?', answer: 'After submitting your application online, qualified applicants will sit for an Arabic language placement entrance exam in mid-August. This helps determine your suitability for advanced classical tracks.' },
    { category: 'academics', question: 'What language are classes taught in?', answer: 'All major modules (Islamic Sharia law, Hadith chain critiques, Arabic literature) are taught entirely in classical Arabic. General utility courses or linguistic tools might use translated guides, but core instructions are in Arabic.' },
    { category: 'academics', question: 'Are the programs accredited?', answer: 'Yes. All undergraduate degree programs (Bachelor of Sharia, Bachelor of Arabic Language, and Bachelor of Hadith Sciences) are fully accredited by national educational regulatory boards.' },
    { category: 'general', question: 'How do I pay my semester tuition invoice fees?', answer: 'Student invoices are generated at the start of each semester. You can log in to your student portal dashboard, check invoices, and make payments using card, bank transfer, or check.' },
    { category: 'general', question: "What should I do if I didn't receive my email verification OTP?", answer: 'Check your spam/junk folder. Alternatively, you can click "Resend OTP" on the verification screen. Local testing environments write these emails directly to the system logs.' }
  ];

  const [faqs, setFaqs] = useState<FaqItem[]>(defaultFaqs);

  useEffect(() => {
    api.get('/public/cms').then(res => {
      const data = res.data.data;
      if (data?.cms_faq_list && Array.isArray(data.cms_faq_list) && data.cms_faq_list.length > 0) {
        setFaqs(data.cms_faq_list);
      }
    }).catch(() => {/* fall back to defaults */});
  }, []);

  const toggleFaq = (index: number) => {
    setActiveIdx((prev) => (prev === index ? null : index));
  };

  return (
    <div className="public-subpage faq-page">
      <header className="page-header">
        <div className="header-container">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about admissions, programs, and portals</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          <div className="faq-accordion-list">
            {faqs.map((faq, index) => {
              const isOpen = activeIdx === index;
              return (
                <div key={index} className={`faq-item-card ${isOpen ? 'open' : ''}`}>
                  <button onClick={() => toggleFaq(index)} className="faq-question-row">
                    <div className="question-text">
                      <HelpCircle size={18} className="faq-icon" />
                      <span>{faq.question}</span>
                    </div>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <div className={`faq-answer-row ${isOpen ? 'show' : ''}`}>
                    <div className="answer-content">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
