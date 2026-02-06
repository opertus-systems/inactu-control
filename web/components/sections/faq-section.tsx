import { FaqItem } from "../../lib/site-content";

type FaqSectionProps = {
  title: string;
  items: FaqItem[];
};

export function FaqSection({ title, items }: FaqSectionProps) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <ul className="faq-list">
        {items.map((item) => (
          <li key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
