import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/dashboard/',
                '/operator/',
                '/onboarding/',
            ],
        },
        sitemap: 'https://www.siagabencana-palembang.my.id/sitemap.xml',
    };
}
