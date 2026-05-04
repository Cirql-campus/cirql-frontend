import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_DATA = [
  {
    question: 'Is CirQl free to use?',
    answer: 'CirQl charges zero commission. Users keep 100% of their earnings with no hidden fees.'
  },
  {
    question: 'What does CirQl stand for?',
    answer: 'CirQl means creating a closed circle of verified college students where buying, selling, renting, and sharing stays within your campus community.'
  },
  {
    question: 'Who can use CirQl?',
    answer: 'Only students with verified college email IDs can join, ensuring a trusted campus-only environment.'
  },
  {
    question: 'How do I buy or sell items?',
    answer: 'Users can list items, browse listings, contact sellers, and meet within campus to complete the exchange.'
  },
  {
    question: 'Does CirQl handle payments or delivery?',
    answer: 'No, CirQl is a peer-to-peer platform where users handle transactions directly in person.'
  },
  {
    question: 'Is it safe to use?',
    answer: 'Yes, all users are verified students from the same campus, creating a secure and reliable ecosystem.'
  },
  {
    question: 'What items can I list?',
    answer: 'Academic items such as books, calculators, lab tools, electronics, and project components.'
  }
];

export const Faq = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      <style>{`
        .faq-container {
          max-width: 860px;
          margin: 0 auto;
          padding: 60px 20px;
        }
        .faq-heading {
          font-family: var(--font-display, inherit);
          font-size: 38px;
          font-weight: 900;
          text-align: center;
          margin-bottom: 8px;
          color: var(--gray-900, #111827);
        }
        .faq-subheading {
          font-size: 16px;
          color: var(--gray-500, #6b7280);
          text-align: center;
          margin-bottom: 40px;
        }
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .faq-item {
          background: #fff;
          border: 1px solid var(--gray-200, #e5e7eb);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
        }
        .faq-item:hover {
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
          border-color: rgba(34, 197, 94, 0.4);
        }
        .faq-item.active {
          border-color: #22c55e;
          box-shadow: 0 4px 20px rgba(34, 197, 94, 0.12);
        }
        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 24px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
          color: var(--gray-800, #1f2937);
          text-align: left;
          font-family: inherit;
        }
        .faq-icon {
          color: var(--gray-400, #9ca3af);
          transition: transform 0.3s ease, color 0.3s ease;
          flex-shrink: 0;
          margin-left: 16px;
        }
        .active .faq-icon {
          transform: rotate(180deg);
          color: #22c55e;
        }
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
          background: #fff;
          font-size: 15px;
          line-height: 1.6;
          color: var(--gray-600, #4b5563);
          padding: 0 24px;
        }
        .active .faq-answer {
          max-height: 200px;
          padding: 0 24px 24px 24px;
        }
      `}</style>
      <div>
        <h2 className="faq-heading">Frequently Asked Questions</h2>
        <p className="faq-subheading">Everything you need to know about using CirQl</p>
        
        <div className="faq-list">
          {FAQ_DATA.map((faq, index) => (
            <div key={index} className={`faq-item ${activeIndex === index ? 'active' : ''}`}>
              <button 
                className="faq-question" 
                onClick={() => toggleAccordion(index)}
                aria-expanded={activeIndex === index}
              >
                {faq.question}
                <ChevronDown size={20} className="faq-icon" />
              </button>
              <div className="faq-answer">
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
