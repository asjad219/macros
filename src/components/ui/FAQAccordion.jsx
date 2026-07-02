import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { trackFAQOpened } from '../../lib/analytics';

/**
 * FAQ Accordion with smooth height animation.
 * Each item targets People Also Ask / featured snippets.
 */
export default function FAQAccordion({ items, page = 'home' }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    const newIndex = openIndex === idx ? null : idx;
    setOpenIndex(newIndex);
    if (newIndex !== null) {
      trackFAQOpened(idx, page);
    }
  };

  return (
    <div className="space-y-0" role="list">
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`faq-item${openIndex === idx ? ' open' : ''}`}
          role="listitem"
        >
          <button
            onClick={() => toggle(idx)}
            className="faq-question"
            aria-expanded={openIndex === idx}
            aria-controls={`faq-answer-${idx}`}
            id={`faq-question-${idx}`}
          >
            <span>{item.question}</span>
            <ChevronDown
              size={18}
              className="faq-chevron"
            />
          </button>
          <div
            id={`faq-answer-${idx}`}
            role="region"
            aria-labelledby={`faq-question-${idx}`}
            className={`faq-answer${openIndex === idx ? ' open' : ''}`}
          >
            <p>{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
