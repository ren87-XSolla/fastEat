import { Injectable, Logger } from '@nestjs/common';
import { Args, Field, ID, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { Database } from './db';
import { BookingEvents } from './events';

@ObjectType()
class Offer {
  @Field(() => ID) id!: string;
  @Field() title!: string;
  @Field() cafeName!: string;
  @Field() description!: string;
  @Field(() => Int) originalPriceCents!: number;
  @Field(() => Int) priceCents!: number;
  @Field(() => Int) remaining!: number;
}

@ObjectType()
class Reservation {
  @Field(() => ID) id!: string;
  @Field(() => ID) offerId!: string;
  @Field(() => Int) priceCents!: number;
  @Field() createdAt!: Date;
}

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    private readonly db: Database,
    private readonly events: BookingEvents,
  ) {}

  list() {
    return this.db.offer.findMany({ orderBy: { id: 'asc' } });
  }

  async reserve(offerId: string) {
    const reservation = await this.db.$transaction(async (tx) => {
      const updated = await tx.offer.updateMany({
        where: { id: offerId, remaining: { gt: 0 } },
        data: { remaining: { decrement: 1 } },
      });

      if (updated.count === 0) {
        throw new GraphQLError('Cette offre est indisponible.', {
          extensions: { code: 'OFFER_UNAVAILABLE' },
        });
      }

      const { priceCents } = await tx.offer.findUniqueOrThrow({ where: { id: offerId } });
      return tx.reservation.create({ data: { offerId, priceCents } });
    });

    try {
      await this.events.reservationCreated(reservation);
    } catch (error) {
      this.logger.error(`Kafka publication failed for reservation ${reservation.id}`, error);
    }
    return reservation;
  }
}

@Resolver()
export class OffersResolver {
  constructor(private readonly offers: OffersService) {}

  @Query(() => [Offer])
  offersList() {
    return this.offers.list();
  }

  @Mutation(() => Reservation)
  reserveOffer(@Args('offerId', { type: () => ID }) offerId: string) {
    return this.offers.reserve(offerId);
  }
}
