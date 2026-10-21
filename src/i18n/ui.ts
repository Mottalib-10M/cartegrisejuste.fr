import type { Locale } from './routes';
const fr = {
  updatedOn: 'Mis à jour le', editorialPolicy: 'Charte éditoriale', contactLabel: 'Contact', reviewedBy: 'Vérifié par',
  skipToContent: 'Aller au contenu', mainNav: 'Navigation principale', breadcrumbLabel: 'Fil d’Ariane', breadcrumbHome: 'Accueil', menuOpen: 'Ouvrir le menu',
  faqTitle: 'Questions fréquentes', relatedCalculators: 'Pages et calculs associés', sourcesTitle: 'Sources', writtenBy: 'Rédigé par',
  asOf: 'Barèmes', lastUpdated: 'relus le', footerValidated: 'Sources : CIBS (Légifrance), service-public.gouv.fr, délibérations des régions', footerBrowser: 'Calcul fait dans votre navigateur · aucun compte · aucun numéro demandé · gratuit',
  footerDisclaimer: 'Site indépendant édité par Radif Partners, sans lien avec l’ANTS, le ministère de l’Intérieur, les régions ni aucun professionnel de l’automobile. La démarche se fait gratuitement sur le site de l’ANTS ; vous ne payez que les taxes. Les montants affichés sont des estimations : le montant calculé par l’ANTS au moment de la demande fait foi.', footerPopular: '', notFound: 'Cette page n’existe pas.',
  readMore: 'Lire la suite',
};
const en: typeof fr = {
  updatedOn: 'Updated on', editorialPolicy: 'Editorial policy', contactLabel: 'Contact', reviewedBy: 'Checked by',
  skipToContent: 'Skip to content', mainNav: 'Main navigation', breadcrumbLabel: 'Breadcrumb', breadcrumbHome: 'Home', menuOpen: 'Open menu',
  faqTitle: 'Frequently asked questions', relatedCalculators: 'Related pages and calculations', sourcesTitle: 'Sources', writtenBy: 'Written by',
  asOf: 'Rates', lastUpdated: 'checked on', footerValidated: 'Sources: French tax code (CIBS, Légifrance), service-public.gouv.fr, regional council resolutions', footerBrowser: 'Worked out in your browser · no account · no phone number · free',
  footerDisclaimer: 'Independent site published by Radif Partners, with no link to the ANTS, the Ministry of the Interior, the regions or any motor trade business. The application is free on the official ANTS website; you only pay the taxes. Amounts shown are estimates only: the amount the ANTS works out when you apply is the one that counts.', footerPopular: '', notFound: 'This page does not exist.',
  readMore: 'Read more',
};
export function t(lang: Locale) { return lang === 'en' ? en : fr; }
