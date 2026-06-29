interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  const htmlContent = { __html: JSON.stringify(breadcrumbList) };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={htmlContent} />
  );
}

interface WebPageJsonLdProps {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export function WebPageJsonLd({
  title,
  description,
  url,
  image,
}: WebPageJsonLdProps) {
  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
    image,
    inLanguage: "pt-BR",
  };

  const htmlContent = { __html: JSON.stringify(webPage) };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={htmlContent} />
  );
}

interface BookJsonLdProps {
  name: string;
  author: string;
  url: string;
}

export function BookJsonLd({ name, author, url }: BookJsonLdProps) {
  const book = {
    "@context": "https://schema.org",
    "@type": "Book",
    name,
    author: {
      "@type": "Person",
      name: author,
    },
    url,
    inLanguage: "pt-BR",
  };

  const htmlContent = { __html: JSON.stringify(book) };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={htmlContent} />
  );
}
