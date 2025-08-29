import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticketId: string;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  url: string;

  @Column()
  uploadedBy: string;

  @CreateDateColumn()
  uploadedAt: Date;

  @ManyToOne(() => Ticket, ticket => ticket.attachments)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedBy' })
  uploadedByUser: User;
}
