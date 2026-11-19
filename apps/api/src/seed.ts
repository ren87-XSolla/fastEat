import 'dotenv/config';
import { Database } from './db';

const offers = [
  {
    id: 'demo-viennoiseries',
    title: 'Panier de viennoiseries',
    cafeName: 'Café du Passage',
    description: 'Un assortiment de croissants et de pains au chocolat.',
    originalPriceCents: 1200,
    priceCents: 390,
    remaining: 4,
  },
  {
    id: 'demo-tartines',
    title: 'Tartines du matin',
    cafeName: 'Maison des Tournelles',
    description: 'Deux tartines de saison sur du pain au levain.',
    originalPriceCents: 1400,
    priceCents: 490,
    remaining: 3,
  },
  {
    id: 'demo-granola',
    title: 'Bol granola',
    cafeName: 'Comptoir de la Bastille',
    description: 'Granola maison, yaourt et fruits de saison.',
    originalPriceCents: 950,
    priceCents: 320,
    remaining: 2,
  },
];

const db = new Database();
void db.offer.createMany({ data: offers, skipDuplicates: true })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
