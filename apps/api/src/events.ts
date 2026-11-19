import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Partitioners } from 'kafkajs';
import type { Reservation } from './generated/prisma/client';

@Injectable()
export class BookingEvents implements OnModuleInit, OnModuleDestroy {
  private readonly producer = new Kafka({
    clientId: 'fasteat',
    brokers: [process.env.KAFKA_BROKER ?? '127.0.0.1:9092'],
    retry: { retries: 2 },
  }).producer({ createPartitioner: Partitioners.DefaultPartitioner });

  async onModuleInit() {
    await this.producer.connect();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async reservationCreated(reservation: Reservation) {
    await this.producer.send({
      topic: 'fasteat.reservations.created',
      timeout: 5000,
      messages: [{ key: reservation.id, value: JSON.stringify(reservation) }],
    });
  }
}
