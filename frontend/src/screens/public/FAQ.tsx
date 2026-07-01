import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api';

interface FaqItem {
  question: string;
  answer: string;
  category: 'admissions' | 'academics' | 'general';
}

const FAQ: React.FC = () => {
  const { t } = useTranslation();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const defaultFaqs: FaqItem[] = [
    { category: 'admissions', question: t('faq.q1'), answer: t('faq.a1') },
    { category: 'admissions', question: t('faq.q2'), answer: t('faq.a2') },
    { category: 'academics', question: t('faq.q3'), answer: t('faq.a3') },
    { category: 'academics', question: t('faq.q4'), answer: t('faq.a4') },
    { category: 'general', question: t('faq.q5'), answer: t('faq.a5') },
    { category: 'general', question: t('faq.q6'), answer: t('faq.a6') }
  ];

  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    setFaqs(defaultFaqs);

    api.get('/public/cms').then(res => {
      const data = res.data.data;
      if (data?.cms_faq_list && Array.isArray(data.cms_faq_list) && data.cms_faq_list.length > 0) {
        setFaqs(data.cms_faq_list);
      }
    }).catch(() => {/* fall back to defaults */});
  }, [t]);

  const toggleFaq = (index: number) => {
    setActiveIdx((prev) => (prev === index ? null : index));
  };

  return (
    <div className="public-subpage faq-page">
      <header className="page-header">
        <div className="header-container">
          <h1>{t('faq.title')}</h1>
          <p>{t('faq.subtitle')}</p>
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
