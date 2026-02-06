type TrustStripProps = {
  brands: string[];
};

export function TrustStrip({ brands }: TrustStripProps) {
  return (
    <section className="trust-strip" aria-label="Trusted by teams">
      <p>Trusted by teams at:</p>
      <ul>
        {brands.map((brand) => (
          <li key={brand}>{brand}</li>
        ))}
      </ul>
    </section>
  );
}
