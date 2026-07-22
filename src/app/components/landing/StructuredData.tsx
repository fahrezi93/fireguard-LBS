import Script from 'next/script';

const StructuredData = () => {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "SiagaBencana Plaju Darat",
        "url": "https://www.siagabencana.cloud",
        "logo": "https://www.siagabencana.cloud/favicon.png",
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "113",
            "contactType": "emergency service",
            "areaServed": "ID",
            "availableLanguage": "Indonesian"
        },
        "sameAs": [
            "https://facebook.com/siagabencana",
            "https://instagram.com/siagabencana"
        ]
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Apakah layanan SiagaBencana ini gratis?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Ya, SiagaBencana adalah inisiatif swadaya untuk publik dan sepenuhnya GRATIS 100% tanpa biaya tersembunyi bagi seluruh masyarakat Plaju, Palembang."
                }
            },
            {
                "@type": "Question",
                "name": "Apakah bisa melapor tanpa koneksi internet yang stabil?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Aplikasi ini didesain sangat ringan (PWA). Namun jika koneksi Anda benar-benar terputus, sistem akan mengarahkan Anda ke tombol Darurat Seluler (113)."
                }
            }
        ]
    };

    return (
        <>
            <Script
                id="organization-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <Script
                id="faq-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
        </>
    );
};

export default StructuredData;
