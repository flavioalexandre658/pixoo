/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://pixooai.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/api/*',
    '/server-sitemap.xml',
    '/_next/*',
    '/static/*'
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/static/']
      }
    ],
    additionalSitemaps: [
      'https://pixoo.ai/sitemap.xml'
    ]
  },
  transform: async (config, path) => {
    // Configuração para múltiplos idiomas
    const locales = ['pt', 'en', 'es'];
    const defaultLocale = 'pt';

    // URLs que devem ter versões em todos os idiomas
    const multiLanguageRoutes = [
      '/',
      '/pricing',
      '/privacy-policy',
      '/terms-of-use',
      '/ai-image-generator',
      '/generador-imagenes-ia',
      '/gerador-imagens-ia'
    ];


    // URLs que não devem estar no sitemap público
    const excludedRoutes = [
      '/dashboard',
      '/history',
      '/sign-in',
      '/sign-up',
      '/forgot-password',
      '/reset-password'
    ];

    // Pular URLs que não devem estar no sitemap
    if (excludedRoutes.some(route => path.includes(route))) {
      return null;
    }

    // Determinar prioridade baseada na rota
    let priority = 0.7;
    if (path === '/' || path === '/pt' || path === '/pt/') {
      priority = 1.0;
    } else if (multiLanguageRoutes.some(route => path.includes(route))) {
      priority = 0.9;
    } else if (path.includes('/pricing')) {
      priority = 0.8;
    }

    // Determinar frequência de mudança
    let changefreq = 'weekly';
    if (path === '/' || path === '/pt' || path === '/pt/') {
      changefreq = 'daily';
    } else if (path.includes('/pricing')) {
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
      alternateRefs: locales.map(locale => ({
        href: `${config.siteUrl}${locale === defaultLocale ? '' : `/${locale}`}${path === '/' ? '' : path}`,
        hreflang: locale
      }))
    };
  },
  additionalPaths: async (config) => {
    const locales = ['pt', 'en', 'es'];
    const defaultLocale = 'pt';
    const paths = [];

    // Rotas principais para cada idioma
    const mainRoutes = [
      '/',
      '/pricing',
      '/privacy-policy',
      '/terms-of-use',
      '/explore',
      '/create-image',
      '/edit-image'
    ];

    // Rotas específicas de geração de imagens por idioma
    const imageGeneratorRoutes = {
      'pt': '/gerador-imagens-ia',
      'en': '/ai-image-generator',
      'es': '/generador-imagenes-ia'
    };

    // Adicionar rotas principais para cada idioma
    locales.forEach(locale => {
      mainRoutes.forEach(route => {
        const path = locale === defaultLocale ? route : `/${locale}${route}`;
        paths.push({
          loc: path,
          changefreq: route === '/' ? 'daily' : 'weekly',
          priority: route === '/' ? 1.0 : 0.8,
          lastmod: new Date().toISOString()
        });
      });

      // Adicionar rota específica de geração de imagens
      if (imageGeneratorRoutes[locale]) {
        const path = locale === defaultLocale ?
          imageGeneratorRoutes[locale] :
          `/${locale}${imageGeneratorRoutes[locale]}`;
        paths.push({
          loc: path,
          changefreq: 'weekly',
          priority: 0.9,
          lastmod: new Date().toISOString()
        });
      }
    });

    return paths;
  }
};