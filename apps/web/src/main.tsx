import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client';
import { ApolloProvider, useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Offer = {
  id: string;
  title: string;
  cafeName: string;
  description: string;
  originalPriceCents: number;
  priceCents: number;
  remaining: number;
};

const getOffers = gql`
  query Offers {
    offersList {
      id
      title
      cafeName
      description
      originalPriceCents
      priceCents
      remaining
    }
  }
`;

const reserveOffer = gql`
  mutation ReserveOffer($offerId: ID!) {
    reserveOffer(offerId: $offerId) { id }
  }
`;

const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache(),
});
const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const price = (cents: number) => euros.format(cents / 100);

function App() {
  const { data, loading, error, refetch } = useQuery<{ offersList: Offer[] }>(getOffers);
  const [reserve] = useMutation(reserveOffer);
  const [pending, setPending] = useState<string>();
  const [notice, setNotice] = useState('');

  async function book(offer: Offer) {
    setPending(offer.id);
    setNotice('');
    try {
      await reserve({ variables: { offerId: offer.id } });
      setNotice(`Réservation confirmée · ${offer.title}`);
    } catch {
      setNotice('La réservation a échoué. Vérifiez la disponibilité.');
    } finally {
      await refetch().catch(() => undefined);
      setPending(undefined);
    }
  }

  return (
    <main>
      <header>
        <strong className="brand">FastEat</strong>
        <span>Paris · Bastille</span>
      </header>
      <section className="intro">
        <h1>Le petit-déjeuner a du rab.</h1>
        <p>Réservez les invendus du matin des cafés du quartier à prix réduit.</p>
      </section>
      <section aria-label="Offres du matin">
        <p className="notice" role="status">{notice}</p>
        {loading && <p>Chargement des offres…</p>}
        {error && <p role="alert">Impossible de charger les offres. <button onClick={() => void refetch()}>Réessayer</button></p>}
        <div className="offers">
          {data?.offersList.map((offer) => (
            <article key={offer.id}>
              <p className="cafe">{offer.cafeName}</p>
              <h2>{offer.title}</h2>
              <p className="description">{offer.description}</p>
              <p className="price"><strong>{price(offer.priceCents)}</strong> <del>{price(offer.originalPriceCents)}</del></p>
              <p className="stock">{offer.remaining} disponible{offer.remaining === 1 ? '' : 's'}</p>
              <button
                type="button"
                disabled={offer.remaining === 0 || pending !== undefined}
                onClick={() => void book(offer)}
              >
                {offer.remaining === 0 ? 'Épuisé' : pending === offer.id ? 'Réservation…' : 'Réserver'}
              </button>
            </article>
          ))}
        </div>
      </section>
      <footer>Démo · Cafés fictifs · Sans paiement ni livraison</footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <ApolloProvider client={client}><App /></ApolloProvider>,
);
